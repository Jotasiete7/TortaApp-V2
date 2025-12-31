import React, { useState, useMemo } from 'react';
import { BrainCircuit, Loader2, TrendingUp, Filter, Layers, Search, HelpCircle, AlertTriangle } from 'lucide-react';
import { PredictionResult, MarketItem, BulkAnalysis } from '../../types';
import { analyzePriceSet, MarketStats } from '../../services/mlEngine';
import { formatWurmPrice } from '../../services/priceUtils';
import { extractNameAndQty } from '../../services/fileParser';
import { PriceHistogram } from './PriceHistogram';
import { ProfitCalculator } from './ProfitCalculator';
import { InfoTooltip } from './InfoTooltip';

interface MLPredictorProps {
    data: MarketItem[];
}

// --- BULK ANALYSIS LOGIC ---
const analyzeBulks = (items: MarketItem[]): BulkAnalysis => {
    const bulkSizes = Array.from(new Set(items
        .filter(item => item.quantity > 1)
        .map(item => item.quantity)
    )).sort((a, b) => a - b);

    const hasBulks = bulkSizes.length > 0;

    const bulkMultipliers = bulkSizes.map(size => {
        const bulkItems = items.filter(item => item.quantity === size);
        const singleItems = items.filter(item => item.quantity === 1);

        if (singleItems.length === 0) return 1;

        const avgBulkUnitPrice = bulkItems.reduce((sum, item) => sum + item.price, 0) / bulkItems.length;
        const avgSingleUnitPrice = singleItems.reduce((sum, item) => sum + item.price, 0) / singleItems.length;

        return avgSingleUnitPrice > 0 ? avgBulkUnitPrice / avgSingleUnitPrice : 1;
    });

    let recommendedBulkIdx = 0;
    if (hasBulks) {
        recommendedBulkIdx = bulkMultipliers.reduce((bestIdx, currentMult, currentIdx) => {
            return currentMult < bulkMultipliers[bestIdx] ? currentIdx : bestIdx;
        }, 0);
    }

    return {
        hasBulks,
        bulkSizes,
        bulkMultipliers,
        recommendedBulk: hasBulks ? bulkSizes[recommendedBulkIdx] : 1
    };
};

