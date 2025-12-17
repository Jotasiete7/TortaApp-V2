import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { Achievement } from '../../constants/gamification';

interface AchievementNotificationProps {
    achievement: Achievement;
    onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        setTimeout(() => setIsVisible(true), 100);
        
        // Auto-close after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-20 right-6 z-[200] transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400 rounded-xl shadow-2xl p-4 w-80 animate-bounce-subtle">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-bold text-sm">Achievement Unlocked!</h3>
                            <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-white/80 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{achievement.icon}</span>
                            <p className="text-white font-semibold">{achievement.name}</p>
                        </div>
                        <p className="text-white/90 text-xs">{achievement.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
