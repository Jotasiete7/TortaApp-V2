import React, { useMemo } from 'react';
import { formatWurmPrice } from '../../services/priceUtils';

interface PriceHistogramProps {
    prices: number[];
    fairPrice: number;
    p25: number;
    p75: number;
}

export const PriceHistogram: React.FC<PriceHistogramProps> = ({ prices, fairPrice, p25, p75 }) => {
    const { bins, maxCount } = useMemo(() => {
        if (prices.length === 0) return { bins: [], maxCount: 0 };

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;

        // Determine bin count (Sturges' formula or fixed)
        // Fixed 20 bins for UI consistency
        const binCount = 20;
        const binSize = range / binCount || 1; // Avoid division by zero

        const bins = Array(binCount).fill(0).map((_, i) => ({
            start: min + i * binSize,
            end: min + (i + 1) * binSize,
            count: 0,
            isFair: false,
            isBuy: false,
            isSell: false
        }));

        prices.forEach(p => {
            const binIndex = Math.min(
                Math.floor((p - min) / binSize),
                binCount - 1
            );
            bins[binIndex].count++;
        });

        // Mark zones
        bins.forEach(bin => {
            const mid = (bin.start + bin.end) / 2;
            if (mid < p25) bin.isBuy = true;
            else if (mid > p75) bin.isSell = true;

            // Highlight fair price bin
            if (fairPrice >= bin.start && fairPrice <= bin.end) {
                bin.isFair = true;
            }
        });

        const maxCount = Math.max(...bins.map(b => b.count));

        return { bins, maxCount };
    }, [prices, fairPrice, p25, p75]);

    if (prices.length === 0) return null;

    return (
        <div className="w-full space-y-2 select-none">
            <div className="flex items-end justify-between h-32 gap-1 pt-4 pb-2 px-2 bg-slate-900/50 rounded-lg border border-slate-800 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between px-2 py-2 pointer-events-none opacity-20">
                    <div className="border-t border-slate-500 w-full"></div>
                    <div className="border-t border-slate-500 w-full"></div>
                    <div className="border-t border-slate-500 w-full"></div>
                </div>

                {bins.map((bin, i) => {
                    const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;

                    let colorClass = 'bg-slate-600';
                    if (bin.isFair) colorClass = 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
                    else if (bin.isBuy) colorClass = 'bg-emerald-500/60';
                    else if (bin.isSell) colorClass = 'bg-rose-500/60';

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max">
                                <div className="bg-slate-800 text-xs text-white p-2 rounded shadow-lg border border-slate-700">
                                    <div className="font-bold">{bin.count} items</div>
                                    <div className="text-slate-400">
                                        {formatWurmPrice(bin.start)} - {formatWurmPrice(bin.end)}
                                    </div>
                                </div>
                            </div>

                            {/* Bar */}
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-100 ${colorClass} ${bin.isFair ? 'opacity-100 z-10' : 'opacity-70'}`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                            ></div>
                        </div>
                    );
                })}
            </div>

            {/* Legend / Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                <span>{formatWurmPrice(bins[0].start)}</span>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/60 rounded-sm"></div> Buy Zone</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-sm"></div> Fair Price</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500/60 rounded-sm"></div> Sell Zone</span>
                </div>
                <span>{formatWurmPrice(bins[bins.length - 1].end)}</span>
            </div>
        </div>
    );
};
