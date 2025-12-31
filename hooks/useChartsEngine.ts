
import { useMemo, useEffect, useState } from 'react';
import { MarketItem, VolatilityMetrics, SellerInsights, ItemHistoryPoint, PriceDistributionPoint, CandlestickDataPoint, HeatmapDataPoint, MarketSnapshot } from '../types';
import {
    getDistinctMarketItems,
    getItemHistory,
    getPriceDistribution,
    getCandlestickData,
    getSupplyHeatmapData,
    convertLiveTradeToMarketItem,
    LiveTrade
} from '../services/dataUtils';
import { calculateVolatility } from '../services/volatilityCalculator';
import { getTopSellers } from '../services/sellerAnalytics';
import { MarketStoryEngine, MarketPhase, MarketMood } from '../services/MarketStoryEngine';
import { MarketMemoryService } from '../services/MarketMemoryService';

interface UseChartsEngineProps {
    rawItems: MarketItem[];
    liveTrades: LiveTrade[];
    selectedItemId: string;
    referencePrices?: Record<string, number>; // New Prop for Sprint 4
}

export interface PriceBenchmarks {
    referencePrice?: number;
    advertisedPrice?: number; // Avg of WTS
    bulkPrice?: {
        min: number;
        max: number;
        avg: number;
        tier: '1k+' | '100+' | 'none';
        count: number;
    };
}

interface UseChartsEngineResult {
    // Data Sources
    combinedItems: MarketItem[];
    distinctItems: { id: string, name: string }[];

    // Item-Specific Analytics
    historyData: ItemHistoryPoint[];
    distributionData: PriceDistributionPoint[];
    candlestickData: CandlestickDataPoint[];
    heatmapData: HeatmapDataPoint[];
    volatilityMetrics: VolatilityMetrics | null;
    sellerInsights: SellerInsights[];

    // Metadata
    totalTrades: number;
    liveTradeCount: number;

    // Intelligence (v2.1)
    suggestedItem: { id: string, name: string } | null;
    marketStory: {
        phase: MarketPhase;
        mood: MarketMood;
        insights: string[];
    } | null;

    // Memory (v2.3)
    narrativeTimeline: MarketSnapshot[];

    // Price Intelligence (v2.4 - Sprint 4)
    benchmarks: PriceBenchmarks;
}

/**
 * useChartsEngine (v2.4)
 * 
 * Integrated with Price Intelligence (Benchmarks, Reference, Bulk).
 */
