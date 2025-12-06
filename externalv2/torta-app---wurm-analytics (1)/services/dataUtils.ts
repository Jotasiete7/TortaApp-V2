
import { MarketItem, ChartDataPoint } from '../types';

export interface ItemHistoryPoint {
    date: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    volume: number;
}

export interface PriceDistributionPoint {
    range: string;
    count: number;
}

/**
 * Get list of unique items for the dropdown
 */
export const getDistinctItems = (items: MarketItem[]): string[] => {
    const names = new Set<string>();
    items.forEach(i => {
        if (i.name && i.name !== 'Unknown' && i.price > 0) {
            names.add(i.name);
        }
    });
    return Array.from(names).sort();
};

/**
 * Generates specific history for ONE item type
 */
export const getItemHistory = (items: MarketItem[], itemName: string): ItemHistoryPoint[] => {
    const filtered = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase() && i.price > 0);
    const groups: { [date: string]: { total: number, min: number, max: number, count: number } } = {};

    filtered.forEach(item => {
        const date = item.timestamp.split('T')[0];
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
export const getPriceDistribution = (items: MarketItem[], itemName: string): PriceDistributionPoint[] => {
    const filtered = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase() && i.price > 0);
    if (filtered.length === 0) return [];

    const prices = filtered.map(i => i.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    
    // Create 10 buckets
    const bucketCount = 10;
    const range = max - min;
    const step = range / bucketCount || 1; // Avoid divide by zero if all prices same

    const buckets = new Array(bucketCount).fill(0);
    
    prices.forEach(p => {
        const bucketIndex = Math.min(Math.floor((p - min) / step), bucketCount - 1);
        buckets[bucketIndex]++;
    });

    return buckets.map((count, i) => {
        const start = min + (i * step);
        const end = min + ((i + 1) * step);
        // Format label nicely based on value magnitude
        const label = start < 100 
            ? `${start.toFixed(2)}c - ${end.toFixed(2)}c`
            : `${(start/100).toFixed(2)}s - ${(end/100).toFixed(2)}s`;
            
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
        const dateKey = item.timestamp.split('T')[0]; 
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
