import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { AlertService } from '../services/AlertService';
import { TradeAlert, FiredAlert, MonitoringStats } from '../types/alerts';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
    type?: 'WTB' | 'WTS' | 'WTT';
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
    addAlert: (term: string, sound?: string, tradeTypes?: ('WTB'|'WTS'|'WTT')[]) => void;
    removeAlert: (id: string) => void;
    toggleAlert: (id: string) => void;

    // Alert History
    firedAlerts: FiredAlert[];
    clearAlertHistory: () => void;

    // Statistics
    stats: MonitoringStats;
    resetStats: () => void;

    // Settings
    quickMsgTemplate: string;
    setQuickMsgTemplate: (template: string) => void;

    // Timer
    timerConfig: TimerConfig;
    setTimerConfig: (config: TimerConfig) => void;
    timerEndTime: number | null;
    startTimer: () => void;
    stopTimer: () => void;

    // Ads
    adTemplates: AdTemplate[];
    addTemplate: (label: string, content: string) => void;
    removeTemplate: (id: string) => void;
    updateTemplate: (id: string, updates: Partial<AdTemplate>) => void;

    // DND Mode
    dndMode: boolean;
    setDndMode: (enabled: boolean) => void;
    dndSchedule: { start: string; end: string };
    setDndSchedule: (schedule: { start: string; end: string }) => void;

    // Export/Import
    exportConfig: () => void;
    importConfig: (file: File) => Promise<void>;
}

const defaultTimerConfig: TimerConfig = {
    duration: 30,
    label: 'WTS Cooldown',
    color: 'emerald',
    soundEnabled: true
};

const defaultStats: MonitoringStats = {
    wts: 0,
    wtb: 0,
    wtt: 0,
    alerts: 0,
    lastReset: new Date().toISOString().split('T')[0]
};

const TradeEventContext = createContext<TradeEventContextType>({
    trades: [],
    isMonitoring: false,
    startMonitoring: async () => { },
    stopMonitoring: () => { },
    alerts: [],
    addAlert: () => { },
    removeAlert: () => { },
    toggleAlert: () => { },
    firedAlerts: [],
    clearAlertHistory: () => { },
    stats: defaultStats,
    resetStats: () => { },
    quickMsgTemplate: '',
    setQuickMsgTemplate: () => { },
    timerConfig: defaultTimerConfig,
    setTimerConfig: () => { },
    timerEndTime: null,
    startTimer: () => { },
    stopTimer: () => { },
    adTemplates: [],
    addTemplate: () => { },
    removeTemplate: () => { },
    updateTemplate: () => { },
    dndMode: false,
    setDndMode: () => { },
    dndSchedule: { start: '22:00', end: '08:00' },
    setDndSchedule: () => { },
    exportConfig: () => { },
    importConfig: async () => { }
});

export const useTradeEvents = () => useContext(TradeEventContext);

const STORAGE_KEY = 'live_trade_monitor_state';
const ALERTS_KEY = 'live_trade_alerts';
const TEMPLATE_KEY = 'live_trade_quick_msg';
const TIMER_CONFIG_KEY = 'live_trade_timer_config';
const ADS_KEY = 'live_trade_ads';
const STATS_KEY = 'live_trade_stats';
const HISTORY_KEY = 'live_trade_history';
const DND_KEY = 'live_trade_dnd';
const DND_SCHEDULE_KEY = 'live_trade_dnd_schedule';

