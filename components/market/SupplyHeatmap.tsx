import React, { useMemo } from 'react';
import { HeatmapDataPoint } from '../../types';
import { formatWurmPrice } from '../../services/priceUtils';

interface SupplyHeatmapProps {
    data: HeatmapDataPoint[];
    itemName: string;
}

export const SupplyHeatmap: React.FC<SupplyHeatmapProps> = ({ data, itemName }) => {
    // Generate last 35 days grid (5 weeks x 7 days)
    const heatmapGrid = useMemo(() => {
        const grid: (HeatmapDataPoint | null)[][] = [];
        const today = new Date();
        const daysToShow = 35;

        // Create date map for quick lookup
        const dataMap = new Map<string, HeatmapDataPoint>();
        data.forEach(d => dataMap.set(d.date, d));

        // Find max count for color scaling
        const maxCount = Math.max(...data.map(d => d.count), 1);

        // Generate grid (5 rows x 7 cols)
        for (let week = 0; week < 5; week++) {
            const row: (HeatmapDataPoint | null)[] = [];
            for (let day = 0; day < 7; day++) {
                const daysAgo = (4 - week) * 7 + (6 - day);
                const date = new Date(today);
                date.setDate(date.getDate() - daysAgo);
                const dateStr = date.toISOString().split('T')[0];

                const dataPoint = dataMap.get(dateStr);
                row.push(dataPoint || null);
            }
            grid.push(row);
        }

        return { grid, maxCount };
    }, [data]);

    const getColorIntensity = (count: number | null) => {
        if (!count || count === 0) return 'bg-slate-800/30';

        const intensity = count / heatmapGrid.maxCount;
        if (intensity > 0.75) return 'bg-purple-500';
        if (intensity > 0.5) return 'bg-purple-600';
        if (intensity > 0.25) return 'bg-purple-700';
        return 'bg-purple-800';
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Last 35 Days</span>
                <div className="flex items-center gap-2">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-slate-800/30 rounded-sm"></div>
                        <div className="w-3 h-3 bg-purple-800 rounded-sm"></div>
                        <div className="w-3 h-3 bg-purple-700 rounded-sm"></div>
                        <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="space-y-1">
                {/* Week day labels */}
                <div className="flex gap-1">
                    <div className="w-8"></div>
                    {weekDays.map(day => (
                        <div key={day} className="flex-1 text-center text-[10px] text-slate-500">
                            {day[0]}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                {heatmapGrid.grid.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex gap-1 items-center">
                        <div className="w-8 text-[10px] text-slate-500 text-right">
                            W{5 - weekIdx}
                        </div>
                        {week.map((day, dayIdx) => {
                            const dateObj = new Date();
                            dateObj.setDate(dateObj.getDate() - ((4 - weekIdx) * 7 + (6 - dayIdx)));
                            const dateStr = dateObj.toISOString().split('T')[0];

                            return (
                                <div
                                    key={dayIdx}
                                    className={`flex-1 aspect-square rounded-sm ${getColorIntensity(day?.count || null)} 
                                        border border-slate-700/50 cursor-help group relative transition-all hover:ring-2 hover:ring-purple-400`}
                                    title={day ? `${dateStr}: ${day.count} listings` : dateStr}
                                >
                                    {/* Tooltip */}
                                    {day && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 animate-fade-in">
                                            <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-lg p-2 shadow-xl border border-slate-700 whitespace-nowrap text-xs">
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-b border-r border-slate-700 rotate-45"></div>
                                                <p className="font-mono text-slate-400 mb-1">{dateStr}</p>
                                                <p className="font-bold text-purple-400">{day.count} listings</p>
                                                <p className="text-slate-400">Avg: {formatWurmPrice(day.avgPrice)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
