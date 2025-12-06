import React, { useEffect, useState } from 'react';
import {
    Trophy, TrendingUp, User, Activity, Calendar,
    ShoppingCart, Tag, Hash, Clock, ArrowLeft, Server,
    Award, Shield, Star, Heart, Gift, Beaker, Megaphone,
    Scroll
} from 'lucide-react';
import { ServerIcon } from './gamification/ServerIcon';
import { BadgeSelector } from './gamification/BadgeSelector';
import { BadgeService } from '../services/badgeService';
import { ShoutService } from '../services/shoutService'; 
import { UserBadge } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { emojiService } from '../services/emojiService';
import { GamificationRules } from './gamification/GamificationRules';
import {
    IntelligenceService,
    PlayerStatsAdvanced,
    PlayerLog,
    ActivityPoint
} from '../services/intelligence';

interface PlayerProfileProps {
    nick: string;
    onBack: () => void;
}

// Interfaces for History
interface ShoutHistoryItem {
    id: string;
    text: string;
    color: string;
    created_at: string;
    paid: boolean;
}

// Map icon names to Lucide components for badges (FALLBACK)
const BadgeIconMap: Record<string, React.ElementType> = {
    Shield, Award, Star, Heart, TrendingUp, Gift, Beaker
};

// Map Lucide Interface Names -> Emoji Characters for Vivid SVGs
const BADGE_TO_EMOJI: Record<string, string> = {
    'Shield': '🛡️',
    'Award': '🎖️',
    'Star': '🌟',
    'Heart': '💜',
    'Gift': '🎁',
    'Beaker': '🧪',
    'TrendingUp': '📈',
    'Trophy': '🏆',
    'Flame': '🔥',
    'Zap': '⚡',
    'Crown': '👑',
    'Diamond': '💎',
    'Swords': '⚔️',
    'Scroll': '📜',
    'Map': '🗺️',
    'Compass': '🧭',
    'Anchor': '⚓',
    'Hammer': '🔨',
    'Axe': '🪓',
    'Pickaxe': '⛏️'
};

// VIBRANT BADGE STYLES
const BADGE_STYLES: Record<string, string> = {
    red: "text-red-400 bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.2)]",
    gold: "text-amber-300 bg-amber-500/10 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(96,165,250,0.2)]",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(192,132,252,0.2)]",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/50 shadow-[0_0_15px_rgba(244,114,182,0.2)]",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(251,146,60,0.2)]",
    slate: "text-slate-400 bg-slate-500/10 border-slate-500/50",
};