export const useChartsEngine = ({
    rawItems = [],
    liveTrades = [],
    selectedItemId,
    referencePrices = {}
}: UseChartsEngineProps): UseChartsEngineResult => {

    const [narrativeTimeline, setNarrativeTimeline] = useState<MarketSnapshot[]>([]);

    // 1. Data Merging (Static + Live)
    const combinedItems = useMemo(() => {
        if (!liveTrades || liveTrades.length === 0) return rawItems;
        const liveMarketItems = liveTrades.map(convertLiveTradeToMarketItem);
        return [...rawItems, ...liveMarketItems];
    }, [rawItems, liveTrades]);

    // 2. Global Aggregates
    const distinctItems = useMemo(() => getDistinctMarketItems(combinedItems), [combinedItems]);

    // 3. Item-Specific Calculations
    const historyData = useMemo(() => {
        if (!selectedItemId) return [];
        return getItemHistory(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const distributionData = useMemo(() => {
        if (!selectedItemId) return [];
        return getPriceDistribution(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const candlestickData = useMemo(() => {
        if (!selectedItemId) return [];
        return getCandlestickData(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const heatmapData = useMemo(() => {
        if (!selectedItemId) return [];
        return getSupplyHeatmapData(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const volatilityMetrics = useMemo(() => {
        if (!selectedItemId) return null;
        // @ts-ignore
        return calculateVolatility(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const sellerInsights = useMemo(() => {
        if (!selectedItemId) return [];
        // @ts-ignore
        return getTopSellers(combinedItems, selectedItemId, 5);
    }, [selectedItemId, combinedItems]);

    // 4. Intelligence Layer (Market Story) & Persistence
    const marketStory = useMemo(() => {
        if (!selectedItemId || !volatilityMetrics || historyData.length === 0) return null;

        // Calculate distinct days for reliability
        const distinctDays = new Set(historyData.map(h => h.date)).size;
        const sellerCount = sellerInsights.length;

        const story = MarketStoryEngine.analyze(historyData, volatilityMetrics, sellerCount, distinctDays);

        // PERSISTENCE: Save snapshot if we have a valid analysis
        if (story && story.phase.id !== 'DORMANT') {
            const lastPrice = historyData[historyData.length - 1].avgPrice;
            // We can find item name from distinct items locally
            const itemName = combinedItems.find(i => i.id === selectedItemId)?.name || selectedItemId; // Fallback

            MarketMemoryService.saveSnapshot(
                { id: selectedItemId, name: itemName },
                story,
                lastPrice,
                historyData[historyData.length - 1].volume
            );
        }

        return story;
    }, [selectedItemId, historyData, volatilityMetrics, sellerInsights]);

    // 5. Memory Retrieval
    useEffect(() => {
        if (selectedItemId) {
            const memory = MarketMemoryService.getTimeline(selectedItemId);
            setNarrativeTimeline(memory);
        } else {
            setNarrativeTimeline([]);
        }
    }, [selectedItemId, marketStory]); // Refresh when story updates (saves new snapshot)


    // 6. Price Intelligence (Benchmarks)
    const benchmarks = useMemo((): PriceBenchmarks => {
        if (!selectedItemId) return {};

        const relevantItems = combinedItems.filter(i => i.itemId === selectedItemId);
        if (relevantItems.length === 0) return {};

        // A. Reference Price
        // Find item name primarily
        const itemName = relevantItems[0]?.name;
        // Lookup key in referencePrices (usually lowercase keys if normalized)
        const refPrice = referencePrices[itemName?.toLowerCase()] || referencePrices[selectedItemId];

        // B. Advertised Price (WTS)
        // WTS orders usually represent "Ask" price.
        const wtsItems = relevantItems.filter(i => i.orderType === 'WTS');
        let advertisedPrice = undefined;
        if (wtsItems.length > 0) {
            const sum = wtsItems.reduce((acc, i) => acc + i.price, 0);
            advertisedPrice = Math.round(sum / wtsItems.length);
        }

        // C. Adaptive Bulk Price (Tiered Logic)
        // Tier 1: 1000+ units
        const tier1Items = relevantItems.filter(i => i.quantity >= 1000);
        let bulkPrice = undefined;

        if (tier1Items.length > 0) {
            const prices = tier1Items.map(i => i.price);
            bulkPrice = {
                min: Math.min(...prices),
                max: Math.max(...prices),
                avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
                tier: '1k+' as const,
                count: tier1Items.length
            };
        } else {
            // Tier 2: 100+ units (Fallback for heavy items like concrete)
            // Using 90 as threshold to catch almost-100s
            const tier2Items = relevantItems.filter(i => i.quantity >= 90);
            if (tier2Items.length > 0) {
                const prices = tier2Items.map(i => i.price);
                bulkPrice = {
                    min: Math.min(...prices),
                    max: Math.max(...prices),
                    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
                    tier: '100+' as const,
                    count: tier2Items.length
                };
            } else {
                bulkPrice = { min: 0, max: 0, avg: 0, tier: 'none' as const, count: 0 };
            }
        }

        return {
            referencePrice: refPrice,
            advertisedPrice,
            bulkPrice
        };

    }, [selectedItemId, combinedItems, referencePrices]);


    // A. Smart Suggestion (Market Movers)
    const suggestedItem = useMemo(() => {
        if (distinctItems.length === 0) return null;
        const iron = distinctItems.find(i => i.name.toLowerCase() === 'iron lump');
        if (iron) return iron;
        const wood = distinctItems.find(i => i.name.toLowerCase().includes('log') || i.name.toLowerCase().includes('plank'));
        if (wood) return wood;
        return distinctItems[0];
    }, [distinctItems]);

    return {
        combinedItems,
        distinctItems,
        historyData,
        distributionData,
        candlestickData,
        heatmapData,
        volatilityMetrics,
        sellerInsights,
        totalTrades: combinedItems.length,
        liveTradeCount: liveTrades.length,
        suggestedItem,
        marketStory,
        narrativeTimeline,
        benchmarks
    };
};
