import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Database, DollarSign, Cpu, Upload, Loader2, Shield, ArrowLeft, Trophy, User } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { LogUploader } from './LogProcessor/LogUploader';
import { Leaderboard } from './gamification/Leaderboard';
import { PlayerProfile } from './PlayerProfile';
import { NickVerification } from './auth/NickVerification';
import { ShoutBoxCompact } from './gamification/ShoutBoxCompact';
import { LiveTradeSetup } from './LiveTradeSetup';
import { LiveFeed } from './LiveFeed';
import { AdvancedTools } from './AdvancedTools';
import { MarketIntelligence } from './dashboard/MarketIntelligence';
import { MarketItem, Language, ViewState } from '../types';
import { translations } from '../services/i18n';
import { IntelligenceService, GlobalStats } from '../services/intelligence';
import { useAuth } from '../contexts/AuthContext';
import { formatWurmPrice } from '../services/priceUtils';

// derived locally if not exported
const formatPrice = (copper: number) => {
    if (copper >= 10000) return `${(copper / 10000).toFixed(1)}g`;
    if (copper >= 100) return `${(copper / 100).toFixed(1)}s`;
    return `${copper}c`;
};

interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    chartData?: number[]; // NEW: Sparkline Data
}

interface DashboardProps {
    onFileUpload: (file: File) => void;
    isProcessing: boolean;
    marketData: MarketItem[];
    language: Language;
    selectedPlayer: string | null;
    onPlayerSelect: (player: string | null) => void;
    onNavigate: (view: ViewState) => void;
    myVerifiedNick?: string | null; // Added prop for verified nick
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, color, trend = 'stable', trendValue, chartData }) => {
    // Map string color to hex for Recharts (Tailwind colors approx)
    const getColorHex = (c: string) => {
        switch (c) {
            case 'amber': return '#f59e0b';
            case 'blue': return '#3b82f6';
            case 'emerald': return '#10b981';
            case 'purple': return '#8b5cf6';
            default: return '#64748b';
        }
    };
    const chartColor = getColorHex(color);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                        <Icon className={`w-6 h-6 text-${color}-500`} />
                    </div>
                    {/* Semantic Context Indicator */}
                    <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded text-xs font-medium">
                        {trend === 'up' && <ArrowUpRight size={12} className="text-emerald-400" />}
                        {trend === 'down' && <ArrowDownRight size={12} className="text-rose-400" />}
                        <span className="text-slate-400">{trendValue || 'Stable'}</span>
                    </div>
                </div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
            </div>

            {/* SPARKLINE CHART */}
            {chartData && chartData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 pointer-events-none fade-in-up">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.map((v, i) => ({ i, v }))}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke={chartColor}
                                fill={`url(#gradient-${color})`}
                                strokeWidth={2}
                                isAnimationActive={false} // Performance
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({
    onFileUpload,
    isProcessing,
    marketData,
    language,
    selectedPlayer,
    onPlayerSelect,
    onNavigate,
    myVerifiedNick
}) => {
    const t = translations[language];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showIdentity, setShowIdentity] = useState(false);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

    // Sparkline States
    const [volHistory, setVolHistory] = useState<number[]>([]);
    const [countHistory, setCountHistory] = useState<number[]>([]);
    const [priceHistory, setPriceHistory] = useState<number[]>([]);

    const { user } = useAuth();

    React.useEffect(() => {
        const fetchStats = async () => {
            const stats = await IntelligenceService.getGlobalStats();
            setGlobalStats(stats);

            // Fetch Sparklines
            try {
                const vol = await IntelligenceService.getSparklineData('volume', 24);
                setVolHistory(vol);
                const count = await IntelligenceService.getSparklineData('count', 24);
                setCountHistory(count);
                const price = await IntelligenceService.getSparklineData('avg_price', 24);
                setPriceHistory(price);
            } catch (e) {
                console.error("Failed to fetch sparklines", e);
            }
        };
        fetchStats();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    const stats = useMemo(() => {
        let displayStats = {
            totalVolume: 0,
            count: 0,
            avgPrice: 0,
            wtsCount: 0,
            wtbCount: 0,
            source: 'DB' // Default
        };

        if (marketData && marketData.length > 0) {
            marketData.forEach(item => {
                displayStats.totalVolume += item.price;
                displayStats.count++;
                if (item.orderType === 'WTS') displayStats.wtsCount++;
                if (item.orderType === 'WTB') displayStats.wtbCount++;
            });
            displayStats.avgPrice = displayStats.totalVolume / (displayStats.count || 1);
            displayStats.source = 'FILE';
        } else if (globalStats) {
            displayStats = {
                totalVolume: globalStats.total_volume,
                count: globalStats.items_indexed,
                avgPrice: globalStats.avg_price,
                wtsCount: globalStats.wts_count,
                wtbCount: globalStats.wtb_count,
                source: 'DB'
            };
        }

        return displayStats;
    }, [marketData, globalStats]);

    if (showIdentity) {
        return (
            <div className="space-y-6 animate-fade-in">
                <LiveTradeSetup />
                <button
                    onClick={() => setShowIdentity(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <NickVerification onSelectProfile={onPlayerSelect} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <LiveTradeSetup />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.dashboardOverview}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-400 text-sm">{t.realTimeStats}</p>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">System Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    {myVerifiedNick ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-inner">
                                {myVerifiedNick.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-medium leading-none mb-0.5">Welcome,</span>
                                <div className="flex items-center gap-1 leading-none">
                                    <span className="font-bold text-white text-sm">{myVerifiedNick}</span>
                                    <Shield className="w-3 h-3 text-emerald-400" />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowIdentity(true)}
                                className="ml-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-400 transition-colors"
                                title="Manage Identity"
                            >
                                <User size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowIdentity(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Link Identity
                        </button>
                    )}

                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border shadow-lg ${stats.source === 'DB'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10'
                        : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${stats.source === 'DB' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-500'}`}></div>
                        <span className="font-semibold">{stats.source === 'FILE' ? 'Live File Data' : stats.source === 'DB' ? 'Database Connected' : t.awaitingData}</span>
                    </div>
                </div>
            </div>

            {/* 1. KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t.totalVolume}
                    value={formatPrice(stats.totalVolume)}
                    subValue="Aggregate value"
                    icon={Activity}
                    color="amber"
                    trend="up"
                    trendValue="+4.2% (24h)"
                    chartData={volHistory}
                />
                <StatCard
                    title={t.itemsIndexed}
                    value={stats.count.toLocaleString()}
                    subValue={`${stats.wtsCount} WTS / ${stats.wtbCount} WTB`}
                    icon={Database}
                    color="blue"
                    trend="up"
                    trendValue="Growing"
                    chartData={countHistory}
                />
                <StatCard
                    title={t.avgPrice}
                    value={formatPrice(stats.avgPrice)}
                    subValue="Across all rarities"
                    icon={DollarSign}
                    color="emerald"
                    trend="stable"
                    trendValue="Stable"
                    chartData={priceHistory}
                />
                <StatCard
                    title={t.systemStatus}
                    value={stats.count > 0 ? t.active : t.idle}
                    subValue={stats.source === 'DB' ? 'Serving from Cloud' : marketData.length > 0 ? t.mlReady : t.noData}
                    icon={Cpu}
                    color="purple"
                    trend="stable"
                    trendValue="Optimal"
                />
            </div>

            {/* 2. MARKET INTELLIGENCE (HYBRID) */}
            <div className="mt-4">
                <MarketIntelligence onNavigate={onNavigate} localData={marketData} />
            </div>

            {/* 3. LEADERBOARD (Full Width, Collapsed by default) */}
            <div className="mt-6 mb-2">
                <Leaderboard />
            </div>

            {/* 4. SHOUTS (Full Width Line) */}
            <div className="mt-4 mb-4">
                <ShoutBoxCompact userId={user?.id || ''} />
            </div>

            {/* 5. LIVE FEED (Immediately below Shouts) */}
            <div className="mt-2 mb-6 animate-fade-in text-center">
                <LiveFeed />
            </div>

            {/* 6. UPLOAD (Last Line - Full Width Feature) */}
            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-800 transition-colors mt-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg">
                        <Upload className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{t.uploadLog}</h3>
                        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                            {t.uploadLogDesc}
                            <br />
                            <span className="text-xs opacity-70 mt-1 block">Supports standard Wurm Online logs (.txt/.log). Data remains local unless verified.</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px]">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {isProcessing ? 'Processing File...' : 'Select Log File'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.log"
                        className="hidden"
                    />
                </div>
            </div>

            {!marketData.length && !globalStats && (
                <div className="text-center py-12">
                    <AdvancedTools />
                </div>
            )}

            {selectedPlayer && (
                <PlayerProfile
                    playerNick={selectedPlayer}
                    onClose={() => onPlayerSelect(null)}
                />
            )}
        </div>
    );
};
