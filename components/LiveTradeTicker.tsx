import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Activity, Radio, ArrowRight } from 'lucide-react';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
}

export const LiveTradeTicker = () => {
    const [latestTrade, setLatestTrade] = useState<ParsedTrade | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);

    useEffect(() => {
        // Listen to trade-event from Rust watcher
        const unlisten = listen<ParsedTrade>('trade-event', (event) => {
            setLatestTrade(event.payload);
            setIsMonitoring(true);
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, []);

    return (
        <div className="fixed top-8 left-0 right-0 h-8 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center z-[90] shadow-md select-none">
            {/* Label */}
            <div className="bg-emerald-900/40 px-3 h-full flex items-center justify-center gap-2 border-r border-slate-800 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Activity size={14} className={isMonitoring ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                <span className="text-[10px] font-bold text-emerald-500 tracking-wider hidden sm:block">LAST TRADE</span>
            </div>

            {/* Content Container - Static, No Scroll */}
            <div className="flex-1 flex items-center px-4 overflow-hidden relative h-full">
                {!latestTrade ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 animate-pulse">
                        <Radio size={12} />
                        WAITING FOR SIGNAL... (Configure o monitor no botão inferior direito)
                    </div>
                ) : (
                    <div className="flex items-center gap-3 w-full animate-in slide-in-from-bottom-2 fade-in">
                        {/* Time */}
                        <span className="text-slate-600 font-mono text-[10px]">
                            [{latestTrade.timestamp}]
                        </span>

                        {/* Nick */}
                        <span className="text-blue-400 font-bold text-xs">
                            {latestTrade.nick}
                        </span>

                        <ArrowRight size={12} className="text-slate-700" />

                        {/* Message - Truncated if too long */}
                        <span className="text-slate-300 text-xs font-medium truncate flex-1 leading-none">
                            {latestTrade.message}
                        </span>
                    </div>
                )}
            </div>

            {/* Blinking Cursor Effect */}
            <div className={`w-1.5 h-4 bg-emerald-500/50 mr-4 animate-pulse ${isMonitoring ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>
    );
};