const BulkSelector: React.FC<{
    analysis: BulkAnalysis;
    selected: number;
    onSelect: (bulk: number) => void;
}> = ({ analysis, selected, onSelect }) => {
    const { t } = useTranslation('common');
    return (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {t('ml_predictor.bulk_quantity')}
                    <InfoTooltip text={t('ml_predictor.bulk_tooltip')} />
                </label>
                <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                    {analysis.hasBulks ? t('ml_predictor.sizes_found', { count: analysis.bulkSizes.length }) : t('ml_predictor.no_bulk')}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onSelect(1)}
                    className={`px-3 py-2 rounded-lg border transition-all ${selected === 1
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                >
                    Single (1x)
                </button>

                {analysis.bulkSizes.map((size, index) => {
                    const multiplier = analysis.bulkMultipliers[index];
                    const isBestValue = analysis.recommendedBulk === size;

                    return (
                        <button
                            key={size}
                            onClick={() => onSelect(size)}
                            className={`px-3 py-2 rounded-lg border transition-all relative group ${selected === size
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : isBestValue
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:border-amber-500'
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                        >
                            {size}x
                            {isBestValue && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" title="Best Value"></div>
                            )}
                            <div className="text-xs opacity-70 flex gap-1 justify-center mt-1">
                                {multiplier < 0.95 ? '💰' : multiplier > 1.05 ? '⚠️' : '✓'}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const MLPredictor: React.FC<MLPredictorProps> = ({ data }) => {
    const { t } = useTranslation('common');
    const [quality, setQuality] = useState(50);
    const [material, setMaterial] = useState('Any');
    const [itemName, setItemName] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
    const [relevantTrades, setRelevantTrades] = useState<MarketItem[]>([]);
    const [zeroPriceCount, setZeroPriceCount] = useState(0);

    const [bulkAnalysis, setBulkAnalysis] = useState<BulkAnalysis | null>(null);
    const [selectedBulk, setSelectedBulk] = useState<number>(1);
    const [showBulks, setShowBulks] = useState(false);

    const availableMaterials = useMemo(() => {
        if (data.length === 0) return ['Iron', 'Wood', 'Cotton'];
        const mats = new Set<string>();
        data.forEach(d => {
            if (d.material && d.material !== 'Unknown') {
                const m = d.material.charAt(0).toUpperCase() + d.material.slice(1);
                mats.add(m);
            }
        });
        return Array.from(mats).sort();
    }, [data]);

    const availableItemNames = useMemo(() => {
        if (data.length === 0) return [];
        const names = new Set<string>();
        data.slice(0, 5000).forEach(d => {
            if (d.name && d.name !== 'Unknown') names.add(d.name);
        });
        return Array.from(names).sort();
    }, [data]);

    const handlePredict = async () => {
        setLoading(true);
        setMarketStats(null);
        setResult(null);
        setRelevantTrades([]);
        setBulkAnalysis(null);
        setSelectedBulk(1);
        setShowBulks(false);
        setZeroPriceCount(0);

        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const searchExtraction = extractNameAndQty(itemName);
            const cleanSearchTerm = searchExtraction.cleanName.toLowerCase();

            // 1. Filtragem Inteligente
            const filteredItems = data.filter(item => {
                const matchMat = material === 'Any' || (item.material && item.material.toLowerCase() === material.toLowerCase());
                const matchName = cleanSearchTerm === '' || item.name.toLowerCase().includes(cleanSearchTerm);
                return matchMat && matchName;
            });

            // Separate into Valid (Price > 0) and Invalid (Price == 0)
            const pricedItems = filteredItems.filter(item => item.price > 0);
            const unpricedItems = filteredItems.filter(item => item.price === 0);

            setRelevantTrades(pricedItems.slice(0, 20));
            setZeroPriceCount(unpricedItems.length);

            if (pricedItems.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Análise de Bulks
            const analysis = analyzeBulks(pricedItems);
            setBulkAnalysis(analysis);
            setShowBulks(analysis.hasBulks);

            // 3. Análise Estatística Avançada
            const unitPrices = pricedItems.map(i => i.price);
            // V2.1 UPDATE: Pass full items and name for Normalization context
            const stats = analyzePriceSet(unitPrices, pricedItems, itemName);
            setMarketStats(stats);

            // Re-denormalize for display? 
            // The engine returns "Base QL50 Iron" price. 
            // We should probably project it back to the User's requested QL/Material?
            // "Preço_Projetado = Preço_Base_50QL * (QL_Alvo / 50) ^ Expoente * MultiplicadorMaterial"

            // NOTE: The engine returns a fairPrice that is NORMALIZED.
            // We must adjust it to the user's selected parameters (Quality/Material)

            // Use same maps (imported ideally, but hardcoding for patch robustness or we need to import maps here too)
            // Ideally MLEngine should helper function for projection.
            // Let's assume the user wants the price for THEIR specific filters.

            // Projection Logic (Inline for now to avoid massive refactor):
            const basePrice = stats.fairPrice;
            const targetQL = quality;
            const targetMat = material === 'Any' ? 'iron' : material.toLowerCase();

            // ✅ BUGFIX: Normalize material name (remove spaces) before lookup
            const normalizedMat = targetMat.replace(/\s+/g, '');

            // Re-import maps logic (Simplified replicate)
            const matMult = (normalizedMat === 'glimmersteel') ? 5.0 :
                (normalizedMat === 'seryll') ? 6.0 :
                    (normalizedMat === 'adamantine') ? 7.0 :
                        (normalizedMat === 'moonmetal') ? 8.5 :
                            (normalizedMat === 'gold') ? 3.0 :
                                (normalizedMat === 'silver') ? 2.5 :
                                    (normalizedMat === 'steel') ? 1.5 :
                                        (normalizedMat === 'copper') ? 1.2 : 1.0;

            const qlExp = 1.8; // Default

            const projectedPrice = basePrice * Math.pow(Math.max(0.1, targetQL) / 50, qlExp) * matMult;

            let confidence = 0.95;
            if (stats.volatility > stats.mean * 0.5) confidence -= 0.2;
            if (stats.sampleSize < 10) confidence -= 0.3;
            if (stats.outliersRemoved > stats.sampleSize * 0.2) confidence -= 0.1;

            setResult({
                predictedPrice: projectedPrice, // Display the Projected Price, NOT the normalized base
                confidence: Math.max(0.1, confidence),
                zScore: 0,
                trend: 'stable'
            });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const displayPrice = useMemo(() => {
        if (!result) return 0;
        let price = result.predictedPrice;
        if (selectedBulk > 1) {
            price = price * selectedBulk;
        }
        return price;
    }, [result, selectedBulk]);


    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="text-center space-y-2">
                <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-2">
                    <BrainCircuit className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">{t('ml_predictor.title')} <span className="text-purple-500 text-sm align-top">{t('ml_predictor.pro')}</span></h2>
                <div className="text-slate-400 flex items-center justify-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: t('ml_predictor.subtitle', { count: data.length }) }}></span>
                    <InfoTooltip text={t('ml_predictor.fair_value_tooltip')} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: INPUTS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6 sticky top-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-purple-400" />
                            <h3 className="text-xl font-semibold text-white">{t('ml_predictor.context_title')}</h3>
                            <InfoTooltip text={t('ml_predictor.context_tooltip')} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t('ml_predictor.item_label')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    list="item-suggestions"
                                    placeholder="e.g., Stone Brick"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none placeholder:text-slate-600"
                                />
                                <datalist id="item-suggestions">
                                    {availableItemNames.slice(0, 50).map((name, i) => (
                                        <option key={i} value={name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t('ml_predictor.material_label')}</label>
                            <select
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none custom-select"
                            >
                                <option value="Any">{t('ml_predictor.any_material')}</option>
                                <option value="Iron">Iron</option>
                                <option value="Steel">Steel</option>
                                <option value="Glimmersteel">Glimmersteel</option>
                                <option value="Seryll">Seryll</option>
                                {availableMaterials.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {showBulks && bulkAnalysis && (
                            <BulkSelector
                                analysis={bulkAnalysis}
                                selected={selectedBulk}
                                onSelect={setSelectedBulk}
                            />
                        )}

                        <div className="space-y-4 pt-2 border-t border-slate-700/50">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-slate-300">{t('ml_predictor.quality_label')}</label>
                                <span className="text-sm font-bold text-purple-400">{quality}ql</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={loading || data.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t('ml_predictor.calculate_btn')}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: RESULTS */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative h-full bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">

                            {!result && !loading && (
                                <div className="text-slate-500 space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                        <TrendingUp className="w-10 h-10 opacity-20" />
                                    </div>
                                    <h4 className="text-xl font-medium text-slate-300">{t('ml_predictor.ready_title')}</h4>
                                    <p className="text-sm max-w-xs mx-auto">
                                        {t('ml_predictor.ready_desc')}
                                    </p>

                                    {/* ZERO PRICE FEEDBACK */}
                                    {/* ZERO PRICE FEEDBACK (High Demand / Unpriced) */}
                                    {zeroPriceCount > 0 && relevantTrades.length === 0 && (
                                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm max-w-sm mx-auto animate-in slide-in-from-bottom-2 fade-in">
                                            <div className="flex items-center justify-center gap-2 font-bold mb-1 text-white">
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                                {t('ml_predictor.market_activity_title')}
                                            </div>
                                            <p className="opacity-90 mb-2">
                                                {t('ml_predictor.market_activity_desc', { count: zeroPriceCount })}
                                            </p>
                                            <p className="text-xs bg-slate-900/50 p-2 rounded text-slate-400">
                                                💡 <b>{t('ml_predictor.market_activity_insight')}</b>
                                            </p>
                                        </div>
                                    )}

                                    {marketStats === null && itemName && zeroPriceCount === 0 && (
                                        <div className="flex flex-col items-center gap-2 text-rose-400 text-sm mt-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 animate-in slide-in-from-bottom-2">
                                            <Search className="w-5 h-5" />
                                            <span>{t('ml_predictor.no_trades', { item: itemName, material: material })}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {loading && (
                                <div className="text-slate-500 space-y-4">
                                    <Loader2 className="w-16 h-16 mx-auto animate-spin text-purple-500" />
                                    <p className="animate-pulse text-lg">{t('ml_predictor.crunching')}</p>
                                    <p className="text-xs text-slate-600">{t('ml_predictor.analyzing_desc', { count: data.length.toLocaleString() })}</p>
                                </div>
                            )}

                            {result && marketStats && (
                                <div className="w-full animate-fade-in">
                                    <div className="space-y-2 mb-8">
                                        <div className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                            {selectedBulk > 1 ? t('ml_predictor.fair_value_bulk', { bulk: selectedBulk }) : t('ml_predictor.fair_value_unit')}
                                            <InfoTooltip text={t('ml_predictor.fair_value_tooltip')} />
                                        </div>
                                        <div className="text-6xl font-bold text-white tracking-tight flex items-baseline justify-center gap-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                            <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(displayPrice).replace(/([0-9]+)([gsc])/g, '<span class="text-white">$1</span><span class="text-slate-500 text-3xl ml-0.5 mr-3">$2</span>').replace(/(\d+)i/, '<span class="text-slate-300 text-4xl">$1i</span>') }} />
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                                {t('ml_predictor.based_on', { count: marketStats.sampleSize })}
                                            </span>
                                            {marketStats.outliersRemoved > 0 && (
                                                <span className="bg-rose-900/30 text-rose-400 px-2 py-0.5 rounded border border-rose-900/50">
                                                    {t('ml_predictor.outliers_removed', { count: marketStats.outliersRemoved })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* STATS GRID */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                                {t('ml_predictor.confidence')} <InfoTooltip text={t('ml_predictor.confidence_tooltip')} />
                                            </div>
                                            <div className={`text-xl font-bold ${result.confidence > 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {(result.confidence * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                                {t('ml_predictor.volatility')} <InfoTooltip text={t('ml_predictor.volatility_tooltip')} />
                                            </div>
                                            <div className="text-xl font-bold text-slate-300">
                                                {formatWurmPrice(marketStats.volatility)}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                                {t('ml_predictor.buy_zone')} <InfoTooltip text={t('ml_predictor.buy_zone_tooltip')} />
                                            </div>
                                            <div className="text-xl font-bold text-emerald-400">
                                                {formatWurmPrice(marketStats.p25)}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                                {t('ml_predictor.sell_zone')} <InfoTooltip text={t('ml_predictor.sell_zone_tooltip')} />
                                            </div>
                                            <div className="text-xl font-bold text-rose-400">
                                                {formatWurmPrice(marketStats.p75)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-950/50 rounded-xl p-4 border border-slate-800 mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                <Layers className="w-4 h-4" /> {t('ml_predictor.price_distribution')}
                                            </h5>
                                        </div>
                                        <PriceHistogram
                                            prices={relevantTrades.map(t => t.price)}
                                            fairPrice={marketStats.fairPrice}
                                            p25={marketStats.p25}
                                            p75={marketStats.p75}
                                        />
                                    </div>

                                    <ProfitCalculator fairPrice={displayPrice} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RELEVANT TRADES TABLE */}
                    {relevantTrades.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                    {t('ml_predictor.source_data')}
                                    <InfoTooltip text={t('ml_predictor.source_data_tooltip')} />
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900 text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3">{t('ml_predictor.table_item')}</th>
                                            <th className="p-3 text-center">{t('ml_predictor.table_qty')}</th>
                                            <th className="p-3">{t('ml_predictor.table_unit_price')}</th>
                                            <th className="p-3">{t('ml_predictor.table_bulk')}</th>
                                            <th className="p-3">{t('ml_predictor.table_seller')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {relevantTrades.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-700/30">
                                                <td className="p-3 text-white">{t.name}</td>
                                                <td className="p-3 text-center">
                                                    {t.quantity > 1 ? (
                                                        <span className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono">
                                                            {t.quantity}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(t.price) }} />
                                                </td>
                                                <td className="p-3 font-mono text-emerald-400">
                                                    {formatWurmPrice(t.price * 1000)}
                                                </td>
                                                <td className="p-3 text-slate-400">{t.seller}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
