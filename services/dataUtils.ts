import { MarketItem, ChartDataPoint, ItemHistoryPoint, PriceDistributionPoint, CandlestickDataPoint, HeatmapDataPoint } from '../types';
import { FileParser } from './fileParser';
import { sanitizeItemName, sanitizeSeller } from './securityUtils';
import { resolveItemIdentity } from './ItemIdentity';

export interface LiveTrade {
    timestamp: string;
    nick: string;
    message: string;
    type?: 'WTB' | 'WTS' | 'WTT';
}

/**
 * Get list of unique items for the dropdown.
 * ARCHITECTURAL CHANGE: Returns { id, name } objects, unique by ID.
 * This ensures "Sleep Powder" (id: sleep_powder) appears only once.
 */
export const getDistinctItems = (items: MarketItem[]): string[] => {
    // Backward compatibility wrapper
    const uniqueIds = new Set<string>();
    const names: string[] = [];

    items.forEach(i => {
        if (i.itemId && !uniqueIds.has(i.itemId)) {
            uniqueIds.add(i.itemId);
            names.push(i.name); 
        } else if (!i.itemId && i.name) {
            names.push(i.name);
        }
    });
    return names.sort();
};

export const getDistinctMarketItems = (items: MarketItem[]): { id: string, name: string }[] => {
    const map = new Map<string, string>();

    items.forEach(i => {
        if (!i.itemId) return; 
        if (!map.has(i.itemId)) {
            map.set(i.itemId, i.name);
        }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
};


/**
 * Generates specific history for ONE item type, FILTERED BY ID.
 */
export const getItemHistory = (items: MarketItem[], targetId: string): ItemHistoryPoint[] => {
    const filtered = items.filter(i => i.itemId === targetId && i.price > 0);
    const groups: { [date: string]: { total: number, min: number, max: number, count: number } } = {};

    filtered.forEach(item => {
        let date: string;
        try {
            date = typeof item.timestamp === 'string' ? new Date(item.timestamp).toISOString().split('T')[0] : new Date(item.timestamp).toISOString().split('T')[0];
        } catch (e) {
            return;
        }

        if (!groups[date]) {
            groups[date] = { total: 0, min: item.price, max: item.price, count: 0 };
        }

        groups[date].total += item.price;
        groups[date].min = Math.min(groups[date].min, item.price);
        groups[date].max = Math.max(groups[date].max, item.price);
        groups[date].count++;
    });

    const result = Object.keys(groups).map(date => ({
        date,
        avgPrice: groups[date].total / groups[date].count,
        minPrice: groups[date].min,
        maxPrice: groups[date].max,
        volume: groups[date].count
    }));

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Generates a histogram of prices for an item to see "Fair Value" clusters
 */
export const getPriceDistribution = (items: MarketItem[], targetId: string): PriceDistributionPoint[] => {
    const filtered = items.filter(i => i.itemId === targetId && i.price > 0);
    if (filtered.length === 0) return [];

    const prices = filtered.map(i => i.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];

    const bucketCount = 10;
    const range = max - min;
    const step = range / bucketCount || 1; 

    const buckets = new Array(bucketCount).fill(0);

    prices.forEach(p => {
        const bucketIndex = Math.min(Math.floor((p - min) / step), bucketCount - 1);
        buckets[bucketIndex]++;
    });

    return buckets.map((count, i) => {
        const start = min + (i * step);
        const end = min + ((i + 1) * step);
        const label = start < 100
            ? `${start.toFixed(2)}c - ${end.toFixed(2)}c`
            : `${(start / 100).toFixed(2)}s - ${(end / 100).toFixed(2)}s`;

        return { range: label, count };
    });
};

/**
 * Legacy global chart generator (kept for dashboard mini-charts if needed)
 */
export const generateChartDataFromHistory = (items: MarketItem[]): ChartDataPoint[] => {
    const groups: { [date: string]: { totalCopper: number, count: number } } = {};
    items.forEach(item => {
        if (item.price <= 0) return;

        let dateKey: string;
        try {
            dateKey = typeof item.timestamp === 'string' ? new Date(item.timestamp).toISOString().split('T')[0] : new Date(item.timestamp).toISOString().split('T')[0];
        } catch (e) {
            return;
        }

        if (!groups[dateKey]) groups[dateKey] = { totalCopper: 0, count: 0 };
        groups[dateKey].totalCopper += item.price;
        groups[dateKey].count += 1;
    });
    const chartData: ChartDataPoint[] = Object.keys(groups).map(date => {
        const g = groups[date];
        return {
            date: date,
            avgPrice: Math.floor(g.totalCopper / g.count),
            volume: g.count
        };
    });
    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Generate candlestick (OHLC) data for an item
 */
export const getCandlestickData = (items: MarketItem[], targetId: string): CandlestickDataPoint[] => {
    const filtered = items.filter(i => i.itemId === targetId && i.price > 0);

    const dailyData = new Map<string, MarketItem[]>();
    filtered.forEach(item => {
        const ts = typeof item.timestamp === 'string' ? new Date(item.timestamp) : new Date(item.timestamp);
        const date = ts.toISOString().split('T')[0];
        if (!dailyData.has(date)) {
            dailyData.set(date, []);
        }
        dailyData.get(date)!.push(item);
    });

    const candlesticks: CandlestickDataPoint[] = [];
    dailyData.forEach((dayItems, date) => {
        const sorted = dayItems.sort((a, b) => {
            const ta = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const tb = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
            return ta - tb;
        });

        const open = sorted[0].price;
        const close = sorted[sorted.length - 1].price;
        const high = Math.max(...sorted.map(i => i.price));
        const low = Math.min(...sorted.map(i => i.price));
        const volume = sorted.length;

        candlesticks.push({ date, open, high, low, close, volume });
    });

    return candlesticks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Generate supply heatmap data (daily listing counts)
 */
export const getSupplyHeatmapData = (items: MarketItem[], targetId: string): HeatmapDataPoint[] => {
    const filtered = items.filter(i => i.itemId === targetId);

    const dailyCounts = new Map<string, { count: number; totalPrice: number }>();
    filtered.forEach(item => {
        const ts = typeof item.timestamp === 'string' ? new Date(item.timestamp) : new Date(item.timestamp);
        const date = ts.toISOString().split('T')[0];
        if (!dailyCounts.has(date)) {
            dailyCounts.set(date, { count: 0, totalPrice: 0 });
        }
        const data = dailyCounts.get(date)!;
        data.count++;
        data.totalPrice += item.price;
    });

    const heatmapData: HeatmapDataPoint[] = [];
    dailyCounts.forEach((data, date) => {
        heatmapData.push({
            date,
            count: data.count,
            avgPrice: data.totalPrice / data.count
        });
    });

    return heatmapData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Converts a Real-Time Trade (ParsedTrade) into a MarketItem for Charts.
 * ARCHITECTURAL CHANGE: Uses resolveItemIdentity for robust ID/Name.
 */
export const convertLiveTradeToMarketItem = (trade: LiveTrade): MarketItem => {
    // 1. Initial Name Extraction (Heuristic)
    let rawName = trade.message;
    if (trade.message.includes('[')) {
        const match = trade.message.match(/\[(.*?)\]/);
        if (match) rawName = match[1];
    }

    // 2. Smart Parsing: Quantity & Price
    let quantity = 1;
    const qtyMatch = trade.message.match(/(\d+)\s*x/i) || trade.message.match(/x\s*(\d+)/i);
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
    }

    let price = FileParser.normalizePrice(trade.message);
    const isTotal = /\b(all|total|bulk|lot)\b/i.test(trade.message);

    if (quantity > 1 && isTotal) {
        price = price / quantity;
    }

    // 3. Identity Layer (v2.1)
    // Resolving strict ID and display name
    const { id: itemId, displayName } = resolveItemIdentity(rawName);

    const safeName = sanitizeItemName(displayName);
    const safeSeller = sanitizeSeller(trade.nick);

    // 4. Handle Date
    const today = new Date();
    const parts = trade.timestamp.split(':');
    if (parts.length >= 2) {
        today.setHours(Number(parts[0]), Number(parts[1]), Number(parts[2] || 0));
    }

    // Determine Rarity from Message (Basic Heuristic for Live Trades)
    let rarity: 'Common' | 'Rare' | 'Supreme' | 'Fantastic' = 'Common';
    const lowerMsg = trade.message.toLowerCase();
    if (lowerMsg.includes('fantastic')) rarity = 'Fantastic';
    else if (lowerMsg.includes('supreme')) rarity = 'Supreme';
    else if (lowerMsg.includes('rare')) rarity = 'Rare';
 
    return {
        id: `live-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        itemId,      // Traceability: Canonical ID (Strict)
        name: safeName, // Display Name
        rawName,     // Traceability: Original String
        seller: safeSeller,
        price: price, // Normalized Unit Price
        quantity: quantity,
        quality: 0,
        rarity: rarity,
        material: 'Unknown',
        orderType: trade.type || 'UNKNOWN',
        location: 'Unknown',
        timestamp: today.toISOString(),
        searchableText: (safeName + ' ' + safeSeller + ' ' + rarity).toLowerCase()
    };
};
