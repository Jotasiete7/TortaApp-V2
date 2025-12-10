import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface LiveTrade {
    id: number;
    nick: string;
    message: string;
    server: string;
    trade_timestamp_utc: string;
    trade_type: 'WTS' | 'WTB' | 'WTT' | 'UNKNOWN';
}

export const LiveTradeTicker = () => {
    const [trades, setTrades] = useState<LiveTrade[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        fetchInitial();

        const channel = supabase
            .channel('global-ticker')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trade_logs' },
                (payload) => {
                    const newTrade = payload.new as LiveTrade;
                    setTrades(prev => [newTrade, ...prev].slice(0, 20));
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInitial = async () => {
        const { data } = await supabase
            .from('trade_logs')
            .select('*')
            .order('trade_timestamp_utc', { ascending: false })
            .limit(15);

        if (data) setTrades(data as LiveTrade[]);
    };

    if (trades.length === 0) return null;

    return (
        <div className="w-full bg-slate-950 border-b border-slate-800 h-8 flex items-center overflow-hidden relative z-40 select-none">
            {/* Label */}
            <div className="bg-emerald-900/80 px-3 h-full flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-r border-slate-800 shrink-0 z-10 shadow-lg">
                <Activity size={12} className={isConnected ? "animate-pulse" : ""} />
                Live Market
            </div>

            {/* Scrolling Content - Infinite Loop Simulation */}
            <div className="flex animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
                {[...trades, ...trades].map((trade, i) => ( // Duplicate for seamless loop
                    <div key={`${trade.id}-${i}`} className="inline-flex items-center gap-2 px-4 border-r border-slate-800/50 text-xs font-mono">
                        <span className="text-slate-500">[{new Date(trade.trade_timestamp_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>

                        <span className={`font-bold ${trade.trade_type === 'WTS' ? 'text-emerald-400' :
                                trade.trade_type === 'WTB' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                            {trade.trade_type || 'MIX'}
                        </span>

                        <span className="text-slate-300">
                            {trade.nick}: <span className="text-white bg-white/5 px-1 rounded">{trade.message}</span>
                        </span>

                        <span className="text-slate-500 text-[10px] uppercase">
                            ({trade.server})
                        </span>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker ${Math.max(20, trades.length * 5)}s linear infinite;
                }
            `}</style>
        </div>
    );
};
