import React, { useRef, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { useTradeEvents } from '../contexts/TradeEventContext';

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
                    className="text-blue-400 hover:text-blue-300 underline ticker-link"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return <span key={idx} className="ticker-text">{part}</span>;
    });
};

export const LiveTradeTicker = () => {
    const { trades, isMonitoring } = useTradeEvents();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

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

    return (
        <>
            <style>{`
                .ticker-text,
                .ticker-link,
                .ticker-time,
                .ticker-nick,
                .ticker-message {
                    letter-spacing: 0 !important;
                }
                .ticker-scroll-left {
                    animation: ticker-scroll 30s linear infinite;
                }
                @keyframes ticker-scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .ticker-scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .ticker-scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <div className="fixed top-8 left-0 right-0 h-8 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center z-[90] shadow-md select-none overflow-hidden">
                {/* Label */}
                <div className="bg-emerald-900/40 px-3 h-full flex items-center justify-center gap-2 border-r border-slate-800 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Activity size={14} className={isMonitoring ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase hidden sm:block tracking-wider">Live Feed</span>
                </div>

                {/* Scrolling Content */}
                <div 
                    ref={scrollRef}
                    className="flex-1 relative h-full overflow-x-auto overflow-y-hidden ticker-scrollbar-hide"
                    style={{ cursor: trades.length > 0 ? 'grab' : 'default' }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {trades.length === 0 ? (
                        <div className="flex items-center gap-2 px-4 h-full text-xs font-mono text-slate-500 animate-pulse">
                            <Radio size={12} />
                            WAITING FOR SIGNAL... (Configure o monitor no botão inferior direito)
                        </div>
                    ) : (
                        <div className={`flex items-center h-full gap-8 whitespace-nowrap ${!isDragging ? 'ticker-scroll-left' : ''}`}>
                            {/* Duplicate trades for seamless loop */}
                            {[...trades, ...trades].map((trade, idx) => (
                                <div key={idx} className="flex items-center gap-3 shrink-0">
                                    {/* Time */}
                                    <span className="text-slate-600 font-mono text-[10px] ticker-time">
                                        [{trade.timestamp}]
                                    </span>

                                    {/* Nick */}
                                    <span className="text-blue-400 font-bold text-xs ticker-nick">
                                        {trade.nick}
                                    </span>

                                    {/* Message with clickable links */}
                                    <span className="text-slate-300 text-xs font-medium ticker-message">
                                        {linkifyMessage(trade.message)}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-slate-700 text-xs">•</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Blinking Cursor Effect */}
                <div className={`w-1.5 h-4 bg-emerald-500/50 mr-4 animate-pulse ${isMonitoring ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
        </>
    );
};
