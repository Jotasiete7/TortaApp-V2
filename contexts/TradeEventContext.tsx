import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { AlertService } from '../services/AlertService';
import { TradeAlert, FiredAlert, MonitoringStats } from '../types/alerts';

export interface TradeBatch {
    trades: ParsedTrade[];
}

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
    type?: 'WTB' | 'WTS' | 'WTT';
    internalId?: string; 
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
    startMonitoring: async () => {},
    stopMonitoring: () => {},
    alerts: [],
    addAlert: () => {},
    removeAlert: () => {},
    toggleAlert: () => {},
    firedAlerts: [],
    clearAlertHistory: () => {},
    stats: defaultStats,
    resetStats: () => {},
    quickMsgTemplate: '/t {nick} Hi, I saw you WTB {item}. I have one for sale.',
    setQuickMsgTemplate: () => {},
    timerConfig: defaultTimerConfig,
    setTimerConfig: () => {},
    timerEndTime: null,
    startTimer: () => {},
    stopTimer: () => {},
    adTemplates: [],
    addTemplate: () => {},
    removeTemplate: () => {},
    updateTemplate: () => {},
    dndMode: false,
    setDndMode: () => {},
    dndSchedule: { start: '22:00', end: '08:00' },
    setDndSchedule: () => {},
    exportConfig: () => {},
    importConfig: async () => {} 
});

export const useTradeEvents = () => useContext(TradeEventContext);

