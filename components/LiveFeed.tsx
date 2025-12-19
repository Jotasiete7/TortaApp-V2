import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Trash2, Filter } from 'lucide-react';
import { useTradeEvents } from '../contexts/TradeEventContext';

interface ParsedTrade {
    timestamp: string;
    nick: string;
    message: string;
    internalId?: string; // Opt
    type?: 'WTB' | 'WTS' | 'WTT';
}

interface DisplayTrade extends ParsedTrade {
    id: number;
    is_live_marker?: boolean;
}

type FilterType = 'ALL' | 'WTS' | 'WTB' | 'WTT';

export const LiveFeed = () => {
    const { trades: contextTrades, isMonitoring } = useTradeEvents();
    const [trades, setTrades] = useState<DisplayTrade[]>([]);
    const [filter, setFilter] = useState<FilterType>('ALL');

    const scrollEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Keep processedIdsRef for extra safety, though context handles duplicates now
    const processedIdsRef = useRef<Set<string>>(new Set());

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isAtBottom);
    };

    const getTradeSignature = (t: ParsedTrade) => {
        return t.internalId || `${t.timestamp}-${t.nick}-${t.message}`;
    };

    useEffect(() => {
        if (contextTrades.length === 0) return;

        // Context now handles deduplication, but we filter here just in case of
        // re-mounts or race conditions with the same context reference
        const newUniqueTrades = contextTrades.filter(t => {
            const signature = getTradeSignature(t);
            return !processedIdsRef.current.has(signature);
        });

        if (newUniqueTrades.length === 0) return;

        newUniqueTrades.forEach(t => {
            const signature = getTradeSignature(t);
            processedIdsRef.current.add(signature);
        });

        setTrades(prev => {
            const formattedNewItems = newUniqueTrades.map((t, idx) => ({
                ...t,
                id: Date.now() + idx + Math.random(),
                is_live_marker: false
            }));

            let nextState = [...prev, ...formattedNewItems];

            if (prev.length === 0 && isMonitoring && newUniqueTrades.length > 0) {
                 const marker: DisplayTrade = {
                    id: -1,
                    timestamp: '',
                    nick: '',
                    message: '',
                    is_live_marker: true
                };
                nextState = [marker, ...formattedNewItems];
            }
            
            if (nextState.length > 500) {
                 nextState = nextState.slice(-500);
            }
            
            return nextState;
        });

    }, [contextTrades, isMonitoring]);

    useEffect(() => {
        if (shouldAutoScroll) {
            scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [trades, filter]);

    const handleClear = () => {
        setTrades([]);
        processedIdsRef.current.clear();
        contextTrades.forEach(t => {
            const sig = getTradeSignature(t);
            processedIdsRef.current.add(sig);
        });
        setShouldAutoScroll(true);
    };

    const handleCopy = (nick: string, message: string) => {
        let format = '/t {nick} {message}';
        const savedConfig = localStorage.getItem('torta_live_monitor_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.quickMessageFormat) {
                    format = config.quickMessageFormat;
                }
            } catch (e) {
                console.error('Failed to parse monitor config', e);
            }
        }
        const formatted = format.replace('{nick}', nick).replace('{message}', message);
        navigator.clipboard.writeText(formatted);
    };

    // --- HELPER LOGIC ---
    
    // Robust cleaning
    const cleanMessageText = (msg: string) => {
        // Strip common "noisy" suffixes or prefixes from Wurm logs
        return msg
            .replace(/\b(impure|shattered|unfinished|corroded|broken|damaged|rusty)\s+/gi, '')
            .replace(/\s+received\.?$/i, '') // Fix for "received" at end
            .trim();
    };
    
    // Improved detection: Check anywhere in string if startsWith fails
    const detectType = (msg: string): 'WTS' | 'WTB' | 'SOLD' | 'OTHER' => {
        const clean = cleanMessageText(msg).trim().toUpperCase();
        
        if (clean.startsWith('WTS')) return 'WTS';
        if (clean.startsWith('WTB')) return 'WTB';
        if (clean.startsWith('SOLD')) return 'SOLD';
        
        // Fallback: Check inclusion if not at start (sometimes "selling", "buying")
        if (clean.includes(' WTS ') || clean.includes('SELLING')) return 'WTS';
        if (clean.includes(' WTB ') || clean.includes('BUYING')) return 'WTB';
        
        return 'OTHER';
    };

    const renderMessage = (msg: string) => {
        const cleanedMsg = cleanMessageText(msg);
        const type = detectType(cleanedMsg);
        
        let typeColor = 'text-slate-400';
        if (type === 'WTS') typeColor = 'text-cyan-400 font-bold';
        else if (type === 'WTB') typeColor = 'text-amber-500 font-bold';
        else if (type === 'SOLD') typeColor = 'text-emerald-500 font-bold';

        // Highlighting Logic
        const parts = cleanedMsg.split(' ');
        
        // If it looks like a standard trade message, highlight the keyword
        if (['WTS', 'WTB', 'SOLD'].some(k => cleanedMsg.toUpperCase().startsWith(k))) {
             const firstWord = parts[0];
             const rest = parts.slice(1).join(' ');
             
             // Rarity Highlights
             let rarityColor = 'text-slate-300';
             if (/scarecrow|supreme/i.test(rest)) rarityColor = 'text-cyan-400';
             if (/fantastic/i.test(rest)) rarityColor = 'text-pink-400';
             if (/rare/i.test(rest)) rarityColor = 'text-blue-400';

             return (
                <span>
                    <span className={typeColor}>{firstWord}</span>{' '}
                    <span className={rarityColor}>{rest}</span>
                </span>
            );
        }
        
        return <span className="text-slate-300">{cleanedMsg}</span>;
    };

    // Filter Logic
    const filteredTrades = trades.filter(t => {
        if (t.is_live_marker) return true;
        if (filter === 'ALL') return true;
        
        // Use robustness
        const type = t.type || detectType(t.message);
        
        if (filter === 'WTT') return t.message.toUpperCase().includes('WTT');
        if (filter === 'WTS') return type === 'WTS';
        if (filter === 'WTB') return type === 'WTB';
        
        return true;
    });

    return (
        <div className="w-full bg-[#0a0f14] border-t border-slate-800 shadow-2xl flex flex-col font-mono text-sm h-64 relative overflow-hidden group">
            <div className={`h-8 px-4 flex items-center justify-between border-b border-slate-800 ${isMonitoring ? 'bg-emerald-950/20' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-400 tracking-wider">
                            _ LIVE FEED // <span className={isMonitoring ? "text-emerald-400" : "text-slate-500"}>{isMonitoring ? 'MONITORING' : 'WAITING'}</span>
                        </span>
                    </div>

                    <div className="flex items-center bg-slate-900/50 rounded gap-0.5 p-0.5 border border-slate-700/50">
                        {(['ALL', 'WTS', 'WTB'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-colors ${
                                    filter === f 
                                    ? f === 'WTS' ? 'bg-cyan-900/50 text-cyan-400' : f === 'WTB' ? 'bg-amber-900/50 text-amber-400' : 'bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
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

            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>

            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1 relative z-0 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700 flex flex-col justify-end"
            >
                {trades.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-700 animate-pulse text-xs self-center">
                        [WAITING FOR DATA STREAM - Configure o monitor no botão inferior direito]
                    </div>
                ) : null}

                {filteredTrades.map((trade, i) => (
                    trade.is_live_marker ? (
                        <div key={`marker-${trade.id}`} className="py-2 flex items-center gap-4 shrink-0">
                            <div className="h-px bg-emerald-500/30 flex-1"></div>
                            <div className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest animate-pulse">Live Monitor Started</div>
                            <div className="h-px bg-emerald-500/30 flex-1"></div>
                        </div>
                    ) : (
                        <div
                            key={trade.id}
                            onDoubleClick={() => handleCopy(trade.nick, trade.message)}
                            className="flex items-start gap-3 hover:bg-slate-700 py-0.5 px-2 rounded transition-colors group shrink-0 animate-in slide-in-from-bottom-1 fade-in cursor-pointer"
                        >
                            <span className="text-slate-500 text-xs shrink-0 font-light">
                                [{trade.timestamp}]
                            </span>

                            <span className="text-blue-400 font-bold shrink-0 cursor-pointer hover:underline">
                                {trade.nick}
                            </span>

                            <span className="break-all opacity-90">
                                {renderMessage(trade.message)}
                            </span>
                        </div>
                    )
                ))}
                
                {filteredTrades.length === 0 && trades.length > 0 && (
                     <div className="flex-1 flex items-center justify-center text-slate-700 text-xs py-8 opacity-50">
                        No items match filter {filter}
                     </div>
                )}

                <div ref={scrollEndRef} className="shrink-0" />
            </div>
        </div>
    );
};
