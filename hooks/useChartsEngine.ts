import { useMemo } from 'react';
import { MarketItem, ChartDataPoint, VolatilityMetrics, SellerInsights } from '../types';
import {
    getDistinctItems,
    getItemHistory,
    getPriceDistribution,
    getCandlestickData,
    getSupplyHeatmapData,
    convertLiveTradeToMarketItem,
    LiveTrade,
    ItemHistoryPoint,
    PriceDistributionPoint,
    CandlestickDataPoint,
    HeatmapDataPoint
} from '../services/dataUtils';
import { calculateVolatility } from '../services/volatilityCalculator';
import { getTopSellers } from '../services/sellerAnalytics';

interface UseChartsEngineProps {
    rawItems: MarketItem[];
    liveTrades: LiveTrade[];
    selectedItem: string;
}

interface UseChartsEngineResult {
    // Data Sources
    combinedItems: MarketItem[];
    distinctItems: string[];

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
}

/**
 * useChartsEngine (v1.0)
 * 
 * The central logic brain for TortaApp Analytics.
 * Responsible for merging Static + Live data and computing all derivative datasets.
 */
export const useChartsEngine = ({
    rawItems = [],
    liveTrades = [],
    selectedItem
}: UseChartsEngineProps): UseChartsEngineResult => {

    // 1. Data Merging (Static + Live)
    // This is the core "Hybrid Pipeline" logic
    const combinedItems = useMemo(() => {
        if (!liveTrades || liveTrades.length === 0) return rawItems;

        // Convert lightweight LiveTrades to full MarketItems
        const liveMarketItems = liveTrades.map(convertLiveTradeToMarketItem);

        // Merge strategy: Append live items to historical items
        // Note: For huge datasets, we might optimize this spread in v2 (Incremental Analytics)
        return [...rawItems, ...liveMarketItems];
    }, [rawItems, liveTrades]);

    // 2. Global Aggregates
    const distinctItems = useMemo(() => getDistinctItems(combinedItems), [combinedItems]);

    // 3. Item-Specific Calculations
    // These only run when 'selectedItem' changes or new data arrives

    const historyData = useMemo(() => {
        if (!selectedItem) return [];
        return getItemHistory(combinedItems, selectedItem);
    }, [selectedItem, combinedItems]);

    const distributionData = useMemo(() => {
        if (!selectedItem) return [];
        return getPriceDistribution(combinedItems, selectedItem);
    }, [selectedItem, combinedItems]);

    const candlestickData = useMemo(() => {
        if (!selectedItem) return [];
        return getCandlestickData(combinedItems, selectedItem);
    }, [selectedItem, combinedItems]);

    const heatmapData = useMemo(() => {
        if (!selectedItem) return [];
        return getSupplyHeatmapData(combinedItems, selectedItem);
    }, [selectedItem, combinedItems]);

    const volatilityMetrics = useMemo(() => {
        if (!selectedItem) return null;
        return calculateVolatility(combinedItems, selectedItem);
    }, [selectedItem, combinedItems]);

    const sellerInsights = useMemo(() => {
        if (!selectedItem) return [];
        return getTopSellers(combinedItems, selectedItem, 5);
    }, [selectedItem, combinedItems]);

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
        liveTradeCount: liveTrades.length
    };
};
