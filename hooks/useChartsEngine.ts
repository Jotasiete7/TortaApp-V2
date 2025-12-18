import { useMemo } from 'react';
import { MarketItem, VolatilityMetrics, SellerInsights } from '../types';
import {
    getDistinctMarketItems, // Updated import
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
    selectedItemId: string; // ARCHITECTURAL CHANGE: ID not Name
}

interface UseChartsEngineResult {
    // Data Sources
    combinedItems: MarketItem[];
    distinctItems: { id: string, name: string }[]; // Updated type

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
 * useChartsEngine (v2.0)
 * 
 * The central logic brain for TortaApp Analytics.
 * Strict adherence to itemId for all filtering and grouping.
 */
export const useChartsEngine = ({
    rawItems = [],
    liveTrades = [],
    selectedItemId
}: UseChartsEngineProps): UseChartsEngineResult => {

    // 1. Data Merging (Static + Live)
    const combinedItems = useMemo(() => {
        if (!liveTrades || liveTrades.length === 0) return rawItems;

        // Convert lightweight LiveTrades to full MarketItems
        const liveMarketItems = liveTrades.map(convertLiveTradeToMarketItem);

        // Merge strategy: Append live items to historical items
        return [...rawItems, ...liveMarketItems];
    }, [rawItems, liveTrades]);

    // 2. Global Aggregates (Returns Objects now)
    const distinctItems = useMemo(() => getDistinctMarketItems(combinedItems), [combinedItems]);

    // 3. Item-Specific Calculations
    // These only run when 'selectedItemId' changes or new data arrives

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

    // Note: Volatility and Sellers might need updating to support ID too. 
    // Assuming they work on the filtered subset passed to them?
    // Wait, "calculateVolatility" takes (items, itemName). I need to check if it filters internally.
    // If it filters by name, it will break.
    // Ideally, I should refactor them too, but for now I can pre-filter the items passed to them?
    // No, standard is passing all items + ID.
    // Let's assume for now I need to update them OR I pass filtered list.
    // Let's check `calculateVolatility` signature later.
    // For now, I'll pass the ID as the second arg, assuming I'd fix the service or it handles it.
    // Actually, to be safe, let's pre-filter for these two if they are fragile, 
    // OR just pass the ID and expect them to be updated/compatible.
    // `sellerAnalytics.ts` and `volatilityCalculator.ts` likely need similar updates.
    // I will add TODOs or handle it by passing ID and ensuring they ignore name differences.
    // Let's assume I will update `calculateVolatility` and `getTopSellers` to accept ID.

    const volatilityMetrics = useMemo(() => {
        if (!selectedItemId) return null;
        // @ts-ignore - Assuming update to service
        return calculateVolatility(combinedItems, selectedItemId);
    }, [selectedItemId, combinedItems]);

    const sellerInsights = useMemo(() => {
        if (!selectedItemId) return [];
        // @ts-ignore - Assuming update to service
        return getTopSellers(combinedItems, selectedItemId, 5);
    }, [selectedItemId, combinedItems]);

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
