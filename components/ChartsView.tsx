
import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import { ChartDataPoint, MarketItem } from '../types';
import { formatWurmPrice } from '../services/priceUtils';
import { BarChart2, TrendingUp, LineChart, CandlestickChart as CandlestickIcon, Calendar, Globe, HelpCircle } from 'lucide-react';
import { VolatilityBadge } from './market/VolatilityBadge';
import { SmartSearch } from './market/SmartSearch';
import { CandlestickChart } from './market/CandlestickChart';
import { SupplyHeatmap } from './market/SupplyHeatmap';
import { SellerInsights } from './market/SellerInsights';
import { MarketHealthDashboard } from './market/MarketHealthDashboard';
import { PriceForecastPanel } from './market/PriceForecastPanel';
import { useChartsTranslation } from '../services/chartsTranslations';
import { ChartsGuide } from './market/ChartsGuide';
import { useTradeEvents } from '../contexts/TradeEventContext';
import { useChartsEngine } from '../hooks/useChartsEngine';

interface ChartsViewProps {
    data: ChartDataPoint[];
    rawItems?: MarketItem[];
}

type ChartType = 'line' | 'candlestick' | 'heatmap';

export const ChartsView: React.FC<ChartsViewProps> = ({ rawItems = [] }) => {
    // UI State
    const [selectedItem, setSelectedItem] = useState<{ id: string, name: string } | null>(null);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [showGuide, setShowGuide] = useState(false);

    // I18n
    const { t, language, toggleLanguage } = useChartsTranslation();

    // Live Feed Context
    const { trades: liveTrades } = useTradeEvents();

    // --- CHARTS ENGINE ---
    const {
        combinedItems,
        distinctItems,
        historyData,
        distributionData,
        candlestickData,
        heatmapData,
        volatilityMetrics,
        sellerInsights,
        liveTradeCount,
        suggestedItem,
        marketStory // New Interface
    } = useChartsEngine({
        rawItems,
        liveTrades,
        selectedItemId: selectedItem?.id || ''
    });

    // Smart Default Selection
    useEffect(() => {
        if (!selectedItem && suggestedItem) {
            setSelectedItem(suggestedItem);
        }
    }, [suggestedItem, selectedItem]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                    <p className="text-slate-400 font-mono mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-300">{entry.name}:</span>
                            <span className="font-mono text-white">
                                {entry.name.includes('Price') ? formatWurmPrice(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (combinedItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                <BarChart2 className="w-16 h-16 opacity-20 mb-4" />
                <p>No market data loaded. Please upload a log file first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-amber-500 w-6 h-6" />
                        {t('market_trends')}
                        {liveTradeCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded border border-emerald-500/30 animate-pulse">
                                LIVE ({liveTradeCount})
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-400 text-sm">{t('analyze_text')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 mr-2">
                        <button onClick={toggleLanguage} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-bold ml-1">{language === 'en' ? 'EN' : 'PT'}</span>
                        </button>
                        <button onClick={() => setShowGuide(true)} className="p-2 bg-slate-800 text-slate-400 hover:text-amber-500 rounded-lg border border-slate-700">
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="w-full sm:w-80">
                        <SmartSearch items={distinctItems} rawData={combinedItems} selectedItemId={selectedItem?.id || ''} onSelect={setSelectedItem} />
                    </div>
                    {/* Chart Type Toggle */}
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-600">
                        <button onClick={() => setChartType('line')} className={`p-2 rounded ${chartType === 'line' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><LineChart className="w-4 h-4" /></button>
                        <button onClick={() => setChartType('candlestick')} className={`p-2 rounded ${chartType === 'candlestick' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><BarChart2 className="w-4 h-4" /></button>
                        <button onClick={() => setChartType('heatmap')} className={`p-2 rounded ${chartType === 'heatmap' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><Calendar className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <MarketHealthDashboard rawData={combinedItems} itemName={selectedItem?.name} />

            <ChartsGuide isOpen={showGuide} onClose={() => setShowGuide(false)} lang={language} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    {/* Dynamic Header */}
                    <div className="mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-white capitalize">
                                        {selectedItem?.name || 'Select Item'} History
                                    </h3>
                                    {volatilityMetrics && <VolatilityBadge metrics={volatilityMetrics} itemName={selectedItem?.name || ''} />}

                                    {/* Market Phase Badge (New) */}
                                    {marketStory && (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-${marketStory.phase.color}-500/10 border-${marketStory.phase.color}-500/50 text-${marketStory.phase.color}-400`}>
                                            <span className="font-bold text-xs uppercase tracking-wider">{marketStory.phase.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Market Story / Insights */}
                                {marketStory ? (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <span>{marketStory.mood.emoji}</span>
                                            <span className="font-medium text-white">{marketStory.mood.label} Mood:</span>
                                            <span className="opacity-80">{marketStory.mood.description}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {marketStory.insights.map((insight, idx) => (
                                                <span key={idx} className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    {insight}
                                                </span>
                                            ))}
                                            {marketStory.phase.explanation.map((exp, idx) => (
                                                <span key={`exp-${idx}`} className="text-xs text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded border border-slate-600">
                                                    {exp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Loading analysis...</p>
                                )}
                            </div>

                            {historyData.length > 0 && chartType === 'line' && (
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Latest Avg</p>
                                    <p className="text-xl font-mono text-emerald-400">
                                        {formatWurmPrice(historyData[historyData.length - 1].avgPrice)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {chartType === 'line' && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} minTickGap={30} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />

                                    <Area type="monotone" dataKey="avgPrice" name="Avg Price" stroke="#f59e0b" fill="url(#colorAvg)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="minPrice" name="Min Price" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                                    <Bar dataKey="volume" name="Daily Volume" barSize={20} fill="#3b82f6" opacity={0.3} yAxisId={0} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                        {chartType === 'candlestick' && <CandlestickChart data={candlestickData} itemName={selectedItem?.name || ''} />}
                        {chartType === 'heatmap' && <SupplyHeatmap data={heatmapData} itemName={selectedItem?.name || ''} />}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white">Price Cluster</h3>
                            <p className="text-sm text-slate-400">Where are most sales happening?</p>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributionData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                    <YAxis dataKey="range" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={70} />
                                    <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Trades" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <SellerInsights sellers={sellerInsights} itemName={selectedItem?.name || ''} />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <PriceForecastPanel items={combinedItems} itemName={selectedItem?.name || ''} />
                    </div>
                </div>
            </div>
        </div>
    );
};
