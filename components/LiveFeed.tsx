import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Activity, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface LiveTrade {
    id: number;
    nick: string;
    message: string;
    server: string;
    verification_status: 'PENDING' | 'VERIFIED';
    source_count: number;
    created_at: string;
    trade_timestamp_utc: string;
}

export const LiveFeed = () => {
    const [trades, setTrades] = useState<LiveTrade[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchRecentTrades();

        const channel = supabase
            .channel('live-trades')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trade_logs' },
                (payload) => {
                    const newTrade = payload.new as LiveTrade;
                    setTrades(prev => [newTrade, ...prev].slice(0, 50));
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRecentTrades = async () => {
        const { data } = await supabase
            .from('trade_logs')
            .select('*')
            .order('trade_timestamp_utc', { ascending: false })
            .limit(20);
        if (data) setTrades(data as LiveTrade[]);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="w-full bg-black/90 border-t-2 border-b-2 border-slate-800 font-mono text-sm shadow-xl">
            {/* Header / Status Bar */}
            <div className="bg-slate-900/50 px-2 py-1 flex justify-between items-center text-xs text-slate-500 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Terminal size={12} />
                    <span>LIVE TRADE MONITOR // {isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Activity size={10} className={isConnected ? "text-green-500 animate-pulse" : "text-red-500"} />
                </div>
            </div>

            {/* Terminal Window */}
            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col-reverse"
                style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" }}
            >
                {trades.length === 0 && (
                    <div className="text-slate-600 italic px-2">Waiting for trade signals...</div>
                )}

                {trades.map((trade) => (
                    <div key={trade.id} className="whitespace-pre-wrap leading-tight py-0.5 hover:bg-white/5 transition-colors">
                        {/* Timestamp: Gold/Orange [19:14:04] */}
                        <span className="text-amber-500">[{formatTime(trade.trade_timestamp_utc)}]</span>
                        {' '}
                        {/* Nick: Light Blue <Nick> */}
                        <span className="text-cyan-400">&lt;{trade.nick}&gt;</span>
                        {' '}
                        {/* Server: Orange (Server) */}
                        <span className="text-orange-400">({trade.server})</span>
                        {' '}
                        {/* Message: Grey/White */}
                        <span className={`trade-message ${trade.verification_status === 'VERIFIED' ? 'text-white' : 'text-slate-400'}`}>
                            {trade.message}
                        </span>

                        {/* Verification Badge (Subtle) */}
                        {trade.verification_status === 'VERIFIED' && (
                            <span className="ml-2 text-[10px] bg-emerald-900/50 text-emerald-400 px-1 rounded border border-emerald-800/50">
                                ✓ VERIFIED
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
