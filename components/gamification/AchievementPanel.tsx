import React, { useState, useEffect } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { ACHIEVEMENTS, Achievement } from '../../constants/gamification';
import { GamificationService } from '../../services/GamificationService';

interface AchievementPanelProps {
    userId: string;
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({ userId }) => {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, [userId]);

    const loadAchievements = async () => {
        try {
            const unlocked = await GamificationService.getUserAchievements(userId);
            setUnlockedIds(unlocked);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const BADGE_COLORS: Record<string, string> = {
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/50',
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/50',
        cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/50',
        amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/50',
        gold: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50',
        emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50',
    };

    if (loading) {
        return <div className="animate-pulse bg-slate-800 h-48 rounded-xl"></div>;
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-white font-bold">Achievements</h3>
                <span className="text-xs text-slate-400 ml-auto">{unlockedIds.length}/{ACHIEVEMENTS.length}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ACHIEVEMENTS.map((achievement) => {
                    const isUnlocked = unlockedIds.includes(achievement.id);
                    const colorClass = BADGE_COLORS[achievement.color] || BADGE_COLORS['amber'];

                    return (
                        <div
                            key={achievement.id}
                            className={`relative p-3 rounded-lg border transition-all ${
                                isUnlocked
                                    ? `bg-gradient-to-br ${colorClass} hover:scale-105`
                                    : 'bg-slate-900/50 border-slate-700/50 grayscale opacity-50'
                            }`}
                        >
                            {!isUnlocked && (
                                <div className="absolute top-2 right-2">
                                    <Lock className="w-3 h-3 text-slate-500" />
                                </div>
                            )}
                            <div className="text-center">
                                <div className="text-3xl mb-1">{achievement.icon}</div>
                                <p className={`text-xs font-semibold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                                    {achievement.name}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                    {achievement.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
