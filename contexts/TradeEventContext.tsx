import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
}

interface TradeEventContextType {
    trades: ParsedTrade[];
    isMonitoring: boolean;
    startMonitoring: (filePath: string) => Promise<void>;
    stopMonitoring: () => void;
}

const TradeEventContext = createContext<TradeEventContextType>({
    trades: [],
    isMonitoring: false,
    startMonitoring: async () => {},
    stopMonitoring: () => {}
});

export const useTradeEvents = () => useContext(TradeEventContext);

const STORAGE_KEY = 'live_trade_monitor_state';

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

    // Setup global listener - runs once on mount
    useEffect(() => {
        let unlistenFn: (() => void) | undefined;
        
        const setupListener = async () => {
            try {
                // @ts-ignore
                if (!window.__TAURI_INTERNALS__) return;
                
                unlistenFn = await listen<ParsedTrade>('trade-event', (event) => {
                    setTrades(prev => {
                        const newTrades = [...prev, event.payload];
                        return newTrades.slice(-10);
                    });
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
        <TradeEventContext.Provider value={{ trades, isMonitoring, startMonitoring, stopMonitoring }}>
            {children}
        </TradeEventContext.Provider>
    );
};
