
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
}

/**
 * useChartsEngine (v2.3)
 * 
 * Integrated with MarketStoryEngine AND MarketMemoryService.
 */
export const useChartsEngine = ({
    rawItems = [],
    liveTrades = [],
    selectedItemId
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
        narrativeTimeline
    };
};
