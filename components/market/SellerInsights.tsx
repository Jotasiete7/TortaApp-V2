import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { SellerInsights as SellerInsightsType } from '../../types';
import { formatWurmPrice } from '../../services/priceUtils';

interface SellerInsightsProps {
    sellers: SellerInsightsType[];
    itemName: string;
}

export const SellerInsights: React.FC<SellerInsightsProps> = ({ sellers, itemName }) => {
    if (sellers.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>No seller data available</p>
            </div>
        );
    }

    const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

    const pieData = sellers.map((s, i) => ({
        name: s.seller,
        value: s.marketShare,
        color: COLORS[i % COLORS.length]
    }));

    const getStrategyIcon = (strategy: string) => {
        switch (strategy) {
            case 'premium': return <TrendingUp className="w-3 h-3 text-amber-500" />;
            case 'discount': return <TrendingDown className="w-3 h-3 text-emerald-500" />;
            default: return <Minus className="w-3 h-3 text-slate-500" />;
        }
    };

    const getStrategyBadge = (strategy: string) => {
        switch (strategy) {
            case 'premium':
                return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">Premium</span>;
            case 'discount':
                return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">Discount</span>;
            default:
                return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600">Market</span>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Market Share Pie Chart */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Market Share
                </h4>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    borderColor: '#475569',
                                    borderRadius: '0.5rem',
                                    fontSize: '12px'
                                }}
                                formatter={(value: any) => `${value.toFixed(1)}%`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Sellers List */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Sellers
                </h4>
                <div className="space-y-2">
                    {sellers.map((seller, idx) => (
                        <div
                            key={seller.seller}
                            className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-black' :
                                        idx === 1 ? 'bg-slate-400 text-black' :
                                            idx === 2 ? 'bg-orange-600 text-white' :
                                                'bg-slate-700 text-slate-400'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{seller.seller}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-slate-500">{seller.totalListings} listings</span>
                                        <span className="text-[10px] text-slate-600">•</span>
                                        <span className="text-[10px] text-purple-400 font-mono">{seller.marketShare.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-mono text-slate-300">{formatWurmPrice(seller.avgPrice)}</span>
                                {getStrategyBadge(seller.priceStrategy)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Scores */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-white mb-3">Activity Scores</h4>
                <div className="space-y-2">
                    {sellers.slice(0, 3).map(seller => (
                        <div key={seller.seller} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-20 truncate">{seller.seller}</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                                    style={{ width: `${seller.activityScore}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-mono text-slate-400 w-8 text-right">{seller.activityScore}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