export const TradeEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- State ---
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
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: add tradeTypes to old alerts
            return parsed.map((a: any) => ({
                ...a,
                tradeTypes: a.tradeTypes || null
            }));
        }
        return [];
    });

    const [firedAlerts, setFiredAlerts] = useState<FiredAlert[]>(() => {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [stats, setStats] = useState<MonitoringStats>(() => {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Reset if different day
            const today = new Date().toISOString().split('T')[0];
            if (parsed.lastReset !== today) {
                return { ...defaultStats, lastReset: today };
            }
            return parsed;
        }
        return defaultStats;
    });

    const [quickMsgTemplate, setQuickMsgTemplateState] = useState(() => {
        return localStorage.getItem(TEMPLATE_KEY) || '/t {nick} Hello, cod me this';
    });

    const [timerConfig, setTimerConfigState] = useState<TimerConfig>(() => {
        const saved = localStorage.getItem(TIMER_CONFIG_KEY);
        return saved ? JSON.parse(saved) : defaultTimerConfig;
    });
    const [timerEndTime, setTimerEndTime] = useState<number | null>(null);

    const [adTemplates, setAdTemplates] = useState<AdTemplate[]>(() => {
        const saved = localStorage.getItem(ADS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [dndMode, setDndModeState] = useState(() => {
        const saved = localStorage.getItem(DND_KEY);
        return saved === 'true';
    });

    const [dndSchedule, setDndScheduleState] = useState<{ start: string; end: string }>(() => {
        const saved = localStorage.getItem(DND_SCHEDULE_KEY);
        return saved ? JSON.parse(saved) : { start: '22:00', end: '08:00' };
    });

    // Refs for Listener Access (prevents stale closures without re-subscribing)
    const dndModeRef = useRef(dndMode);
    const dndScheduleRef = useRef(dndSchedule);

    useEffect(() => {
        dndModeRef.current = dndMode;
        dndScheduleRef.current = dndSchedule;
    }, [dndMode, dndSchedule]);

    // --- Actions ---

    const setQuickMsgTemplate = (template: string) => {
        setQuickMsgTemplateState(template);
        localStorage.setItem(TEMPLATE_KEY, template);
    };

    const addAlert = (term: string, sound: string = 'notification', tradeTypes?: ('WTB'|'WTS'|'WTT')[]) => {
        const newAlert: TradeAlert = { 
            id: crypto.randomUUID(), 
            term, 
            enabled: true, 
            sound,
            tradeTypes: tradeTypes || null
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
        const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
        setAlerts(updated);
        localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    };

    const clearAlertHistory = () => {
        setFiredAlerts([]);
        localStorage.removeItem(HISTORY_KEY);
    };

    const resetStats = () => {
        const newStats = { ...defaultStats, lastReset: new Date().toISOString().split('T')[0] };
        setStats(newStats);
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    };

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

    const setDndMode = (enabled: boolean) => {
        setDndModeState(enabled);
        localStorage.setItem(DND_KEY, String(enabled));
    };

    const setDndSchedule = (schedule: { start: string; end: string }) => {
        setDndScheduleState(schedule);
        localStorage.setItem(DND_SCHEDULE_KEY, JSON.stringify(schedule));
    };

    const exportConfig = () => {
        const config = {
            alerts,
            adTemplates,
            timerConfig,
            quickMsgTemplate,
            dndMode,
            dndSchedule
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tortaapp-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importConfig = async (file: File) => {
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            if (config.alerts) {
                setAlerts(config.alerts);
                localStorage.setItem(ALERTS_KEY, JSON.stringify(config.alerts));
            }
            if (config.adTemplates) {
                setAdTemplates(config.adTemplates);
                localStorage.setItem(ADS_KEY, JSON.stringify(config.adTemplates));
            }
            if (config.timerConfig) {
                setTimerConfigState(config.timerConfig);
                localStorage.setItem(TIMER_CONFIG_KEY, JSON.stringify(config.timerConfig));
            }
            if (config.quickMsgTemplate) {
                setQuickMsgTemplateState(config.quickMsgTemplate);
                localStorage.setItem(TEMPLATE_KEY, config.quickMsgTemplate);
            }
            if (config.dndMode !== undefined) {
                setDndModeState(config.dndMode);
                localStorage.setItem(DND_KEY, String(config.dndMode));
            }
            if (config.dndSchedule) {
                setDndScheduleState(config.dndSchedule);
                localStorage.setItem(DND_SCHEDULE_KEY, JSON.stringify(config.dndSchedule));
            }
        } catch (error) {
            console.error('Failed to import config:', error);
            throw error;
        }
    };

    // --- Auto Backup ---
    useEffect(() => {
        const backupConfig = async () => {
            if (typeof window.__TAURI_INTERNALS__ === 'undefined') return;
            
            try {
                const config = {
                    alerts,
                    adTemplates,
                    timerConfig,
                    quickMsgTemplate,
                    dndMode,
                    dndSchedule
                };
                await writeTextFile('tortaapp-backup.json', JSON.stringify(config, null, 2), {
                    dir: BaseDirectory.AppData
                });
            } catch (error) {
                console.warn('Failed to backup config:', error);
            }
        };

        const interval = setInterval(backupConfig, 5 * 60 * 1000); // Every 5 minutes
        return () => clearInterval(interval);
    }, [alerts, adTemplates, timerConfig, quickMsgTemplate, dndMode, dndSchedule]);

    // --- Permission Check ---
    useEffect(() => {
        const checkPerms = async () => {
            if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
                let permissionGranted = await isPermissionGranted();
                if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                }
            }
        };
        checkPerms();
    }, []);

    // --- Listener ---
        useEffect(() => {
        let unlistenFn: (() => void) | undefined;
        let isAborted = false;

        const setupListener = async () => {
            try {
                if (typeof window.__TAURI_INTERNALS__ === 'undefined') return;

                const unlisten = await listen<ParsedTrade>('trade-event', (event) => {
                    const newTrade = event.payload;

                    // Update trades list (limit to 50)
                    setTrades(prev => {
                        // Dedup check: Ignore if timestamp and message identical to last one
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            if (last.timestamp === newTrade.timestamp && last.message === newTrade.message && last.nick === newTrade.nick) {
                                return prev;
                            }
                        }
                        const newTrades = [...prev, newTrade];
                        return newTrades.slice(-50);
                    });

                    // Update stats
                    setStats(prev => {
                        const today = new Date().toISOString().split('T')[0];
                        if (prev.lastReset !== today) {
                            return {
                                wts: newTrade.type === 'WTS' ? 1 : 0,
                                wtb: newTrade.type === 'WTB' ? 1 : 0,
                                wtt: newTrade.type === 'WTT' ? 1 : 0,
                                alerts: 0,
                                lastReset: today
                            };
                        }
                        
                        return {
                            ...prev,
                            wts: prev.wts + (newTrade.type === 'WTS' ? 1 : 0),
                            wtb: prev.wtb + (newTrade.type === 'WTB' ? 1 : 0),
                            wtt: prev.wtt + (newTrade.type === 'WTT' ? 1 : 0)
                        };
                    });

                    // Check Alerts
                    const currentAlertsStr = localStorage.getItem(ALERTS_KEY);
                    if (currentAlertsStr) {
                         try {
                            const currentAlerts: TradeAlert[] = JSON.parse(currentAlertsStr);
                            const matchedAlert = AlertService.checkAlerts(newTrade, currentAlerts);

                            if (matchedAlert) {
                                const isDnd = AlertService.isDndActive(dndModeRef.current, dndScheduleRef.current);
                                
                                if (!isDnd) {
                                    AlertService.fireAlert(matchedAlert, newTrade);
                                    
                                    const firedAlert = AlertService.createFiredAlert(matchedAlert, newTrade);
                                    setFiredAlerts(prev => {
                                        const updated = [firedAlert, ...prev].slice(0, 10);
                                        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
                                        return updated;
                                    });

                                    setStats(prev => {
                                        const updated = { ...prev, alerts: prev.alerts + 1 };
                                        localStorage.setItem(STATS_KEY, JSON.stringify(updated));
                                        return updated;
                                    });
                                }
                            }
                        } catch (e) { 
                            console.error('Error checking alerts', e); 
                        }
                    }
                });

                if (isAborted) {
                    unlisten();
                } else {
                    unlistenFn = unlisten;
                }
            } catch (e) { 
                console.error('setup failed', e); 
            }
        };

        setupListener();
        return () => { 
            isAborted = true;
            if (unlistenFn) unlistenFn(); 
        };
    }, []); // Listen once

    // --- Restore Monitoring ---
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const { filePath, wasMonitoring } = JSON.parse(savedState);
                if (wasMonitoring && filePath) {
                    setCurrentFilePath(filePath);
                    if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
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
            if (typeof window.__TAURI_INTERNALS__ === 'undefined') return;
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
            firedAlerts,
            clearAlertHistory,
            stats,
            resetStats,
            quickMsgTemplate,
            setQuickMsgTemplate,
            timerConfig,
            setTimerConfig,
            timerEndTime,
            startTimer,
            stopTimer,
            adTemplates,
            addTemplate,
            removeTemplate,
            updateTemplate,
            dndMode,
            setDndMode,
            dndSchedule,
            setDndSchedule,
            exportConfig,
            importConfig
        }}>
            {children}
        </TradeEventContext.Provider>
    );
};



