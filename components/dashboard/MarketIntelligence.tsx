import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, ArrowRight, Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { IntelligenceService, MarketIntelligenceData, MarketTrendItem, TimeWindow } from '../../services/intelligence';
import { formatWurmPrice } from '../../services/priceUtils';
import { ViewState, MarketItem } from '../../types';
import { ArbitrageWidget } from './ArbitrageWidget';

const TrendItem = ({ item, type }: { item: MarketTrendItem, type: 'demand' | 'supply' | 'volatility' }) => {
    // DESIGN REFACTOR: 
    // - Positive/High Demand = Green/Emerald
    // - Supply/Negative = Cyan (kept as requested, or maybe Neutral?) -> Prompt says "Verde pos, Vermelho neg, Roxo marca".
    // Let's interpret "Top Demand" as a "Positive Market Signal" -> Emerald.
    // "Top Supply" is neutral/inventory -> Cyan or Slate.
    // "Volatility" -> Purple/Amber.

    // Price Text: Pure White (#FFFFFF)
    // Metadata: Lighter Grey (#A0AEC0)

    const isPositive = item.absoluteChange > 0;

    return (
        <div className="flex items-center justify-between p-5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-transparent hover:border-slate-600 transition-all group">
            <div className="flex flex-col gap-1">
                {/* Item Name: Clear Contrast */}
                <span className="text-sm font-medium text-slate-100 group-hover:text-white transition-colors tracking-wide truncate max-w-[180px]">
                    {item.name}
                </span>

                {/* HIERARCHY REFACTOR: Price is Hero, Volume is Metadata */}
                <div className="flex flex-col">
                    {/* Price: White, Bold, Monospace numbers for alignment */}
                    <span className="text-lg font-bold text-white tabular-nums tracking-tight leading-none">
                        <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(item.price) }} />
                    </span>

                    {/* Volume: De-emphasized metadata line */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-medium">Vol: {item.volume}</span>
                        {type === 'supply' && item.avgPrice > 0 && (
                            <>
                                <span className="text-slate-600">•</span>
                                <span className="text-[10px] text-slate-500">
                                    Avg: <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(item.avgPrice) }} className="opacity-75" />
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Indicator of Change */}
            <div className={`flex flex-col items-end gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                <div className={`flex items-center gap-1 text-xs font-bold bg-slate-950/40 px-2 py-1.5 rounded-lg border border-white/5`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(Math.abs(item.absoluteChange)) }} />
                </div>
            </div>
        </div>
    );
};

interface MarketIntelligenceProps {
    onNavigate: (view: ViewState) => void;
    localData?: MarketItem[];
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ onNavigate, localData }) => {
    const [data, setData] = useState<MarketIntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const result = await IntelligenceService.getMarketIntelligence(timeWindow, localData);
                if (mounted) setData(result);
            } catch (e) {
                console.error("Failed to load market intelligence", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [timeWindow, localData]);

    const sections = [
        {
            title: 'Top Demand (WTB)',
            icon: TrendingUp,
            color: 'emerald', // Standardized Positive
            data: data?.topDemand || [],
            type: 'demand' as const,
            desc: 'Highest buy interest'
        },
        {
            title: 'Top Supply (WTS)',
            icon: TrendingDown,
            color: 'cyan', // Standardized Neutral/Supply
            data: data?.topSupply || [],
            type: 'supply' as const,
            desc: 'New listings'
        },
        {
            title: 'Top Volatility',
            icon: Zap,
            color: 'purple', // Standardized Action/Active
            data: data?.topVolatility || [],
            type: 'volatility' as const,
            desc: 'Largest swings'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-80 bg-slate-800/30 rounded-2xl border border-slate-700/30" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    Market Intelligence
                </h2>

                <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    {(['4h', '12h', '24h', '7d', '30d'] as TimeWindow[]).map(tw => (
                        <button
                            key={tw}
                            onClick={() => setTimeWindow(tw)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeWindow === tw
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }`}
                        >
                            {tw}
                        </button>
                    ))}
                </div>
            </div>

            <ArbitrageWidget onNavigate={onNavigate} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col h-full shadow-sm hover:shadow-md">
                        <div className="p-5 border-b border-slate-700/50 flex justify-between items-start bg-slate-800/20">
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider text-${section.color}-400 flex items-center gap-2 mb-1`}>
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">{section.desc}</p>
                            </div>
                        </div>

                        <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[340px] custom-scrollbar">
                            {section.data.length > 0 ? (
                                section.data.map((item, i) => (
                                    <TrendItem key={i} item={item} type={section.type} />
                                ))
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6 bg-slate-900/20 m-2 rounded-xl border border-dashed border-slate-800">
                                    <Activity className="w-10 h-10 mb-3 opacity-20 text-slate-400" />
                                    <p className="font-medium">No activity detected</p>
                                    <p className="mt-1 opacity-60 max-w-[150px]">Try increasing the time window or import deeper logs.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3">
                            <button
                                onClick={() => onNavigate(ViewState.MARKET)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all rounded-xl flex items-center justify-center gap-2 group border border-slate-700/50 hover:border-slate-600"
                            >
                                Deep Dive Analysis
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