export const TradeEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [trades, setTrades] = useState<ParsedTrade[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [alerts, setAlerts] = useState<TradeAlert[]>([]);
    const [firedAlerts, setFiredAlerts] = useState<FiredAlert[]>([]);
    const [stats, setStats] = useState<MonitoringStats>(defaultStats);
    
    // NEW: Deduplication Set
    // We use a Ref because we don't want re-renders just for tracking signatures
    const processedSignatures = useRef<Set<string>>(new Set());

    // Settings
    const [quickMsgTemplate, setQuickMsgTemplate] = useState('/t {nick} Hi, I saw you WTB {item}. I have one for sale.');

    // Timer
    const [timerConfig, setTimerConfig] = useState<TimerConfig>(defaultTimerConfig);
    const [timerEndTime, setTimerEndTime] = useState<number | null>(null);

    // Ads
    const [adTemplates, setAdTemplates] = useState<AdTemplate[]>([]);

    // DND
    const [dndMode, setDndMode] = useState(false);
    const [dndSchedule, setDndSchedule] = useState({ start: '22:00', end: '08:00' });

    // Load persisted data
    useEffect(() => {
        const load = () => {
             const savedAlerts = localStorage.getItem('torta_alerts');
             if (savedAlerts) setAlerts(JSON.parse(savedAlerts));

             const savedStats = localStorage.getItem('torta_monitoring_stats');
             if (savedStats) {
                 const parsed = JSON.parse(savedStats);
                 if (parsed.lastReset === new Date().toISOString().split('T')[0]) {
                     setStats(parsed);
                 }
             }

             const savedConfig = localStorage.getItem('torta_live_monitor_config');
             if (savedConfig) {
                 const config = JSON.parse(savedConfig);
                 if (config.quickMessageFormat) setQuickMsgTemplate(config.quickMessageFormat);
                 if (config.timerConfig) setTimerConfig(config.timerConfig);
                 if (config.adTemplates) setAdTemplates(config.adTemplates);
                 if (config.dndSchedule) setDndSchedule(config.dndSchedule);
             }
        };
        load();
    }, []);

    // Save persistable data
    useEffect(() => {
        localStorage.setItem('torta_alerts', JSON.stringify(alerts));
    }, [alerts]);

    useEffect(() => {
        localStorage.setItem('torta_monitoring_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        const config = {
            quickMessageFormat: quickMsgTemplate,
            timerConfig,
            adTemplates,
            dndSchedule
        };
        localStorage.setItem('torta_live_monitor_config', JSON.stringify(config));
    }, [quickMsgTemplate, timerConfig, adTemplates, dndSchedule]);


    // Event Listener
    useEffect(() => {
        let unlisten: () => void;

        const setupListener = async () => {
            unlisten = await listen<TradeBatch>('trade-batch-event', (event) => {
                let batchTrades = event.payload.trades;
                if (!batchTrades || batchTrades.length === 0) return;

                // --- DEDUPLICATION LOGIC ---
                // Filter out trades we've already seen based on content signature
                const uniqueBatch = batchTrades.filter(t => {
                    // Create a reasonably unique signature
                    // timestamp usually has seconds, so if multiple trades occur in same second same nick same msg, they are treated as one.
                    // This is acceptable behavior.
                    const signature = `${t.timestamp}-${t.nick}-${t.message}`;
                    if (processedSignatures.current.has(signature)) {
                        return false; // Duplicate
                    }
                    processedSignatures.current.add(signature);
                    return true;
                });

                if (uniqueBatch.length === 0) return;

                // Assign IDs to the new unique items
                const processedBatch = uniqueBatch.map(t => ({
                    ...t,
                    internalId: t.internalId || crypto.randomUUID()
                }));

                // Update Trades State
                setTrades(prev => {
                    const combined = [...prev, ...processedBatch];
                    // Keep last 200 items in context memory to prevent bloat but allow history
                    return combined.slice(-200); 
                });

                // Update Stats
                setStats(prev => {
                    const next = { ...prev };
                    processedBatch.forEach(t => {
                        const msg = t.message.toLowerCase();
                        if (msg.includes('wtb')) next.wtb++;
                        else if (msg.includes('wts')) next.wts++;
                        else if (msg.includes('wtt')) next.wtt++;
                    });
                    return next;
                });

                // Check Alerts
                const dndActive = checkDndStatus();
                if (!dndActive) {
                    AlertService.checkAlerts(processedBatch, alerts, (fired) => {
                        setFiredAlerts(prev => [fired, ...prev].slice(0, 50));
                        setStats(prev => ({ ...prev, alerts: prev.alerts + 1 }));
                    });
                }
            });
        };

        setupListener();
        return () => {
            if (unlisten) unlisten();
        };
    }, [alerts, dndSchedule, dndMode]);

    const checkDndStatus = () => {
        if (dndMode) return true;
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const start = dndSchedule.start;
        const end = dndSchedule.end;

        if (start > end) {
            // Overnight (e.g. 22:00 to 08:00)
            return currentTime >= start || currentTime < end;
        } else {
            // Same day (e.g. 09:00 to 17:00)
            return currentTime >= start && currentTime < end;
        }
    };

    const startMonitoring = async (filePath: string) => {
        try {
            await invoke('start_monitoring', { filePath });
            setIsMonitoring(true);
            processedSignatures.current.clear(); // Clear cache on new session? Or keep it? keeping it is safer against re-reads
            // Actually, if we restart, maybe we want to re-read? No, usually not duplicates.
        } catch (error) {
            console.error('Failed to start monitoring:', error);
            // Simulate for dev
            setIsMonitoring(true);
        }
    };

    const stopMonitoring = async () => {
        try {
            await invoke('stop_monitoring');
            setIsMonitoring(false);
        } catch (error) {
            console.error('Failed to stop monitoring:', error);
            setIsMonitoring(false);
        }
    };

    const addAlert = (term: string, sound: string = 'default', tradeTypes: ('WTB'|'WTS'|'WTT')[] = ['WTB', 'WTS', 'WTT']) => {
        const newAlert: TradeAlert = {
            id: crypto.randomUUID(),
            term,
            sound,
            enabled: true,
            tradeTypes,
            createdAt: new Date().toISOString()
        };
        setAlerts(prev => [...prev, newAlert]);
    };

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const toggleAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    };

    const clearAlertHistory = () => setFiredAlerts([]);
    const resetStats = () => setStats({ ...defaultStats, lastReset: new Date().toISOString().split('T')[0] });

    // Ads
    const addTemplate = (label: string, content: string) => {
        setAdTemplates(prev => [...prev, { id: crypto.randomUUID(), label, content }]);
    };
    const removeTemplate = (id: string) => setAdTemplates(prev => prev.filter(t => t.id !== id));
    const updateTemplate = (id: string, updates: Partial<AdTemplate>) => {
        setAdTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    // Timer
    const startTimer = () => {
        const end = Date.now() + (timerConfig.duration * 60 * 1000);
        setTimerEndTime(end);
        // Play sound
    };
    const stopTimer = () => setTimerEndTime(null);

    // Export/Import
    const exportConfig = async () => {
        const config = {
            alerts,
            adTemplates,
            timerConfig,
            quickMsgTemplate,
            dndSchedule
        };
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
        element.href = URL.createObjectURL(file);
        element.download = `torta_config_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };

    const importConfig = async (file: File) => {
        const text = await file.text();
        try {
            const config = JSON.parse(text);
            if (config.alerts) setAlerts(config.alerts);
            if (config.adTemplates) setAdTemplates(config.adTemplates);
            if (config.timerConfig) setTimerConfig(config.timerConfig);
            if (config.quickMsgTemplate) setQuickMsgTemplate(config.quickMessageFormat || config.quickMsgTemplate);
            if (config.dndSchedule) setDndSchedule(config.dndSchedule);
            alert('Config imported successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to import config.');
        }
    };

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
