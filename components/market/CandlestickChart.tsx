import React from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import { CandlestickDataPoint } from '../../types';
import { formatWurmPrice } from '../../services/priceUtils';

interface CandlestickChartProps {
    data: CandlestickDataPoint[];
    itemName: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, itemName }) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isBullish = data.close >= data.open;

            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                    <p className="text-slate-400 font-mono mb-2">{data.date}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Open:</span>
                            <span className="font-mono text-white">{formatWurmPrice(data.open)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">High:</span>
                            <span className="font-mono text-emerald-400">{formatWurmPrice(data.high)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Low:</span>
                            <span className="font-mono text-red-400">{formatWurmPrice(data.low)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Close:</span>
                            <span className={`font-mono ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatWurmPrice(data.close)}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4 pt-2 border-t border-slate-800">
                            <span className="text-slate-500">Volume:</span>
                            <span className="font-mono text-blue-400">{data.volume}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom candlestick shape
    const Candlestick = (props: any) => {
        const { x, y, width, height, payload } = props;
        const isBullish = payload.close >= payload.open;
        const color = isBullish ? '#10b981' : '#ef4444'; // emerald-500 : red-500

        // Calculate positions
        const bodyTop = Math.min(payload.open, payload.close);
        const bodyBottom = Math.max(payload.open, payload.close);
        const bodyHeight = Math.abs(payload.close - payload.open);

        // Scale factor (assuming y-axis is inverted)
        const yScale = height / (payload.high - payload.low);
        const yOffset = y;

        const wickX = x + width / 2;
        const highY = yOffset;
        const lowY = yOffset + height;
        const bodyY = yOffset + (payload.high - bodyTop) * yScale;
        const bodyH = bodyHeight * yScale || 1; // Minimum 1px for doji

        return (
            <g>
                {/* Wick (high-low line) */}
                <line
                    x1={wickX}
                    y1={highY}
                    x2={wickX}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1}
                />
                {/* Body (open-close rectangle) */}
                <rect
                    x={x + width * 0.2}
                    y={bodyY}
                    width={width * 0.6}
                    height={bodyH}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                />
            </g>
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>No candlestick data available</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    minTickGap={30}
                />
                <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    width={50}
                    domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Render custom candlesticks */}
                <Bar
                    dataKey="high"
                    shape={<Candlestick />}
                    isAnimationActive={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};
