import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, HelpCircle, BarChart2 } from 'lucide-react';
import { MarketTrendItem, MarketIntelligenceData, IntelligenceService } from '../../services/intelligence';
import { formatWurmPrice } from '../../services/priceUtils';
import { MarketItem, ViewState } from '../../types';

interface MarketIntelligenceProps {
    onNavigate: (view: ViewState) => void;
    localData: MarketItem[];
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ onNavigate, localData }) => {
    const [data, setData] = React.useState<MarketIntelligenceData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [timeWindow, setTimeWindow] = React.useState<'4h' | '12h' | '24h' | '7d' | '30d'>('7d');

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Fetch intelligence (with strict filtering now applied in service)
                const result = await IntelligenceService.getMarketIntelligence(timeWindow, localData);
                setData(result);
            } catch (error) {
                console.error("Failed to load market intelligence", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [timeWindow, localData]);

    const TrendItem = ({ item, type, rank }: { item: MarketTrendItem, type: 'demand' | 'supply' | 'volatility', rank: number }) => {
        const isPositive = type === 'demand' ? true : type === 'supply' ? null : item.absoluteChange > 0;

        return (
            <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:bg-slate-800/60 transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Rank Badge - Compact */}
                    <div className={`
                        w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0
                        ${rank === 1 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}
                    `}>
                        {rank}
                    </div>

                    <div className="flex flex-col min-w-0">
                        {/* Item Name: Clear Contrast, truncated */}
                        <span className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors truncate max-w-[140px] leading-tight">
                            {item.name}
                        </span>

                        {/* HIERARCHY REFACTOR: Compact Price & Vol */}
                        <div className="flex items-baseline gap-2 mt-0.5">
                            {/* Price: White, Bold, Monospace numbers for alignment */}
                            <span className="text-sm font-bold text-white tabular-nums tracking-tight leading-none">
                                <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(item.price) }} />
                            </span>

                            {/* Volume: De-emphasized metadata line */}
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                Vol: {item.volume}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual Indicator of Change - Compact */}
                <div className={`flex flex-col items-end gap-0.5 shrink-0 ml-2 ${isPositive ? 'text-emerald-400' : isPositive === null ? 'text-cyan-400' : 'text-rose-400'}`}>
                    <div className={`flex items-center gap-1 text-[10px] font-bold bg-slate-950/40 px-1.5 py-1 rounded border border-white/5`}>
                        {type === 'supply' ? (
                            <Activity className="w-3 h-3" />
                        ) : (
                            isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(Math.abs(item.absoluteChange)) }} />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">Analyzing market data...</div>;
    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Market Intelligence</h2>
                </div>

                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    {(['4h', '12h', '24h', '7d', '30d'] as const).map(w => (
                        <button
                            key={w}
                            onClick={() => setTimeWindow(w)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeWindow === w
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                }`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Demand (WTB) */}
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="px-4 py-3 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Top Demand (WTB)</h3>
                        </div>
                        <span className="text-[10px] text-emerald-500/60 font-semibold">Highest buy interest</span>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1 min-h-[290px]"> {/* Optimized Padding & Gap */}
                        {data.topDemand.map((item, i) => (
                            <TrendItem key={i} item={item} type="demand" rank={i + 1} />
                        ))}
                        {data.topDemand.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic opacity-50">
                                <span>No demand spikes detected</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onNavigate(ViewState.MARKET)}
                        className="w-full py-2 text-[10px] uppercase font-bold text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors border-t border-slate-800"
                    >
                        Deep Dive Analysis &rarr;
                    </button>
                </div>

                {/* 2. Supply (WTS) */}
                <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="px-4 py-3 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Top Supply (WTS)</h3>
                        </div>
                        <span className="text-[10px] text-cyan-500/60 font-semibold">New listings</span>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1 min-h-[290px]">
                        {data.topSupply.map((item, i) => (
                            <TrendItem key={i} item={item} type="supply" rank={i + 1} />
                        ))}
                        {data.topSupply.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic opacity-50">
                                <span>No new supply detected</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onNavigate(ViewState.MARKET)}
                        className="w-full py-2 text-[10px] uppercase font-bold text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5 transition-colors border-t border-slate-800"
                    >
                        Deep Dive Analysis &rarr;
                    </button>
                </div>

                {/* 3. Volatility */}
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="px-4 py-3 border-b border-purple-500/10 bg-gradient-to-r from-purple-500/5 to-transparent flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Top Volatility</h3>
                        </div>
                        <span className="text-[10px] text-purple-500/60 font-semibold">Largest swings</span>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1 min-h-[290px]">
                        {data.topVolatility.map((item, i) => (
                            <TrendItem key={i} item={item} type="volatility" rank={i + 1} />
                        ))}
                        {data.topVolatility.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic opacity-50">
                                <span>Market is stable</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onNavigate(ViewState.MARKET)}
                        className="w-full py-2 text-[10px] uppercase font-bold text-slate-500 hover:text-purple-400 hover:bg-purple-500/5 transition-colors border-t border-slate-800"
                    >
                        Deep Dive Analysis &rarr;
                    </button>
                </div>

            </div>
        </div>
    );
};
