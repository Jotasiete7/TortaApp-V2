import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useTradeEvents } from '../contexts/TradeEventContext';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
}

interface DisplayTrade extends ParsedTrade {
    id: number;
    is_live_marker?: boolean;
}

export const LiveFeed = () => {
    const { trades: contextTrades, isMonitoring } = useTradeEvents();
    const [trades, setTrades] = useState<DisplayTrade[]>([]);
    const scrollEndRef = useRef<HTMLDivElement>(null);
    const processedCount = useRef(0);

    useEffect(() => {
        if (contextTrades.length > processedCount.current) {
            const newItems = contextTrades.slice(processedCount.current);
            setTrades(prev => {
                const formattedNewItems = newItems.map((t, idx) => ({
                    ...t,
                    id: Date.now() + idx,
                    is_live_marker: false
                }));

                if (prev.length === 0 && isMonitoring && processedCount.current === 0) {
                     const marker: DisplayTrade = {
                        id: -1,
                        timestamp: '',
                        nick: '',
                        message: '',
                        is_live_marker: true
                    };
                    return [...prev, marker, ...formattedNewItems].slice(-50);
                }
                return [...prev, ...formattedNewItems].slice(-50);
            });
            processedCount.current = contextTrades.length;
        } else if (contextTrades.length === 0 && processedCount.current > 0) {
            setTrades([]);
            processedCount.current = 0;
        }
    }, [contextTrades, isMonitoring]);

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [trades]);

    const handleClear = () => {
        setTrades([]);
        processedCount.current = 0;
    };

    return (
        <div className="w-full bg-[#0a0f14] border-t border-slate-800 shadow-2xl flex flex-col font-mono text-sm h-64 relative overflow-hidden group">
            {/* Terminal Header */}
            <div className={`h-8 px-4 flex items-center justify-between border-b border-slate-800 ${isMonitoring ? 'bg-emerald-950/20' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-400 tracking-wider">
                        _ LIVE FEED // <span className={isMonitoring ? "text-emerald-400" : "text-slate-500"}>{isMonitoring ? 'MONITORING' : 'WAITING'}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Clear Feed"
                    >
                        <Trash2 size={12} /> CLEAR
                    </button>
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden sm:block border-l border-slate-800 pl-3 ml-3">
                        {isMonitoring ? 'READING FILE' : 'CONFIGURE MONITOR'}
                    </span>
                </div>
            </div>

            {/* Matrix Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>

            {/* Content - Bottom stacking like game chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-0 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700 flex flex-col justify-end">
                {trades.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-slate-700 animate-pulse text-xs self-center">
                        [WAITING FOR DATA STREAM - Configure o monitor no botão inferior direito]
                    </div>
                )}

                {trades.map((trade, i) => (
                    trade.is_live_marker ? (
                        <div key="marker" className="py-2 flex items-center gap-4 shrink-0">
                            <div className="h-px bg-emerald-500/30 flex-1"></div>
                            <div className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest animate-pulse">Live Monitor Started</div>
                            <div className="h-px bg-emerald-500/30 flex-1"></div>
                        </div>
                    ) : (
                        <div
                            key={trade.id}
                            className="flex items-start gap-3 hover:bg-white/5 py-0.5 px-2 rounded transition-colors group shrink-0 animate-in slide-in-from-bottom-1 fade-in"
                        >
                            <span className="text-slate-500 text-xs shrink-0 font-light">
                                [{trade.timestamp}]
                            </span>

                            <span className="text-blue-400 font-bold shrink-0 cursor-pointer hover:underline">
                                {trade.nick}
                            </span>

                            <span className="text-emerald-300/90 break-all">
                                {trade.message}
                            </span>
                        </div>
                    )
                ))}
                {/* Scroll Anchor */}
                <div ref={scrollEndRef} className="shrink-0" />
            </div>
        </div>
    );
};
