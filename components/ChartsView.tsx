
import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import { ChartDataPoint, MarketItem } from '../types';
import { formatWurmPrice } from '../services/priceUtils';
import { BarChart2, TrendingUp, LineChart, CandlestickChart as CandlestickIcon, Calendar, Globe, HelpCircle, History, Package, Tag, Scale } from 'lucide-react';
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
    data: ChartDataPoint[]; // Legacy
    rawItems?: MarketItem[];
    referencePrices?: Record<string, number>; // V4 Prop
}

type ChartType = 'line' | 'candlestick' | 'heatmap';

export const ChartsView: React.FC<ChartsViewProps> = ({ rawItems = [], referencePrices = {} }) => {
    // UI State
    const [selectedItem, setSelectedItem] = useState<{ id: string, name: string } | null>(null);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [showGuide, setShowGuide] = useState(false);

    // I18n
    const { t, language, toggleLanguage } = useChartsTranslation();

    // Live Feed Context
    const { trades: liveTrades } = useTradeEvents();

    // --- CHARTS ENGINE (V4) ---
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
        marketStory,
        narrativeTimeline,
        benchmarks // V4 Metric
    } = useChartsEngine({
        rawItems,
        liveTrades,
        selectedItemId: selectedItem?.id || '',
        referencePrices
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
            {/* Header Area - CENTERING FIX APPLIED */}
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

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                    <div className="flex items-center gap-2 mr-2">
                        <button onClick={toggleLanguage} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-bold ml-1">{language === 'en' ? 'EN' : 'PT'}</span>
                        </button>
                        <button onClick={() => setShowGuide(true)} className="p-2 bg-slate-800 text-slate-400 hover:text-amber-500 rounded-lg border border-slate-700 transition-colors">
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="w-full sm:w-80">
                        <SmartSearch items={distinctItems} rawData={combinedItems} selectedItemId={selectedItem?.id || ''} onSelect={setSelectedItem} />
                    </div>
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
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Chart Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                        <div className="mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white capitalize">
                                            {selectedItem?.name || 'Select Item'} History
                                        </h3>
                                        {volatilityMetrics && <VolatilityBadge metrics={volatilityMetrics} itemName={selectedItem?.name || ''} />}
                                        {marketStory && (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-${marketStory.phase.color}-500/10 border-${marketStory.phase.color}-500/50 text-${marketStory.phase.color}-400 animate-fade-in`}>
                                                <span className="font-bold text-xs uppercase tracking-wider">{marketStory.phase.label}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Market Story */}
                                    {marketStory ? (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <span>{marketStory.mood.emoji}</span>
                                                <span className="font-medium text-white">{marketStory.mood.label} Mood:</span>
                                                <span className="opacity-80">{marketStory.mood.description}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {marketStory.insights.map((insight, idx) => (
                                                    <span key={idx} className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{insight}</span>
                                                ))}
                                                {marketStory.phase.explanation.map((exp, idx) => (
                                                    <span key={`exp-${idx}`} className="text-xs text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded border border-slate-600">{exp}</span>
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
                                        <p className="text-xl font-mono text-emerald-400">{formatWurmPrice(historyData[historyData.length - 1].avgPrice)}</p>
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

                        {narrativeTimeline.length > 1 && (
                            <div className="mt-6 border-t border-slate-700 pt-4 animate-fade-in">
                                <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
                                    <History className="w-4 h-4" />
                                    <span>Narrative Timeline (Memory)</span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                                    {narrativeTimeline.map((snap, idx) => (
                                        <div key={idx} className="flex-shrink-0 flex items-center gap-2">
                                            <div className="flex flex-col items-center bg-slate-900 border border-slate-700 p-2 rounded-lg">
                                                <span className="text-[10px] text-slate-500 mb-1">{snap.date}</span>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${snap.phase === 'GROWING' ? 'bg-blue-500/20 text-blue-400' : snap.phase === 'INFLATED' ? 'bg-amber-500/20 text-amber-400' : snap.phase === 'COLLAPSING' ? 'bg-red-500/20 text-red-400' : snap.phase === 'CHAOTIC' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400'}`}>{snap.phase}</div>
                                                <span className="text-[9px] text-slate-500 mt-1">{formatWurmPrice(snap.avgPrice)}</span>
                                            </div>
                                            {idx < narrativeTimeline.length - 1 && <div className="w-4 h-0.5 bg-slate-700"></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- PRICE INTELLIGENCE PANEL (V5 with Translations) --- */}
                    {selectedItem && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-400" />
                                {t('price_benchmarks')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 1. Tabulated / Reference Price */}
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Tag className="w-4 h-4" />
                                        <span className="text-xs uppercase font-bold tracking-wider">{t('ref_price_label')}</span>
                                    </div>
                                    {benchmarks.referencePrice ? (
                                        <div>
                                            <p className="text-2xl font-mono text-purple-400 font-bold">{formatWurmPrice(benchmarks.referencePrice)}</p>
                                            <p className="text-xs text-slate-500 mt-1">{t('ref_price_desc')}</p>
                                        </div>
                                    ) : (
                                        <div className="text-slate-600">
                                            <p className="text-sm italic">{t('not_set')}</p>
                                            <button onClick={() => alert(t('go_price_manager'))} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 underline">{t('unknown')}</button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Advertised Price (Expectation) */}
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-xs uppercase font-bold tracking-wider">{t('advertised_label')}</span>
                                    </div>
                                    {benchmarks.advertisedPrice ? (
                                        <div>
                                            <p className="text-2xl font-mono text-amber-400 font-bold">{formatWurmPrice(benchmarks.advertisedPrice)}</p>
                                            <p className="text-xs text-slate-500 mt-1">{t('advertised_desc')}</p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 text-sm italic">{t('no_active_lists')}</p>
                                    )}
                                </div>

                                {/* 3. Bulk Intelligence (Adaptive) */}
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 relative overflow-hidden">
                                    {/* Background decoration for bulk */}
                                    <div className="absolute right-0 top-0 opacity-5">
                                        <Package className="w-16 h-16 transform rotate-12" />
                                    </div>

                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Package className="w-4 h-4" />
                                        <span className="text-xs uppercase font-bold tracking-wider">{t('bulk_label')}</span>
                                    </div>
                                    {benchmarks.bulkPrice && benchmarks.bulkPrice.tier !== 'none' ? (
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-xl font-mono text-emerald-400 font-bold">
                                                    {formatWurmPrice(benchmarks.bulkPrice.min)}
                                                </p>
                                                <span className="text-slate-500 text-xs">-</span>
                                                <p className="text-xl font-mono text-emerald-400 font-bold">
                                                    {formatWurmPrice(benchmarks.bulkPrice.max)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${benchmarks.bulkPrice.tier === '1k+' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}>
                                                    {t('tier_label')}: {benchmarks.bulkPrice.tier}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    (Avg: {formatWurmPrice(benchmarks.bulkPrice.avg)})
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 text-sm italic">{t('no_bulk_found')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