// LEVELING CONSTANTS
const XP_PER_TRADE = 10;
const LEVELS = [
    { level: 1, name: 'Novice', minTrades: 0, maxTrades: 50 },
    { level: 2, name: 'Apprentice', minTrades: 50, maxTrades: 150 },
    { level: 3, name: 'Merchant', minTrades: 150, maxTrades: 500 },
    { level: 4, name: 'Veteran', minTrades: 500, maxTrades: 1000 },
    { level: 5, name: 'Tycoon', minTrades: 1000, maxTrades: 9999999 }
];

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ nick, onBack }) => {
    const [stats, setStats] = useState<PlayerStatsAdvanced | null>(null);
    const [logs, setLogs] = useState<PlayerLog[]>([]);
    const [activity, setActivity] = useState<ActivityPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'shouts'>('overview');
    const [emojisReady, setEmojisReady] = useState(false);

    // Feature States
    const [shoutHistory, setShoutHistory] = useState<ShoutHistoryItem[]>([]);

    // Badge system state
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [showBadgeSelector, setShowBadgeSelector] = useState(false);
    const [showGamificationRules, setShowGamificationRules] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        emojiService.loadEmojis().then(() => setEmojisReady(true));
        loadProfileData();
    }, [nick]);

    useEffect(() => {
        if (user && stats && stats.nick.toLowerCase() === nick.toLowerCase()) {
            loadBadges(user.id);
            if (activeTab === 'shouts') {
                loadShoutHistory(user.id); // Load history when tab is active
            }
        }
    }, [user, stats, nick, activeTab]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData, activityData] = await Promise.all([
                IntelligenceService.getPlayerStatsAdvanced(nick),
                IntelligenceService.getPlayerLogs(nick, 20),
                IntelligenceService.getPlayerActivity(nick)
            ]);

            setStats(statsData);
            setLogs(logsData);
            setActivity(activityData);
        } catch (error) {
            console.error("Failed to load player profile", error);
        } finally {
            setLoading(false);
        }
    };

    const loadBadges = async (userId: string) => {
        try {
            const userBadges = await BadgeService.getUserBadges(userId);
            const displayed = userBadges.filter(ub => ub.is_displayed);
            setBadges(displayed);
        } catch (error) {
            console.error('Failed to load badges', error);
        }
    };

    const loadShoutHistory = async (userId: string) => {
        try {
            const history = await ShoutService.getHistory(userId);
            setShoutHistory(history);
        } catch (err) {
            console.error(err);
        }
    }

    // Helper functions for Leveling
    const calculateLevelData = (totalTrades: number) => {
        const currentLevel = LEVELS.find(l => totalTrades >= l.minTrades && totalTrades < l.maxTrades) || LEVELS[LEVELS.length - 1];
        const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

        const currentXP = totalTrades * XP_PER_TRADE;
        const levelStartXP = currentLevel.minTrades * XP_PER_TRADE;
        const nextLevelXP = nextLevel ? nextLevel.minTrades * XP_PER_TRADE : currentXP; // Cap if max level

        // Progress Calculation
        let progressPercent = 100;
        if (nextLevel) {
            const levelRange = nextLevelXP - levelStartXP;
            const xpIntoLevel = currentXP - levelStartXP;
            progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / levelRange) * 100));
        }

        return {
            level: currentLevel.level,
            title: currentLevel.name,
            currentXP,
            nextLevelXP,
            progressPercent,
            isMaxLevel: !nextLevel
        };
    };

        const renderBadgeIcon = (iconName: string) => {
        // First try native/mapped emoji (Most reliable/beautiful)
        const emojiChar = BADGE_TO_EMOJI[iconName];
        if (emojiChar) {
            return (
                <span className="text-2xl filter drop-shadow-md select-none transform transition-transform group-hover:scale-110 inline-block">
                    {emojiChar}
                </span>
            );
        }
        
        // Fallback to Lucide (Least preferred but safe)
        const LucideIcon = BadgeIconMap[iconName] || Star;
        return <LucideIcon className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center p-8 text-slate-400">
                <p>Player not found.</p>
                <button onClick={onBack} className="mt-4 text-amber-500 hover:underline">Go Back</button>
            </div>
        );
    }

    const { level, title, currentXP, nextLevelXP, progressPercent, isMaxLevel } = calculateLevelData(stats.total);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            {/* MAIN PROFILE CARD */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative">
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-32 h-32 text-amber-500" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">

                    {/* AVATAR + LEVEL CIRCLE */}
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-slate-700 border-4 border-slate-800 shadow-2xl flex items-center justify-center text-5xl font-bold text-amber-500 relative z-10">
                            {stats.nick.charAt(0).toUpperCase()}
                        </div>
                        {/* Level Badge Overlay */}
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-500 border-2 border-slate-800 text-slate-900 font-bold flex items-center justify-center text-sm z-20 shadow-lg">
                            {level}
                        </div>
                    </div>

                    <div className="flex-1 w-full md:w-auto">
                        <div className="flex flex-col gap-1 mb-2">
                            {/* NAME & BADGES ROW */}
                            <div className="flex items-center flex-wrap gap-3">
                                <h1 className="text-3xl font-bold text-white capitalize">{stats.nick}</h1>

                                {/* BADGES */}
                                {badges.length > 0 && (
                                    <div className="flex items-center gap-3 ml-2">
                                        {badges.map((ub) => {
                                            const colorKey = ub.badge?.color || 'amber';
                                            const styleClass = BADGE_STYLES[colorKey] || BADGE_STYLES['slate'];
                                            const iconName = ub.badge?.icon_name || 'Star';

                                            return (
                                                <div key={ub.id} className="group relative inline-block text-left" style={{ zIndex: 50 }}>
                                                    <div className={`p-2 rounded-full border transition-all cursor-help ${styleClass} hover:brightness-125`}>
                                                        {renderBadgeIcon(iconName)}
                                                    </div>
                                                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-64 hidden group-hover:block transition-all z-[100] animate-fade-in-up">
                                                        <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-slate-700 relative">
                                                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-t border-l border-slate-700 rotate-45"></div>
                                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                                                                <span className={`font-bold uppercase tracking-wide text-xs ${styleClass.split(' ')[0]}`}>{ub.badge?.name}</span>
                                                            </div>
                                                            <p className="text-slate-300 text-xs leading-relaxed">{ub.badge?.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* LEVEL TITLE */}
                            <div className="text-amber-400 font-medium text-sm tracking-wide uppercase flex items-center gap-2">
                                {title}
                                {user && stats.nick.toLowerCase() === nick.toLowerCase() && (
                                    <>
                                        <button onClick={() => setShowBadgeSelector(true)} className="ml-4 text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-slate-300 transition-colors">
                                            Edit Badges
                                        </button>
                                        <button onClick={() => setShowGamificationRules(true)} className="text-[10px] bg-slate-700/50 hover:bg-slate-700 px-2 py-0.5 rounded text-amber-500/80 hover:text-amber-400 transition-colors flex items-center gap-1 border border-transparent hover:border-slate-600">
                                            <Scroll className="w-3 h-3" />
                                            Rules & Badges
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full max-w-md mt-2 group relative">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Level {level}</span>
                                <span>{isMaxLevel ? 'MAX' : `Level ${level + 1}`}</span>
                            </div>
                            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            {/* XP Tooltip on Hover */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                {currentXP} / {isMaxLevel ? 'âˆž' : nextLevelXP} XP ({Math.round(progressPercent)}%)
                            </div>
                        </div>

                                                {/* RANK INFO - Better Distribution */}
                        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-700/50 w-full">
                            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <ServerIcon server={stats.fav_server || 'Unknown'} className="text-lg" />
                                <span className="font-bold text-slate-200">{stats.fav_server || 'Unknown'}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Server</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <Hash className="w-4 h-4 text-emerald-500" />
                                <span className="font-bold text-slate-200">#{stats.rank_position}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Rank</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 ml-auto">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-400">Seen: {new Date(stats.last_seen).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="flex gap-4">
                        <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                            <p className="text-xs text-slate-500 uppercase">Total Trades</p>
                        </div>
                        <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                            <p className="text-2xl font-bold text-emerald-400">{stats.wts_count}</p>
                            <p className="text-xs text-slate-500 uppercase">Sales</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 border-b border-slate-700">
                {['overview', 'history', 'shouts'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 px-1 text-sm font-medium transition-colors capitalize ${activeTab === tab
                            ? 'text-amber-500 border-b-2 border-amber-500'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab === 'shouts' ? 'My Shouts' : tab === 'history' ? 'Trade History' : 'Overview & Metrics'}
                    </button>
                ))}
            </div>

            {/* CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Activity Heatmap
                        </h3>
                        {/* Placeholder for activity height to keep layout stable */}
                        <div className="h-48 flex items-end gap-1 pb-2 border-b border-slate-700/50">
                            {(() => {
                                const days = Array.from({ length: 30 }, (_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (29 - i));
                                    d.setHours(0, 0, 0, 0);
                                    return d;
                                });
                                const chartData = days.map(day => {
                                    const point = activity.find(a => {
                                        const aDate = new Date(a.activity_date);
                                        return aDate.toISOString().split('T')[0] === day.toISOString().split('T')[0];
                                    });
                                    return { date: day, count: point ? point.trade_count : 0 };
                                });
                                const maxCount = Math.max(...chartData.map(d => d.count), 10);

                                return chartData.map((point, i) => {
                                    const height = Math.max(4, (point.count / maxCount) * 100);
                                    const isZero = point.count === 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                            <div className={`transition-all rounded-t-sm min-w-[2px] mx-0.5 ${isZero ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-blue-500 hover:bg-blue-400'}`} style={{ height: `${isZero ? 100 : height}%`, opacity: isZero ? 0.2 : 1 }}></div>
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-xs text-white p-2 rounded border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                                                <p className="font-bold">{point.date.toLocaleDateString()}</p>
                                                <p className="text-slate-400">{point.count} trades</p>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-purple-500" />
                            Trade Breakdown
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Selling (WTS)', count: stats.wts_count, color: 'emerald' },
                                { label: 'Buying (WTB)', count: stats.wtb_count, color: 'blue' },
                                { label: 'Price Checks (PC)', count: stats.pc_count, color: 'amber' }
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300">{item.label}</span>
                                        <span className="text-white font-medium">{stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full bg-${item.color}-500`} style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: TRADE HISTORY */}
            {activeTab === 'history' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/30">
                        <h3 className="font-semibold text-white">Recent Logs</h3>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${log.trade_type === 'WTS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                                            log.trade_type === 'WTB' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                                'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                        }`}>
                                        {log.trade_type}
                                    </span>
                                    <span className="text-xs text-slate-500">{new Date(log.trade_timestamp_utc).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-300 text-sm mt-2 font-mono">{log.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTENT: SHOUT HISTORY (NEW) */}
            {activeTab === 'shouts' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-cyan-400" />
                            My Shout History
                        </h3>
                        <span className="text-xs text-slate-500">Last 50 messages</span>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {shoutHistory.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p>No shout history found.</p>
                                <p className="text-xs mt-2 text-slate-500">Use the Shout Box in Dashboard to post your first message!</p>
                            </div>
                        ) : (
                            shoutHistory.map((shout) => (
                                <div key={shout.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {shout.paid && <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 px-1.5 rounded">SHOUT</span>}
                                            <span className="text-xs text-slate-500">{new Date(shout.created_at).toLocaleString()}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border capitalize text-${shout.color}-400 bg-${shout.color}-500/10 border-${shout.color}-500/50`}>
                                            {shout.color}
                                        </span>
                                    </div>
                                    {/* Render with Emoji Support */}
                                    <div className="text-slate-200 text-sm font-medium">
                                        {emojiService.parseText(shout.text).map((part, i) => (
                                            typeof part === 'string' ? part :
                                                <img key={i} src={part.path} alt={part.alt} className="w-4 h-4 inline mx-0.5 align-middle" />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {user && showBadgeSelector && (
                <BadgeSelector
                    userId={user.id}
                    isOpen={showBadgeSelector}
                    onClose={() => setShowBadgeSelector(false)}
                    onUpdate={() => loadBadges(user.id)}
                />
            )}
            
            <GamificationRules
                isOpen={showGamificationRules}
                onClose={() => setShowGamificationRules(false)}
                userEarnedBadgeIds={badges.map(b => b.badge_id)}
            />
        </div>
    );
};



