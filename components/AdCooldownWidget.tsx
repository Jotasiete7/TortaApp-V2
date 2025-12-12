import React, { useState, useEffect, useRef } from 'react';
import { useTradeEvents } from '../contexts/TradeEventContext';
import { Play, Pause, RotateCcw, X, GripVertical } from 'lucide-react';
import { SoundService } from '../services/SoundService';

export const AdCooldownWidget = () => {
    const { timerConfig, timerEndTime, startTimer, stopTimer } = useTradeEvents();
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isVisible, setIsVisible] = useState(false);
    
    // Draggable State
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number, startY: number, startLeft: number, startTop: number }>({ startX: 0, startY: 0, startLeft: 0, startTop: 0 });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (timerEndTime) {
            setIsVisible(true);
            interval = setInterval(() => {
                const now = Date.now();
                const diff = timerEndTime - now;
                
                if (diff <= 0) {
                    setTimeLeft(0);
                    clearInterval(interval);
                    if (timerConfig.soundEnabled) {
                        try {
                            SoundService.play('notification'); 
                        } catch (e) {
                             // Fallback or silent
                        }
                    }
                } else {
                    setTimeLeft(Math.ceil(diff / 1000));
                }
            }, 1000);
        } else {
            // Reset state
            setTimeLeft(timerConfig.duration * 60);
        }

        return () => clearInterval(interval);
    }, [timerEndTime, timerConfig.duration]);

    // Format MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: position.x,
            startTop: position.y
        };
    };

    const handleDrag = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({
            x: dragRef.current.startLeft + dx,
            y: dragRef.current.startTop + dy
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Color Helpers
    const getColors = () => {
        switch (timerConfig.color) {
            case 'amber': return 'border-amber-500 text-amber-500 from-amber-500/20';
            case 'rose': return 'border-rose-500 text-rose-500 from-rose-500/20';
            case 'blue': return 'border-blue-500 text-blue-500 from-blue-500/20';
            case 'purple': return 'border-purple-500 text-purple-500 from-purple-500/20';
            default: return 'border-emerald-500 text-emerald-500 from-emerald-500/20';
        }
    };
    
    // Only show if running or explicitly opened? For now, logic:
    // If running, SHOW. If not running, HIDE unless triggered?
    // Let's assume user starts it via panel, so it auto-shows on start.
    // If they close it via X, it stops.
    if (!isVisible && !timerEndTime) return null;

    return (
        <div 
            className={`fixed z-[100] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 w-48 transition-all select-none ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-default'}`}
            style={{ left: position.x, top: position.y }}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
        >
            {/* Header / Drag Handle */}
            <div 
                className="flex items-center justify-between mb-3 text-slate-400 cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
            >
                <div className="flex items-center gap-2">
                    <GripVertical size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{timerConfig.label}</span>
                </div>
                <button 
                    onClick={() => { stopTimer(); setIsVisible(false); }} 
                    className="hover:text-rose-400"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Timer Display */}
            <div className="relative flex items-center justify-center mb-4">
                {/* Progress Circle (Simplified CSS Border) */}
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-gradient-to-b to-transparent ${getColors()} ${timeLeft === 0 ? 'animate-pulse shadow-[0_0_20px_currentColor]' : ''}`}>
                    <span className={`text-2xl font-bold font-mono ${timeLeft === 0 ? 'animate-bounce' : ''}`}>
                        {timeLeft === 0 ? "READY" : formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                {timeLeft === 0 || !timerEndTime ? (
                    <button 
                        onClick={startTimer}
                        className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black transition-transform active:scale-95"
                        title="Start Timer"
                    >
                        <Play size={18} fill="currentColor" />
                    </button>
                ) : (
                    <button 
                        onClick={stopTimer}
                        className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                        title="Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};
