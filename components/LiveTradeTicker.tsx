import React, { useRef, useState } from 'react';
import { Activity, Radio, Flame } from 'lucide-react';
import { useTradeEvents } from '../contexts/TradeEventContext';
import { toast } from 'sonner';
import { MarketItem } from '../types';
import { convertLiveTradeToMarketItem } from '../services/dataUtils';
import { useSmartAlerts } from '../hooks/useSmartAlerts';

// Helper to detect and linkify URLs
const linkifyMessage = (message: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);

    return parts.map((part, idx) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={idx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return <span key={idx}>{part}</span>;
    });
};

interface LiveTradeTickerProps {
    rawItems?: MarketItem[];
}

export const LiveTradeTicker: React.FC<LiveTradeTickerProps> = ({ rawItems = [] }) => {
    const { trades, isMonitoring, quickMsgTemplate } = useTradeEvents();

    // Convert LiveTrades to MarketItems for analysis
    // We memoize this to avoid re-parsing on every render, depends on 'trades'
    // 'displayTrades' is just a reverse view, but alerts need source data
    const liveItems = React.useMemo(() => {
        // We only care about analyzing the last 50 trades matching what's in ticker
        // 'trades' might grow large? check context. usually keeps last 50.
        return trades.map(convertLiveTradeToMarketItem);
    }, [trades]);

    // Run Smart Alerts
    const { alerts } = useSmartAlerts(liveItems, rawItems);

    // Helper to check if a trade is an alert
    // The alert object contains the item. We need to match it to the display row.
    // Since 'convertLiveTrade' generates a random ID, we can't match by ID easily without linking.
    // But 'alerts' logic uses the SAME 'liveItems' array references?
    // Yes. liveItems[i] === alerts[x].item (reference equality) should hold if hooks run pure.
    // However, displayTrades creates NEW array [...trades].reverse().
    // So distinct references.
    // We match by timestamp + nick + message combo.
    const getAlert = (trade: any) => {
        return alerts.find(a =>
            a.item.seller === trade.nick &&
            a.item.timestamp.includes(trade.timestamp.split('T')[0]) && // loose date check not needed if we check timestamp string
            (trade.message.includes(a.item.rawName || '') || trade.message === a.item.name)
        );
        // Fallback: match by timestamp string equality if possible?
        // trade.timestamp is "HH:mm:ss". liveItems.timestamp is ISO.
        // Let's use nick + raw message substring.
        // liveItems.rawName comes from trade.message regex.
        // Actually simplest is: `a.item.rawName` came from `trade.message` or `[...]` content.
        // Let's assume unique enough for UI highlight.
    };


    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [resetKey, setResetKey] = useState(0);

    // Show newest first
    const displayTrades = [...trades].reverse();

    const jumpToLatest = () => {
        setResetKey(prev => prev + 1);
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
        toast.info('Ticker resetado: Mensagens mais recentes!');
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
        scrollRef.current.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            if (scrollRef.current) {
                scrollRef.current.style.cursor = 'grab';
            }
        }
    };

    const handleTradeDoubleClick = (nick: string) => {
        try {
            const msg = quickMsgTemplate.replace('{nick}', nick);
            navigator.clipboard.writeText(msg);
            toast.success('Mensagem copiada para o clipboard!', {
                description: msg,
                duration: 2000
            });
        } catch (err) {
            console.error('Failed to copy', err);
            toast.error('Falha ao copiar mensagem');
        }
    };

    // CSS Styles injected using standard strings (no backticks)
    const tickerStyles =
        ".ticker-reset * { letter-spacing: 0 !important; } " +
        "@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } " +
        ".ticker-scroll-anim { animation: ticker-scroll 60s linear infinite; } " +
        ".ticker-hide-scrollbar::-webkit-scrollbar { display: none; } " +
        ".ticker-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }";

    return (
        <>
            <style>{tickerStyles}</style>

            <div className="ticker-reset fixed top-8 left-0 right-0 h-8 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center z-[90] shadow-md select-none overflow-hidden">
                <div
                    onClick={jumpToLatest}
                    className="bg-emerald-900/40 px-3 h-full flex items-center justify-center gap-2 border-r border-slate-800 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer hover:bg-emerald-800/50 transition-colors active:scale-95"
                    title="Clique para ver mensagens recentes"
                >
                    <Activity size={14} className={isMonitoring ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase hidden sm:block" style={{ letterSpacing: '0.1em' }}>Live Feed</span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 relative h-full overflow-x-auto overflow-y-hidden ticker-hide-scrollbar"
                    style={{ cursor: trades.length > 0 ? 'grab' : 'default' }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {trades.length === 0 ? (
                        <div className="flex items-center gap-2 px-4 h-full text-xs font-mono text-slate-500 animate-pulse">
                            <Radio size={12} />
                            <</span>WAITING FOR SIGNAL... (Configure o monitor no botão inferior direito)</span>
                        </div>
                    ) : (
                        <div
                            key={resetKey}
                            className={"flex items-center h-full gap-4 whitespace-nowrap " + (!isDragging ? 'ticker-scroll-anim' : '')}
                        >
                            {[...displayTrades, ...displayTrades].map((trade, idx) => {
                                // Logic to deduce alert match
                                // We check if this trade message matches any alert item in logic
                                const alert = alerts.find(a =>
                                    a.item.seller === trade.nick &&
                                    trade.message.includes(a.item.rawName || '$$$')
                                );
                                const isOpportunity = !!alert;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 shrink-0 group px-2 py-1 rounded cursor-pointer transition-colors border-y border-transparent ${isOpportunity ? 'bg-amber-500/10 border-amber-500/50' : 'hover:bg-white/5'}`}
                                        onDoubleClick={() => handleTradeDoubleClick(trade.nick)}
                                        title={isOpportunity ? `🎯 Smart Buy! ${alert?.discountPercent}% Discount detected!` : "Double-click para copiar mensagem rápida"}
                                    >
                                        {isOpportunity && <Flame size={12} className="text-amber-500 animate-pulse" />}

                                        <span className="text-slate-600 font-mono text-[10px]">
                                            [{trade.timestamp}]
                                        </span>

                                        <span className="text-blue-400 font-bold text-xs group-hover:text-blue-300">
                                            {trade.nick}
                                        </span>

                                        <span className={`text-xs font-medium group-hover:text-white ${isOpportunity ? 'text-amber-200' : 'text-slate-300'}`}>
                                            {linkifyMessage(trade.message)}
                                        </span>

                                        {idx === displayTrades.length - 1 ? (
                                            <span className="mx-4 text-base opacity-70">🎯</span>
                                        ) : (
                                            <span className="text-slate-700 text-xs">•</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={"w-1.5 h-4 bg-emerald-500/50 mr-4 animate-pulse " + (isMonitoring ? 'opacity-100' : 'opacity-0')}></div>
            </div>
        </>
    );
};
