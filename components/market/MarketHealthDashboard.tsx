import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, AlertCircle } from 'lucide-react';
import { MarketItem } from '../../types';
import { formatWurmPrice } from '../../services/priceUtils';

interface MarketHealthProps {
    rawData: MarketItem[];
}

interface ItemStats {
    name: string;
    currentAvg: number;
    previousAvg: number;
    change: number;
    changePercent: number;
    volume: number;
}

export const MarketHealthDashboard: React.FC<MarketHealthProps> = ({ rawData }) => {
    // Calculate market metrics
    const marketMetrics = useMemo(() => {
        if (rawData.length === 0) {
            return {
                totalVolume24h: 0,
                totalVolume7d: 0,
                volumeChange: 0,
                topGainers: [],
                topLosers: [],
                mostActive: [],
                marketPulse: 'neutral' as 'bullish' | 'bearish' | 'neutral'
            };
        }

        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

        // Volume calculations
        const last24h = rawData.filter(i => new Date(i.timestamp).getTime() > oneDayAgo);
        const last7d = rawData.filter(i => new Date(i.timestamp).getTime() > sevenDaysAgo);
        const prev7d = rawData.filter(i => {
            const time = new Date(i.timestamp).getTime();
            return time > fourteenDaysAgo && time <= sevenDaysAgo;
        });

        const totalVolume24h = last24h.length;
        const totalVolume7d = last7d.length;
        const volumeChange = prev7d.length > 0
            ? ((totalVolume7d - prev7d.length) / prev7d.length) * 100
            : 0;

        // Calculate price changes per item
        const itemChanges = new Map<string, ItemStats>();

        // Get unique items
        const uniqueItems = Array.from(new Set(rawData.map(i => i.name)));

        uniqueItems.forEach(itemName => {
            const allItemData = rawData.filter(i => i.name === itemName);
            const recentData = allItemData.filter(i => new Date(i.timestamp).getTime() > sevenDaysAgo);
            const oldData = allItemData.filter(i => {
                const time = new Date(i.timestamp).getTime();
                return time > fourteenDaysAgo && time <= sevenDaysAgo;
            });

            if (recentData.length > 0 && oldData.length > 0) {
                const currentAvg = recentData.reduce((sum, i) => sum + i.price, 0) / recentData.length;
                const previousAvg = oldData.reduce((sum, i) => sum + i.price, 0) / oldData.length;
                const change = currentAvg - previousAvg;
                const changePercent = (change / previousAvg) * 100;

                itemChanges.set(itemName, {
                    name: itemName,
                    currentAvg,
                    previousAvg,
                    change,
                    changePercent,
                    volume: recentData.length
                });
            }
        });

        // Top gainers and losers
        const sortedByChange = Array.from(itemChanges.values())
            .filter(i => i.volume >= 5) // Minimum volume filter
            .sort((a, b) => b.changePercent - a.changePercent);

        const topGainers = sortedByChange.slice(0, 5);
        const topLosers = sortedByChange.slice(-5).reverse();

        // Most active items
        const mostActive = Array.from(itemChanges.values())
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        // Market pulse (overall sentiment)
        const avgChange = sortedByChange.reduce((sum, i) => sum + i.changePercent, 0) / sortedByChange.length;
        const marketPulse: 'bullish' | 'bearish' | 'neutral' =
            avgChange > 5 ? 'bullish' : avgChange < -5 ? 'bearish' : 'neutral';

        return {
            totalVolume24h,
            totalVolume7d,
            volumeChange,
            topGainers,
            topLosers,
            mostActive,
            marketPulse
        };
    }, [rawData]);

    const getPulseColor = (pulse: string) => {
        switch (pulse) {
            case 'bullish': return 'text-emerald-400';
            case 'bearish': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getPulseIcon = (pulse: string) => {
        switch (pulse) {
            case 'bullish': return <TrendingUp className="w-5 h-5" />;
            case 'bearish': return <TrendingDown className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    if (rawData.length === 0) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Market Health</h3>
                </div>
                <p className="text-slate-500 text-sm">No market data available</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Market Health</h3>
                </div>
                <div className={`flex items-center gap-2 ${getPulseColor(marketMetrics.marketPulse)}`}>
                    {getPulseIcon(marketMetrics.marketPulse)}
                    <span className="text-sm font-bold capitalize">{marketMetrics.marketPulse}</span>
                </div>
            </div>

            {/* Volume Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">24h Volume</p>
                    <p className="text-xl font-bold text-white">{marketMetrics.totalVolume24h.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">7d Volume</p>
                    <p className="text-xl font-bold text-white">{marketMetrics.totalVolume7d.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">7d Change</p>
                    <p className={`text-xl font-bold ${marketMetrics.volumeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {marketMetrics.volumeChange >= 0 ? '+' : ''}{marketMetrics.volumeChange.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Top Movers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Gainers */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold text-emerald-400">Top Gainers (7d)</h4>
                    </div>
                    <div className="space-y-2">
                        {marketMetrics.topGainers.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-slate-600 font-bold">#{idx + 1}</span>
                                    <span className="text-white truncate">{item.name}</span>
                                </div>
                                <span className="text-emerald-400 font-bold">+{item.changePercent.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Losers */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <h4 className="text-sm font-semibold text-red-400">Top Losers (7d)</h4>
                    </div>
                    <div className="space-y-2">
                        {marketMetrics.topLosers.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-slate-600 font-bold">#{idx + 1}</span>
                                    <span className="text-white truncate">{item.name}</span>
                                </div>
                                <span className="text-red-400 font-bold">{item.changePercent.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Most Active */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-white">Most Active (7d)</h4>
                </div>
                <div className="space-y-2">
                    {marketMetrics.mostActive.slice(0, 3).map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-slate-600 font-bold">#{idx + 1}</span>
                                <span className="text-white truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">{item.volume} trades</span>
                                <span className={`font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
