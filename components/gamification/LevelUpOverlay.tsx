import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { SoundService } from '../../services/SoundService';

interface LevelUpOverlayProps {
    level: number;
    show: boolean;
    onClose: () => void;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ level, show, onClose }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (show) {
            setAnimate(true);
            SoundService.play('levelup');

            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleClose = () => {
        setAnimate(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    if (!show && !animate) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>

            {/* CSS Confetti/Particles would go here - keeping it clean for now with just CSS animations */}
            <div className={`relative bg-gradient-to-br from-amber-500 to-yellow-600 p-[2px] rounded-2xl shadow-2xl transform transition-all duration-500 ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-10 opacity-0'}`}>
                <div className="bg-slate-900 rounded-2xl p-8 text-center relative overflow-hidden w-full max-w-md">

                    {/* Background Shine */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                    <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-50 animate-pulse"></div>
                        <Trophy className="w-24 h-24 text-amber-400 relative z-10 drop-shadow-lg mx-auto animate-bounce-slow" />
                    </div>

                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 mb-2 uppercase tracking-wider animate-pulse">
                        Level Up!
                    </h2>

                    <div className="text-6xl font-black text-white mb-4 drop-shadow-xl font-mono">
                        {level}
                    </div>

                    <p className="text-slate-300 text-lg mb-8">
                        You have reached a new milestone!<br />
                        <span className="text-amber-400 font-bold">Awesome work, trader!</span>
                    </p>

                    <button
                        onClick={handleClose}
                        className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg shadow-lg transform transition-transform hover:scale-105 active:scale-95"
                    >
                        CLAIM REWARDS
                    </button>
                </div>
            </div>

            {/* Simple CSS Confetti (dots) */}
            {show && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full animate-confetti-fall`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10px`,
                                backgroundColor: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 3}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti-fall {
                    animation-name: confetti-fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                 .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
            `}</style>
        </div>
    );
};
