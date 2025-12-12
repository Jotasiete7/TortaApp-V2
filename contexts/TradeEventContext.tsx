import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
}

export interface TradeAlert {
    id: string;
    term: string;
    enabled: boolean;
}

// Timer & Ads Types
export interface TimerConfig {
    duration: number; // minutes
    label: string;
    color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
    soundEnabled: boolean;
}

export interface AdTemplate {
    id: string;
    label: string;
    content: string;
}

interface TradeEventContextType {
    trades: ParsedTrade[];
    isMonitoring: boolean;
    startMonitoring: (filePath: string) => Promise<void>;
    stopMonitoring: () => void;
    
    // Alerts
    alerts: TradeAlert[];
    addAlert: (term: string) => void;
    removeAlert: (id: string) => void;
    toggleAlert: (id: string) => void;
    
    // Settings
    quickMsgTemplate: string;
    setQuickMsgTemplate: (template: string) => void;

    // Timer
    timerConfig: TimerConfig;
    setTimerConfig: (config: TimerConfig) => void;
    timerEndTime: number | null; // Timestamp
    startTimer: () => void;
    stopTimer: () => void; // Actually resets/nulls it
    
    // Ads
    adTemplates: AdTemplate[];
    addTemplate: (label: string, content: string) => void;
    removeTemplate: (id: string) => void;
    updateTemplate: (id: string, updates: Partial<AdTemplate>) => void;
}

const defaultTimerConfig: TimerConfig = {
    duration: 30,
    label: 'WTS Cooldown',
    color: 'emerald',
    soundEnabled: true
};

const TradeEventContext = createContext<TradeEventContextType>({
    trades: [],
    isMonitoring: false,
    startMonitoring: async () => {},
    stopMonitoring: () => {},
    alerts: [],
    addAlert: () => {},
    removeAlert: () => {},
    toggleAlert: () => {},
    quickMsgTemplate: '',
    setQuickMsgTemplate: () => {},
    
    timerConfig: defaultTimerConfig,
    setTimerConfig: () => {},
    timerEndTime: null,
    startTimer: () => {},
    stopTimer: () => {},
    
    adTemplates: [],
    addTemplate: () => {},
    removeTemplate: () => {},
    updateTemplate: () => {}
});

export const useTradeEvents = () => useContext(TradeEventContext);

const STORAGE_KEY = 'live_trade_monitor_state';
const ALERTS_KEY = 'live_trade_alerts';
const TEMPLATE_KEY = 'live_trade_quick_msg';
const TIMER_CONFIG_KEY = 'live_trade_timer_config';
const ADS_KEY = 'live_trade_ads';

