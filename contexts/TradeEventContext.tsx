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
}

const TradeEventContext = createContext<TradeEventContextType>({
    trades: [],
    isMonitoring: false,
    startMonitoring: async () => {},
    stopMonitoring: () => {},
    alerts: [],
    addAlert: () => {},
    removeAlert: () => {},
    toggleAlert: () => {},
    quickMsgTemplate: '/t {nick} Hello, cod me this',
    setQuickMsgTemplate: () => {}
});

export const useTradeEvents = () => useContext(TradeEventContext);

const STORAGE_KEY = 'live_trade_monitor_state';
const ALERTS_KEY = 'live_trade_alerts';
const TEMPLATE_KEY = 'live_trade_quick_msg';

export const TradeEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from localStorage immediately
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

    // Alerts State
    const [alerts, setAlerts] = useState<TradeAlert[]>(() => {
        const saved = localStorage.getItem(ALERTS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // Template State
    const [quickMsgTemplate, setQuickMsgTemplateState] = useState(() => {
        return localStorage.getItem(TEMPLATE_KEY) || '/t {nick} Hello, cod me this';
    });

    const setQuickMsgTemplate = (template: string) => {
        setQuickMsgTemplateState(template);
        localStorage.setItem(TEMPLATE_KEY, template);
    };

    // Alert Actions
    const addAlert = (term: string) => {
        const newAlert: TradeAlert = {
            id: crypto.randomUUID(),
            term,
            enabled: true
        };
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
        const updated = alerts.map(a => 
            a.id === id ? { ...a, enabled: !a.enabled } : a
        );
        setAlerts(updated);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    };

    // Check Notifications Permission
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

    // Setup global listener - runs once on mount
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
                        return newTrades.slice(-20); // Keep last 20 for freer scrolling
                    });

                    // Check Alerts
                    // IMPORTANT: We need to use the CURRENT alerts value. 
                    // Since this is inside a closer, we can't depend on 'alerts' state directly unless we include it in deps,
                    // which would re-subscribe every time alerts change. 
                    // Strategy: Read from localStorage or ref for the check to avoid re-subscribing.
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
                                    break; // Notify once per trade even if multiple matches
                                }
                            }
                        } catch (e) {
                            console.error('Error checking alerts', e);
                        }
                    }
                });
            } catch (e) { 
                console.error('TradeEventProvider setup failed:', e); 
            }
        };
        
        setupListener();
        
        return () => { 
            if (unlistenFn) unlistenFn();
        };
    }, []);

    // Auto-restore monitoring on mount
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        
        if (savedState) {
            try {
                const { filePath, wasMonitoring } = JSON.parse(savedState);
                
                if (wasMonitoring && filePath) {
                    setCurrentFilePath(filePath);
                    
                    // Re-invoke backend watcher
                    // @ts-ignore
                    if (window.__TAURI_INTERNALS__) {
                        invoke('start_trade_watcher', { path: filePath })
                            .catch(err => console.error('Failed to restore monitoring:', err));
                    }
                }
            } catch (e) {
                console.warn('Failed to restore monitoring state:', e);
            }
        }
    }, []);

    const startMonitoring = useCallback(async (filePath: string) => {
        try {
            // @ts-ignore
            if (!window.__TAURI_INTERNALS__) return;

            await invoke('start_trade_watcher', { path: filePath });
            
            setCurrentFilePath(filePath);
            setIsMonitoring(true);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                filePath,
                wasMonitoring: true
            }));
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
            setQuickMsgTemplate
        }}>
            {children}
        </TradeEventContext.Provider>
    );
};
