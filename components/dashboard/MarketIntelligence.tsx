import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, ArrowRight, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { IntelligenceService, MarketIntelligenceData, MarketTrendItem } from '../../services/intelligence';
import { formatWurmPrice } from '../../services/priceUtils';
import { InfoTooltip } from '../market/InfoTooltip';

const TrendItem = ({ item, type }: { item: MarketTrendItem, type: 'demand' | 'supply' | 'volatility' }) => {
    let priceColor = 'text-slate-300';
    let icon = null;

    if (type === 'demand') {
        priceColor = 'text-amber-400';
    } else if (type === 'supply') {
        priceColor = 'text-cyan-400';
    } else {
        priceColor = 'text-purple-400';
    }

    const isPositive = item.change > 0;

    return (
        <div className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-transparent hover:border-slate-600 transition-all group">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-mono font-bold ${priceColor}`}>
                        <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(item.price) }} />
                    </span>
                    <span className="text-[10px] text-slate-500">• {item.volume} vol</span>
                </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} bg-slate-900/50 px-2 py-1 rounded`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(item.change)}%
            </div>
        </div>
    );
};

export const MarketIntelligence = () => {
    const [data, setData] = useState<MarketIntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const result = await IntelligenceService.getMarketIntelligence();
            setData(result);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-slate-800/50 rounded-xl border border-slate-700/50"></div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Market Intelligence
                    <InfoTooltip text="Real-time strategic insights based on the last 4 hours of market activity." />
                </h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Synced just now</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. TOP DEMAND (WTB) */}
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4" /> Top Demand (WTB)
                        </h3>
                        <div className="space-y-2">
                            {data.topDemand.map((item, i) => (
                                <TrendItem key={i} item={item} type="demand" />
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                            <button className="text-[10px] text-amber-500 hover:text-amber-300 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors">
                                View Opportunities <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. TOP SUPPLY (WTS) */}
                <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingDown className="w-24 h-24 text-cyan-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                            <TrendingDown className="w-4 h-4" /> Top Supply (WTS)
                        </h3>
                        <div className="space-y-2">
                            {data.topSupply.map((item, i) => (
                                <TrendItem key={i} item={item} type="supply" />
                            ))}
                        </div>
                         <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                            <button className="text-[10px] text-cyan-500 hover:text-cyan-300 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors">
                                Browse Listings <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. HIGH VOLATILITY */}
                <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-24 h-24 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4" /> High Volatility
                        </h3>
                        <div className="space-y-2">
                            {data.topVolatility.map((item, i) => (
                                <TrendItem key={i} item={item} type="volatility" />
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                            <button className="text-[10px] text-purple-500 hover:text-purple-300 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors">
                                Analyze Trends <ArrowRight className="w-3 h-3" />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