export const TradeEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- Existing State ---
    const [trades, setTrades] = useState<ParsedTrade[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { wasMonitoring } = JSON.parse(saved);
                return wasMonitoring || false;
            } catch { return false; }
        }
        return false;
    });
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<TradeAlert[]>(() => {
        const saved = localStorage.getItem(ALERTS_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [quickMsgTemplate, setQuickMsgTemplateState] = useState(() => {
        return localStorage.getItem(TEMPLATE_KEY) || '/t {nick} Hello, cod me this';
    });

    // --- NEW: Timer State ---
    const [timerConfig, setTimerConfigState] = useState<TimerConfig>(() => {
        const saved = localStorage.getItem(TIMER_CONFIG_KEY);
        return saved ? JSON.parse(saved) : defaultTimerConfig;
    });
    const [timerEndTime, setTimerEndTime] = useState<number | null>(null);

    // --- NEW: Ads State ---
    const [adTemplates, setAdTemplates] = useState<AdTemplate[]>(() => {
        const saved = localStorage.getItem(ADS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // --- Actions ---

    // Settings
    const setQuickMsgTemplate = (template: string) => {
        setQuickMsgTemplateState(template);
        localStorage.setItem(TEMPLATE_KEY, template);
    };

    // Alerts
    const addAlert = (term: string) => {
        const newAlert: TradeAlert = { id: crypto.randomUUID(), term, enabled: true };
        const updated = [...alerts, newAlert];
        setAlerts(updated);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    };
    const removeAlert = (id: string) => {
        const updated = alerts.filter(a => a.id !== id);
        setAlerts(updated);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    };
    const toggleAlert = (id: string) => {
        const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
        setAlerts(updated);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    };

    // Timer
    const setTimerConfig = (config: TimerConfig) => {
        setTimerConfigState(config);
        localStorage.setItem(TIMER_CONFIG_KEY, JSON.stringify(config));
    };
    const startTimer = () => {
        const end = Date.now() + (timerConfig.duration * 60 * 1000);
        setTimerEndTime(end);
    };
    const stopTimer = () => {
        setTimerEndTime(null);
    };

    // Ads
    const addTemplate = (label: string, content: string) => {
        const newAd: AdTemplate = { id: crypto.randomUUID(), label, content };
        const updated = [...adTemplates, newAd];
        setAdTemplates(updated);
        localStorage.setItem(ADS_KEY, JSON.stringify(updated));
    };
    const removeTemplate = (id: string) => {
        const updated = adTemplates.filter(a => a.id !== id);
        setAdTemplates(updated);
        localStorage.setItem(ADS_KEY, JSON.stringify(updated));
    };
    const updateTemplate = (id: string, updates: Partial<AdTemplate>) => {
        const updated = adTemplates.map(a => a.id === id ? { ...a, ...updates } : a);
        setAdTemplates(updated);
        localStorage.setItem(ADS_KEY, JSON.stringify(updated));
    };

    // --- Effects ---

    // Permission Check
    useEffect(() => {
        const checkPerms = async () => {
             // @ts-ignore
            if (window.__TAURI_INTERNALS__) {
                let permissionGranted = await isPermissionGranted();
                if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                }
            }
        };
        checkPerms();
    }, []);

    // Listener
    useEffect(() => {
        let unlistenFn: (() => void) | undefined;
        
        const setupListener = async () => {
            try {
                // @ts-ignore
                if (!window.__TAURI_INTERNALS__) return;
                
                unlistenFn = await listen<ParsedTrade>('trade-event', (event) => {
                    const newTrade = event.payload;
                    
                    setTrades(prev => {
                        const newTrades = [...prev, newTrade];
                        return newTrades.slice(-20);
                    });

                    // Check Alerts
                    const currentAlertsStr = localStorage.getItem(ALERTS_KEY);
                    if (currentAlertsStr) {
                        try {
                            const currentAlerts: TradeAlert[] = JSON.parse(currentAlertsStr);
                            const activeAlerts = currentAlerts.filter(a => a.enabled);
                            
                            for (const alert of activeAlerts) {
                                if (newTrade.message.toLowerCase().includes(alert.term.toLowerCase())) {
                                    sendNotification({
                                        title: `TortaApp: Match Found!`,
                                        body: `${newTrade.nick}: ${newTrade.message}`,
                                    });
                                    break;
                                }
                            }
                        } catch (e) { console.error('Error checking alerts', e); }
                    }
                });
            } catch (e) { console.error('setup failed', e); }
        };
        
        setupListener();
        return () => { if (unlistenFn) unlistenFn(); };
    }, []);

    // Restore Monitoring
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const { filePath, wasMonitoring } = JSON.parse(savedState);
                if (wasMonitoring && filePath) {
                    setCurrentFilePath(filePath);
                    // @ts-ignore
                    if (window.__TAURI_INTERNALS__) {
                        invoke('start_trade_watcher', { path: filePath })
                            .catch(err => console.error('Failed to restore monitoring:', err));
                    }
                }
            } catch (e) { console.warn('Failed to restore monitoring state:', e); }
        }
    }, []);

    const startMonitoring = useCallback(async (filePath: string) => {
        try {
            // @ts-ignore
            if (!window.__TAURI_INTERNALS__) return;
            await invoke('start_trade_watcher', { path: filePath });
            setCurrentFilePath(filePath);
            setIsMonitoring(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ filePath, wasMonitoring: true }));
        } catch (error) {
            console.error('Failed to start monitoring:', error);
            throw error;
        }
    }, []);

    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false);
        setCurrentFilePath(null);
        setTrades([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <TradeEventContext.Provider value={{ 
            trades, 
            isMonitoring, 
            startMonitoring, 
            stopMonitoring,
            alerts,
            addAlert,
            removeAlert,
            toggleAlert,
            quickMsgTemplate,
            setQuickMsgTemplate,
            // Timer
            timerConfig,
            setTimerConfig,
            timerEndTime,
            startTimer,
            stopTimer,
            // Ads
            adTemplates,
            addTemplate,
            removeTemplate,
            updateTemplate
        }}>
            {children}
        </TradeEventContext.Provider>
    );
};
