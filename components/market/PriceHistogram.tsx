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

        // Dynamic Bin Count (Sturges' Rule equivalent logic)
        // Min 5, Max 15 to prevent clutter
        const idealBins = Math.ceil(Math.log2(prices.length) + 1);
        const binCount = Math.max(5, Math.min(15, idealBins + 2));

        const binSize = range / binCount || 1;

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

        bins.forEach(bin => {
            const mid = (bin.start + bin.end) / 2;
            if (mid < p25) bin.isBuy = true;
            else if (mid > p75) bin.isSell = true;
            if (fairPrice >= bin.start && fairPrice <= bin.end) bin.isFair = true;
        });

        const maxCount = Math.max(...bins.map(b => b.count));
        return { bins, maxCount };
    }, [prices, fairPrice, p25, p75]);

    if (prices.length === 0) return null;

    return (
        <div className="w-full space-y-2 select-none group/chart">
            <div className="flex items-end justify-between h-32 gap-1 pt-4 pb-2 px-2 bg-slate-900/50 rounded-lg border border-slate-800 relative z-0">
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

                    // Smart Alignment for Tooltip
                    const isFirst = i < 2;
                    const isLast = i > bins.length - 3;
                    const alignClass = isFirst ? 'left-0 translate-x-0' : isLast ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2';

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full group/bin relative z-10 hover:z-50">
                            {/* Bar */}
                            <div
                                className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-100 ${colorClass} ${bin.isFair ? 'opacity-100' : 'opacity-70'}`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                            ></div>

                            {/* Hover Tooltip (Now Absolute to the Chart Container or Smart Positioned) */}
                            <div className={`absolute bottom-full mb-2 ${alignClass} hidden group-hover/bin:block pointer-events-none whitespace-nowrap z-50`}>
                                <div className="bg-slate-900 text-[10px] text-white p-2 rounded-lg border border-slate-600 shadow-xl flex flex-col items-center gap-1 min-w-[100px] backdrop-blur-md bg-opacity-95">
                                    <div className="font-bold text-base text-purple-400">{bin.count} deals</div>
                                    <div className="h-px w-full bg-slate-700"></div>
                                    <div className="font-mono text-slate-300 flex justify-between w-full gap-2">
                                        <span>{formatWurmPrice(bin.start)}</span>
                                        <span className="text-slate-500">-</span>
                                        <span>{formatWurmPrice(bin.end)}</span>
                                    </div>
                                </div>
                                {/* Triangle Arrow */}
                                <div className={`absolute top-full w-0 h-0 border-4 border-transparent border-t-slate-600 ${isFirst ? 'left-2' : isLast ? 'right-2' : 'left-1/2 -translate-x-1/2'}`}></div>
                            </div>
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
