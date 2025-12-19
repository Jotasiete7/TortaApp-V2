import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, ArrowRight, Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { IntelligenceService, MarketIntelligenceData, MarketTrendItem, TimeWindow } from '../../services/intelligence';
import { formatWurmPrice } from '../../services/priceUtils';
import { ViewState, MarketItem } from '../../types';
import { ArbitrageWidget } from './ArbitrageWidget';

const TrendItem = ({ item, type }: { item: MarketTrendItem, type: 'demand' | 'supply' | 'volatility' }) => {
    let priceColor = 'text-slate-300';

    if (type === 'demand') {
        priceColor = 'text-amber-400';
    } else if (type === 'supply') {
        priceColor = 'text-cyan-400';
    } else {
        priceColor = 'text-purple-400';
    }

    const isPositive = item.absoluteChange > 0;

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
                {type === 'supply' && item.avgPrice > 0 && (
                     <div className="text-[10px] text-slate-500 mt-0.5">
                        Avg: <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(item.avgPrice) }} className="opacity-75" />
                     </div>
                )}
            </div>
            
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} bg-slate-900/50 px-2 py-1 rounded`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(Math.abs(item.absoluteChange)) }} />
            </div>
        </div>
    );
};

interface MarketIntelligenceProps {
    onNavigate: (view: ViewState) => void;
    localData?: MarketItem[]; // NEW: Hybrid Support
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
                // Pass localData to Service
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
    }, [timeWindow, localData]); // Reload if localData changes (file upload)

    const sections = [
        {
            title: 'Top Demand (WTB)',
            icon: TrendingUp,
            color: 'amber',
            data: data?.topDemand || [],
            type: 'demand' as const,
            desc: 'Highest buy volume'
        },
        {
            title: 'Top Supply (WTS)',
            icon: TrendingDown,
            color: 'blue',
            data: data?.topSupply || [],
            type: 'supply' as const,
            desc: 'Most listed items'
        },
        {
            title: 'Top Volatility',
            icon: Zap,
            color: 'purple',
            data: data?.topVolatility || [],
            type: 'volatility' as const,
            desc: 'Largest price swings'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-slate-800/50 rounded-xl border border-slate-700/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Market Intelligence
                </h2>
                
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/50">
                    <Clock size={14} className="text-slate-500 ml-2 mr-2" />
                    {(['4h', '12h', '24h', '7d', '30d'] as TimeWindow[]).map(tw => (
                        <button
                            key={tw}
                            onClick={() => setTimeWindow(tw)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                timeWindow === tw 
                                ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/30' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                            }`}
                        >
                            {tw}
                        </button>
                    ))}
                </div>
            </div>

            <ArbitrageWidget onNavigate={onNavigate} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col h-full">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-start bg-slate-800/80 backdrop-blur-sm">
                            <div>
                                <h3 className={`font-bold text-${section.color === 'blue' ? 'cyan' : section.color}-400 flex items-center gap-2`}>
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{section.desc} • Last {timeWindow}</p>
                            </div>
                        </div>
                        
                        <div className="p-2 space-y-1 flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                            {section.data.length > 0 ? (
                                section.data.map((item, i) => (
                                    <TrendItem key={i} item={item} type={section.type} />
                                ))
                            ) : (
                                <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                                    <p>No enough data for this period.</p>
                                    <p className="mt-1 opacity-50">Try importing logs or waiting for more trades.</p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => onNavigate(ViewState.MARKET)}
                            className="w-full py-2 bg-slate-800/50 hover:bg-slate-700 text-xs font-medium text-slate-400 hover:text-white transition-colors border-t border-slate-700/50 flex items-center justify-center gap-1 group"
                        >
                            View Full Analysis
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
