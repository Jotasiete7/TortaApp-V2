import React, { useEffect, useState } from 'react';
import { Shield, Award, Star, Heart, TrendingUp, Gift, Beaker, Check, X, Loader2, Moon, Sunrise, Ghost, Sparkles } from 'lucide-react';
import { BadgeService } from '../../services/badgeService';
import { UserBadge } from '../../types';

interface BadgeSelectorProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Callback to refresh parent
}

// Map icon names to Lucide components
const IconMap: Record<string, React.ElementType> = {
    Shield, Award, Star, Heart, TrendingUp, Gift, Beaker, Moon, Sunrise, Ghost, Sparkles
};

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({ userId, isOpen, onClose, onUpdate }) => {
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadBadges();
        }
    }, [isOpen, userId]);

    const loadBadges = async () => {
        setLoading(true);
        const userBadges = await BadgeService.getUserBadges(userId);
        setBadges(userBadges);
        
        // Pre-select currently displayed badges
        const displayed = userBadges
            .filter(ub => ub.is_displayed)
            .map(ub => ub.badge_id);
        setSelectedIds(displayed);
        
        setLoading(false);
    };

    const toggleBadge = (badgeId: string) => {
        if (selectedIds.includes(badgeId)) {
            setSelectedIds(prev => prev.filter(id => id !== badgeId));
        } else {
            if (selectedIds.length >= 5) return; // Max 5
            setSelectedIds(prev => [...prev, badgeId]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await BadgeService.setDisplayBadges(selectedIds);
        if (success) {
            onUpdate();
            onClose();
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Manage Badges
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Select up to 5 badges to display on your profile.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : badges.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>You haven't earned any badges yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {badges.map((ub) => {
                                const BadgeIcon = ub.badge?.icon_name ? IconMap[ub.badge.icon_name] || Star : Star;
                                const isSelected = selectedIds.includes(ub.badge_id);
                                const isDisabled = !isSelected && selectedIds.length >= 5;

                                return (
                                    <button
                                        key={ub.id}
                                        onClick={() => toggleBadge(ub.badge_id)}
                                        disabled={isDisabled}
                                        className={`
                                            relative flex items-center gap-4 p-4 rounded-lg border text-left transition-all
                                            ${isSelected 
                                                ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50' 
                                                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}
                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className={`
                                            p-3 rounded-full 
                                            ${isSelected ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700/50 text-slate-400'}
                                        `}>
                                            <BadgeIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                {ub.badge?.name || 'Unknown Badge'}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-1">
                                                {ub.badge?.description}
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-1 font-mono">
                                                Earned: {new Date(ub.earned_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 text-amber-500">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center rounded-b-xl">
                    <div className="text-sm text-slate-400">
                        <span className={selectedIds.length === 5 ? 'text-amber-500 font-bold' : 'text-white'}>
                            {selectedIds.length}
                        </span>
                        <span className="text-slate-600"> / 5 selected</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
