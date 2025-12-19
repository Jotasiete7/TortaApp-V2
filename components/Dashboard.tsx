import React, { useRef, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Database, DollarSign, Cpu, Upload, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { LogUploader } from './LogProcessor/LogUploader';
import { Leaderboard } from './gamification/Leaderboard';
import { PlayerProfile } from './PlayerProfile';
import { NickVerification } from './auth/NickVerification';
import { ShoutBox } from './gamification/ShoutBox';
import { LiveTradeSetup } from './LiveTradeSetup';
import { LiveFeed } from './LiveFeed';
import { AdvancedTools } from './AdvancedTools';
import { MarketItem, Language } from '../types';
import { translations } from '../services/i18n';
import { IntelligenceService, GlobalStats } from '../services/intelligence';
import { useAuth } from '../contexts/AuthContext';

interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
}

interface DashboardProps {
    onFileUpload: (file: File) => void;
    isProcessing: boolean;
    marketData: MarketItem[];
    language: Language;
    selectedPlayer: string | null;
    onPlayerSelect: (player: string | null) => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, color, trend = 'stable', trendValue }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
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
);

export const Dashboard: React.FC<DashboardProps> = ({
    onFileUpload,
    isProcessing,
    marketData,
    language,
    selectedPlayer,
    onPlayerSelect
}) => {
    const t = translations[language];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showIdentity, setShowIdentity] = useState(false);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const { user } = useAuth();

    React.useEffect(() => {
        const fetchStats = async () => {
            const stats = await IntelligenceService.getGlobalStats();
            setGlobalStats(stats);
        };
        fetchStats();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    const stats = useMemo(() => {
        if (marketData && marketData.length > 0) {
            const count = marketData.length;
            let totalVolume = 0;
            let totalPrice = 0;
            let wtsCount = 0;
            let wtbCount = 0;

            marketData.forEach(item => {
                totalVolume += item.price;
                totalPrice += item.price;
                if (item.orderType === 'WTS') wtsCount++;
                if (item.orderType === 'WTB') wtbCount++;
            });

            const avgPrice = count > 0 ? totalPrice / count : 0;

            return {
                totalVolume,
                count,
                avgPrice,
                wtsCount,
                wtbCount,
                source: 'FILE'
            };
        }

        if (globalStats) {
            return {
                totalVolume: globalStats.total_volume,
                count: globalStats.items_indexed,
                avgPrice: globalStats.avg_price,
                wtsCount: globalStats.wts_count,
                wtbCount: globalStats.wtb_count,
                source: 'DB'
            };
        }

        return {
            totalVolume: 0,
            count: 0,
            avgPrice: 0,
            wtsCount: 0,
            wtbCount: 0,
            source: 'NONE'
        };
    }, [marketData, globalStats]);

    const formatPrice = (c: number) => {
        if (c === 0) return "0c";
        if (c >= 10000) return `${(c / 10000).toFixed(1)}g`;
        if (c >= 100) return `${(c / 100).toFixed(1)}s`;
        return `${c.toFixed(0)}c`;
    }

    if (selectedPlayer) {
        return (
            <PlayerProfile
                nick={selectedPlayer}
                onBack={() => onPlayerSelect(null)}
            />
        );
    }

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
                        {/* Enhanced System Status Indicator */}
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
                    <button
                        onClick={() => setShowIdentity(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors"
                    >
                        <Shield className="w-4 h-4" />
                        Link Identity
                    </button>
                    {/* Enhanced Database Indicator */}
                     <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border shadow-lg ${stats.source === 'DB' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${stats.source === 'DB' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-500'}`}></div>
                        <span className="font-semibold">{stats.source === 'FILE' ? 'Live File Data' : stats.source === 'DB' ? 'Database Connected' : t.awaitingData}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={t.totalVolume}
                    value={formatPrice(stats.totalVolume)}
                    subValue="Aggregate value"
                    icon={Activity}
                    color="amber"
                    trend="up"
                    trendValue="+4.2% (24h)"
                />
                <StatCard
                    title={t.itemsIndexed}
                    value={stats.count.toLocaleString()}
                    subValue={`${stats.wtsCount} WTS / ${stats.wtbCount} WTB`}
                    icon={Database}
                    color="blue"
                    trend="up"
                    trendValue="Growing"
                />
                <StatCard
                    title={t.avgPrice}
                    value={formatPrice(stats.avgPrice)}
                    subValue="Across all rarities"
                    icon={DollarSign}
                    color="emerald"
                    trend="stable"
                    trendValue="Stable"
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

            <div className="mt-6 mb-6 animate-fade-in">
                <LiveFeed />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">{t.recentLogs}</h3>
                    <div className="space-y-4">
                        {marketData.length > 0 ? (
                            <>
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="text-slate-500 font-mono">NOW</span>
                                    <span className="text-emerald-400">Successfully indexed {marketData.length} records.</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="text-slate-500 font-mono">NOW</span>
                                    <span className="text-blue-400">Analytics Engine ready for queries.</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-start gap-3 text-sm">
                                <span className="text-slate-500 font-mono">--:--</span>
                                <span className="text-amber-400">Waiting for user input file...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">{t.quickActions}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".txt,.csv,.log"
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed h-full"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="font-medium text-white">
                                    {isProcessing ? t.processing : t.uploadDump}
                                </div>
                                {isProcessing ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400 group-hover:text-white" />}
                            </div>
                            <div className="text-xs text-slate-400">
                                {isProcessing ? 'Parsing massive file...' : t.uploadHint}
                            </div>
                        </button>

                        <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all opacity-50 cursor-not-allowed h-full">
                            <div className="font-medium text-white mb-1">Run Predictions</div>
                            <div className="text-xs text-slate-400">Requires Loaded Data</div>
                        </button>
                    </div>
                </div>
            </div>

            {user && (
                <div className="mt-8">
                    <ShoutBox userId={user.id} />
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Market Intelligence
                </h2>
                <Leaderboard />
            </div>

            <AdvancedTools />
        </div>
    );
};
