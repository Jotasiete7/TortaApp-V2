import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Brain, AlertCircle } from 'lucide-react';
import { MarketItem } from '../../types';
import { predictPrice, generateForecastData, getTrendDisplay } from '../../services/predictiveAnalytics';
import { formatWurmPrice } from '../../services/priceUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useChartsTranslation } from '../../services/chartsTranslations';

interface PriceForecastProps {
    items: MarketItem[];
    itemName: string;
}

export const PriceForecastPanel: React.FC<PriceForecastProps> = ({ items, itemName }) => {
    const { t } = useChartsTranslation();
    
    const forecast = useMemo(() => {
        if (!itemName || items.length === 0) return null;
        return predictPrice(items, itemName, 7);
    }, [items, itemName]);

    const forecastData = useMemo(() => {
        if (!itemName || items.length === 0) return [];
        return generateForecastData(items, itemName, 7);
    }, [items, itemName]);

    if (!forecast) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Price Forecast</h3>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <p>{t('not_enough_data')}</p>
                </div>
            </div>
        );
    }

    const trendDisplay = getTrendDisplay(forecast.trend, t);
    const isPositive = forecast.predictedChange >= 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                    <p className="text-slate-400 font-mono mb-2">{data.date}</p>
                    {data.actual && (
                        <div className="flex justify-between gap-4 mb-1">
                            <span className="text-slate-500">Actual:</span>
                            <span className="font-mono text-white">{formatWurmPrice(data.actual)}</span>
                        </div>
                    )}
                    <div className="flex justify-between gap-4 mb-1">
                        <span className="text-slate-500">Predicted:</span>
                        <span className="font-mono text-purple-400">{formatWurmPrice(data.predicted)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-[10px] text-slate-600">
                        <span>Range:</span>
                        <span>{formatWurmPrice(data.lowerBound)} - {formatWurmPrice(data.upperBound)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Price Forecast (7d)</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Activity className="w-3 h-3" />
                    <span>{forecast.dataPoints} data points</span>
                </div>
            </div>

            {/* Main Prediction */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">Current Price</p>
                    <p className="text-2xl font-bold text-white">{formatWurmPrice(forecast.currentPrice)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-xs text-slate-500 mb-1">Predicted (7d)</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-purple-400">{formatWurmPrice(forecast.predictedPrice)}</p>
                        <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{forecast.predictedChangePercent.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Trend & Confidence */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`bg-slate-900/50 rounded-lg p-3 border border-${trendDisplay.color}-500/20`}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{trendDisplay.icon}</span>
                        <div>
                            <p className="text-xs text-slate-500">Trend</p>
                            <p className={`text-sm font-bold text-${trendDisplay.color}-400`}>{trendDisplay.label}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-${trendDisplay.color}-500`}
                                style={{ width: `${forecast.trendStrength}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-400">{forecast.trendStrength}%</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                        <div>
                            <p className="text-xs text-slate-500">Confidence</p>
                            <p className="text-sm font-bold text-white">{forecast.confidence}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${forecast.confidence}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-400">R²: {forecast.rSquared.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-3">{t('price_projection')}</p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%" aspect={2}>
                        <ComposedChart data={forecastData}>
                            <defs>
                                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} width={50} />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Confidence interval */}
                            <Area
                                type="monotone"
                                dataKey="upperBound"
                                stroke="none"
                                fill="url(#confidenceGradient)"
                                fillOpacity={0.3}
                            />
                            <Area
                                type="monotone"
                                dataKey="lowerBound"
                                stroke="none"
                                fill="url(#confidenceGradient)"
                                fillOpacity={0.3}
                            />

                            {/* Actual prices */}
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name="Actual"
                            />

                            {/* Predicted prices */}
                            <Line
                                type="monotone"
                                dataKey="predicted"
                                stroke="#a78bfa"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 3, fill: '#a78bfa' }}
                                name="Forecast"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-900/30 rounded p-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p>
                    {t('predictions_disclaimer')}
                </p>
            </div>
        </div>
    );
};
