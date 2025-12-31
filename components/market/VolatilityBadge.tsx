
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { VolatilityMetrics } from '../../types';
import { getVolatilityLevel, getVolatilityColor } from '../../services/volatilityCalculator';

interface VolatilityBadgeProps {
    metrics: VolatilityMetrics;
    itemName: string;
}

export const VolatilityBadge: React.FC<VolatilityBadgeProps> = ({ metrics, itemName }) => {
    // We are overriding the color logic here to match our new Semantics
    // Score based logic:
    // 0-20: Stable (Green/Blue/Shield)
    // 21-50: Normal (Green/Check)
    // 51-75: Unstable (Yellow/Alert)
    // 76-100: Chaotic (Red/Fire)

    const getSemanticProps = () => {
        const score = metrics.score;
        if (score <= 20) return { label: 'Stable', emoji: '🛡️', color: 'blue' };
        if (score <= 50) return { label: 'Normal', emoji: '✅', color: 'emerald' };
        if (score <= 75) return { label: 'Unstable', emoji: '⚠️', color: 'amber' };
        return { label: 'Chaotic', emoji: '🔥', color: 'red' };
    };

    const { label, emoji, color: colorClass } = getSemanticProps();

    const getTrendIcon = () => {
        switch (metrics.trend) {
            case 'rising': return <TrendingUp className="w-3 h-3" />;
            case 'falling': return <TrendingDown className="w-3 h-3" />;
            default: return <Minus className="w-3 h-3" />;
        }
    };

    return (
        <div className="group relative inline-block">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-${colorClass}-500/10 border-${colorClass}-500/50 text-${colorClass}-400 cursor-help transition-all hover:brightness-125`}>
                <span className="text-base">{emoji}</span>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Volatility</span>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold">{metrics.score}/100</span>
                        {getTrendIcon()}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 hidden group-hover:block z-50 animate-fade-in">
                <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-slate-700">
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-t border-l border-slate-700 rotate-45"></div>

                    <div className="relative">
                        <h4 className={`font-bold text-sm mb-2 text-${colorClass}-400 uppercase tracking-wide`}>
                            {label} Market
                        </h4>
                        <p className="text-xs text-slate-300 mb-3">
                            {label === 'Stable' && 'Prices are consistent with low variance. Safe for bulk purchases.'}
                            {label === 'Normal' && 'Standard price fluctuation. Market is operating efficiently.'}
                            {label === 'Unstable' && 'Some price fluctuation. Monitor trends before large investments.'}
                            {label === 'Chaotic' && 'High price swings. Risky for bulk trades, but opportunities exist.'}
                        </p>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Price Variance:</span>
                                <span className="font-mono text-white">{metrics.priceVariance.toFixed(2)}c</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Supply Consistency:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${metrics.supplyConsistency}%` }}></div>
                                    </div>
                                    <span className="font-mono text-white">{metrics.supplyConsistency}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Demand Stability:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${metrics.demandStability}%` }}></div>
                                    </div>
                                    <span className="font-mono text-white">{metrics.demandStability}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                <span className="text-slate-400">Trend:</span>
                                <span className={`font-bold capitalize ${metrics.trend === 'rising' ? 'text-emerald-400' :
                                    metrics.trend === 'falling' ? 'text-red-400' :
                                        'text-slate-400'
                                    }`}>
                                    {metrics.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
