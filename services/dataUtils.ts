
import {
    MarketItem,
    ItemHistoryPoint,
    PriceDistributionPoint,
    LiveTrade,
    CandlestickDataPoint,
    HeatmapDataPoint
} from '../types';

/**
 * Parses raw logs (simulated or real).
 * Currently just formats the data to ensure clean numbers.
 */
export const cleanRawData = (items: MarketItem[]): MarketItem[] => {
    return items
        .filter(i => i.price > 0 && i.quantity > 0)
        .map(i => ({
            ...i,
            price: Number(i.price), // Ensure number
            quantity: Number(i.quantity)
        }));
};

/**
 * Get distinct items for the dropdown.
 */
export const getDistinctMarketItems = (items: MarketItem[]) => {
    const unique = new Map();
    items.forEach(item => {
        // Filter Junk / Log Headers
        if (!item.name || item.name.length < 3) return;
        if (item.name.startsWith('(') || item.name.startsWith('#')) return;
        if (item.name.includes('Thank You') || item.name.includes('http')) return;
        if (item.name.toLowerCase().includes('started')) return;

        // Filter Multi-Item Ads / Massive Lines (Fix for "By Wagoner..." spam)
        if (item.name.length > 55) return;
        if (item.name.includes('||')) return;
        if (item.name.split(',').length > 3) return; // More than 3 commas usually = list

        if (!unique.has(item.name)) {
            unique.set(item.name, { id: item.itemId, name: item.name });
        }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get aggregated history for the chart.
 */
export const getItemHistory = (items: MarketItem[], itemId: string): ItemHistoryPoint[] => {
    const specificItems = items.filter(i => i.itemId === itemId);

    // Group by Date (YYYY-MM-DD)
    const grouped = new Map<string, MarketItem[]>();

    specificItems.forEach(item => {
        // Handle timestamp (ISO string or Epoch)
        let dateKey = '';
        if (typeof item.timestamp === 'string' && item.timestamp.includes('T')) {
            dateKey = item.timestamp.split('T')[0];
        } else {
            // Fallback for epoch or loose string
            const d = new Date(item.timestamp);
            if (!isNaN(d.getTime())) {
                dateKey = d.toISOString().split('T')[0];
            } else {
                dateKey = 'Unknown';
            }
        }

        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)?.push(item);
    });

    // Calculate averages per day
    const history: ItemHistoryPoint[] = [];

    // Sort keys to ensure chronological order
    const sortedKeys = Array.from(grouped.keys()).sort();

    sortedKeys.forEach(date => {
        if (date === 'Unknown') return;

        const dayItems = grouped.get(date) || [];
        const totalVolume = dayItems.reduce((acc, i) => acc + i.quantity, 0);
        const totalPrice = dayItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        const prices = dayItems.map(i => i.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        history.push({
            date,
            avgPrice: Math.round(totalPrice / totalVolume),
            minPrice,
            maxPrice,
            volume: totalVolume
        });
    });

    return history;
};

/**
 * Get price distribution (Histogram)
 */
export const getPriceDistribution = (items: MarketItem[], itemId: string): PriceDistributionPoint[] => {
    const specificItems = items.filter(i => i.itemId === itemId);
    const prices = specificItems.map(i => i.price);

    if (prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const bucketCount = 5;
    const bucketSize = range / bucketCount || 100; // default 1 copper if no range

    const buckets = new Array(bucketCount).fill(0);
    const bucketLabels = new Array(bucketCount).fill('');

    // Initialize labels
    for (let i = 0; i < bucketCount; i++) {
        const start = Math.floor(min + (i * bucketSize));
        const end = Math.floor(min + ((i + 1) * bucketSize));
        bucketLabels[i] = `${start}-${end}`;
    }

    prices.forEach(p => {
        let bucketIndex = Math.floor((p - min) / bucketSize);
        if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1; // Catch max value
        buckets[bucketIndex]++;
    });

    return buckets.map((count, i) => ({
        range: bucketLabels[i],
        count
    }));
};

/**
 * Generate OHLC Data for Candlestick Chart
 */
export const getCandlestickData = (items: MarketItem[], itemId: string): CandlestickDataPoint[] => {
    const history = getItemHistory(items, itemId);

    return history.map(h => ({
        date: h.date,
        open: h.avgPrice, // Simplified: using avg as open
        close: h.avgPrice, // Simplified: using avg as close
        high: h.maxPrice,
        low: h.minPrice,
        volume: h.volume
    }));
};

/**
 * Generate Heatmap Data
 */
export const getSupplyHeatmapData = (items: MarketItem[], itemId: string): HeatmapDataPoint[] => {
    const history = getItemHistory(items, itemId);
    return history.map(h => ({
        date: h.date,
        count: h.volume, // Using volume as "count/intensity"
        avgPrice: h.avgPrice
    }));
};

/**
 * Helper to normalize LiveTrade to MarketItem
 */
export const convertLiveTradeToMarketItem = (trade: LiveTrade): MarketItem => {
    return {
        id: `live-${trade.hash}`, // Virtual ID
        itemId: (trade.itemName || 'unknown').toLowerCase().replace(/ /g, '_'), // Normalize ID
        name: trade.itemName || 'Unknown Item',
        material: 'unknown',
        quality: 10, // Default for live items if not parsed
        rarity: 'Common',
        price: trade.price,
        quantity: 1, // Usually live trades are single emits or we don't know qty
        orderType: trade.type,
        seller: trade.nick,
        location: 'Live',
        timestamp: trade.timestamp
    };
};
