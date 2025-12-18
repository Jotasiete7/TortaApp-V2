import { MarketItem } from '../types';

export interface VolatilityMetrics {
    score: number; // 0-100 normalized volatility score
    priceVariance: number; // Standard deviation of prices
    supplyConsistency: number; // 0-100, how consistent daily supply is
    demandStability: number; // 0-100, how stable trade frequency is
    trend: 'rising' | 'falling' | 'stable';
}

/**
 * Calculate volatility metrics for a specific item
 * @param items All market items
 * @param itemName Target item to analyze
 * @returns Volatility metrics object
 */
export function calculateVolatility(items: MarketItem[], itemName: string): VolatilityMetrics {
    // Filter items for the target item
    const itemData = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemData.length === 0) {
        return {
            score: 0,
            priceVariance: 0,
            supplyConsistency: 0,
            demandStability: 0,
            trend: 'stable'
        };
    }

    // 1. Calculate Price Variance (Standard Deviation)
    const prices = itemData.map(i => i.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const priceVariance = stdDev;

    // Coefficient of Variation (CV) = stdDev / mean, normalized to 0-100
    const priceVolatility = avgPrice > 0 ? Math.min(100, (stdDev / avgPrice) * 100) : 0;

    // 2. Calculate Supply Consistency
    // Group by date and count listings per day
    const dailySupply = new Map<string, number>();
    itemData.forEach(item => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        dailySupply.set(date, (dailySupply.get(date) || 0) + 1);
    });

    const supplyCounts = Array.from(dailySupply.values());
    const avgSupply = supplyCounts.reduce((sum, c) => sum + c, 0) / supplyCounts.length;
    const supplyVariance = supplyCounts.reduce((sum, c) => sum + Math.pow(c - avgSupply, 2), 0) / supplyCounts.length;
    const supplyStdDev = Math.sqrt(supplyVariance);

    // Lower CV = more consistent, invert and normalize to 0-100
    const supplyCV = avgSupply > 0 ? (supplyStdDev / avgSupply) : 0;
    const supplyConsistency = Math.max(0, 100 - (supplyCV * 100));

    // 3. Calculate Demand Stability (based on trade frequency)
    // Measure gaps between trades
    const timestamps = itemData.map(i => new Date(i.timestamp).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
        gaps.push(timestamps[i] - timestamps[i - 1]);
    }

    const demandStability = gaps.length > 0
        ? Math.max(0, 100 - (Math.sqrt(gaps.reduce((sum, g) => sum + Math.pow(g - gaps.reduce((s, x) => s + x, 0) / gaps.length, 2), 0) / gaps.length) / (gaps.reduce((s, x) => s + x, 0) / gaps.length) * 50))
        : 50; // Default to moderate if not enough data

    // 4. Determine Trend
    // Compare first half vs second half average prices
    const midpoint = Math.floor(itemData.length / 2);
    const firstHalfAvg = itemData.slice(0, midpoint).reduce((sum, i) => sum + i.price, 0) / midpoint;
    const secondHalfAvg = itemData.slice(midpoint).reduce((sum, i) => sum + i.price, 0) / (itemData.length - midpoint);

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    const trendThreshold = 0.1; // 10% change
    if (secondHalfAvg > firstHalfAvg * (1 + trendThreshold)) {
        trend = 'rising';
    } else if (secondHalfAvg < firstHalfAvg * (1 - trendThreshold)) {
        trend = 'falling';
    }

    // 5. Calculate Overall Volatility Score
    // Weighted average: Price (50%), Supply (25%), Demand (25%)
    const score = Math.round(
        (priceVolatility * 0.5) +
        ((100 - supplyConsistency) * 0.25) +
        ((100 - demandStability) * 0.25)
    );

    return {
        score: Math.min(100, Math.max(0, score)),
        priceVariance,
        supplyConsistency: Math.round(supplyConsistency),
        demandStability: Math.round(demandStability),
        trend
    };
}

/**
 * Get volatility level category
 * @param score Volatility score (0-100)
 * @returns Level category
 */
export function getVolatilityLevel(score: number): 'stable' | 'moderate' | 'volatile' {
    if (score <= 30) return 'stable';
    if (score <= 60) return 'moderate';
    return 'volatile';
}

/**
 * Get color for volatility level
 * @param level Volatility level
 * @returns Tailwind color class
 */
export function getVolatilityColor(level: 'stable' | 'moderate' | 'volatile'): string {
    switch (level) {
        case 'stable': return 'emerald';
        case 'moderate': return 'yellow';
        case 'volatile': return 'red';
    }
}
