import { MarketItem } from '../types';

export interface SellerInsights {
    seller: string;
    totalListings: number;
    avgPrice: number;
    marketShare: number; // percentage 0-100
    priceStrategy: 'premium' | 'discount' | 'market';
    activityScore: number; // 0-100
}

/**
 * Get top sellers for a specific item
 * @param items All market items
 * @param itemName Target item
 * @param limit Number of top sellers to return
 * @returns Array of seller insights
 */
export function getTopSellers(items: MarketItem[], itemName: string, limit: number = 5): SellerInsights[] {
    // Filter for target item
    const itemData = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemData.length === 0) return [];

    // Group by seller
    const sellerMap = new Map<string, MarketItem[]>();
    itemData.forEach(item => {
        const seller = item.seller || 'Unknown';
        if (!sellerMap.has(seller)) {
            sellerMap.set(seller, []);
        }
        sellerMap.get(seller)!.push(item);
    });

    // Calculate market average price
    const marketAvgPrice = itemData.reduce((sum, i) => sum + i.price, 0) / itemData.length;

    // Calculate insights for each seller
    const insights: SellerInsights[] = [];
    sellerMap.forEach((sellerItems, seller) => {
        const totalListings = sellerItems.length;
        const avgPrice = sellerItems.reduce((sum, i) => sum + i.price, 0) / totalListings;
        const marketShare = (totalListings / itemData.length) * 100;
        const priceStrategy = getSellerPriceStrategy(avgPrice, marketAvgPrice);

        // Activity score based on listing frequency and recency
        const timestamps = sellerItems.map(i => new Date(i.timestamp).getTime()).sort((a, b) => b - a);
        const daysSinceLastListing = (Date.now() - timestamps[0]) / (1000 * 60 * 60 * 24);
        const listingFrequency = totalListings / Math.max(1, (timestamps[0] - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24));

        // Score: 50% recency, 50% frequency
        const recencyScore = Math.max(0, 100 - (daysSinceLastListing * 5)); // Decay 5 points per day
        const frequencyScore = Math.min(100, listingFrequency * 20); // Cap at 100
        const activityScore = Math.round((recencyScore * 0.5) + (frequencyScore * 0.5));

        insights.push({
            seller,
            totalListings,
            avgPrice,
            marketShare,
            priceStrategy,
            activityScore
        });
    });

    // Sort by total listings (market share) and return top N
    return insights
        .sort((a, b) => b.totalListings - a.totalListings)
        .slice(0, limit);
}

/**
 * Calculate market concentration (Herfindahl-Hirschman Index)
 * @param items All market items
 * @param itemName Target item
 * @returns HHI score (0-10000, higher = more concentrated)
 */
export function calculateMarketConcentration(items: MarketItem[], itemName: string): number {
    const itemData = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemData.length === 0) return 0;

    // Group by seller and calculate market shares
    const sellerCounts = new Map<string, number>();
    itemData.forEach(item => {
        const seller = item.seller || 'Unknown';
        sellerCounts.set(seller, (sellerCounts.get(seller) || 0) + 1);
    });

    // Calculate HHI: sum of squared market shares
    let hhi = 0;
    sellerCounts.forEach(count => {
        const marketShare = (count / itemData.length) * 100;
        hhi += Math.pow(marketShare, 2);
    });

    return Math.round(hhi);
}

/**
 * Determine seller's pricing strategy
 * @param sellerAvg Seller's average price
 * @param marketAvg Market average price
 * @returns Strategy category
 */
export function getSellerPriceStrategy(sellerAvg: number, marketAvg: number): 'premium' | 'discount' | 'market' {
    const threshold = 0.1; // 10% threshold

    if (sellerAvg > marketAvg * (1 + threshold)) {
        return 'premium';
    } else if (sellerAvg < marketAvg * (1 - threshold)) {
        return 'discount';
    }
    return 'market';
}

/**
 * Get seller reliability score based on consistency
 * @param items Seller's items
 * @returns Reliability score 0-100
 */
export function getSellerReliability(items: MarketItem[]): number {
    if (items.length < 3) return 50; // Not enough data

    // Measure price consistency
    const prices = items.map(i => i.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgPrice > 0 ? (stdDev / avgPrice) : 0;

    // Lower CV = more reliable, invert and normalize
    const priceConsistency = Math.max(0, 100 - (cv * 100));

    // Measure listing frequency consistency
    const timestamps = items.map(i => new Date(i.timestamp).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
        gaps.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const gapVariance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    const gapCV = avgGap > 0 ? (gapStdDev / avgGap) : 0;
    const frequencyConsistency = Math.max(0, 100 - (gapCV * 50));

    // Weighted average: 70% price, 30% frequency
    return Math.round((priceConsistency * 0.7) + (frequencyConsistency * 0.3));
}

/**
 * Get market concentration level description
 * @param hhi HHI score
 * @returns Description
 */
export function getConcentrationLevel(hhi: number): 'competitive' | 'moderate' | 'concentrated' {
    if (hhi < 1500) return 'competitive';
    if (hhi < 2500) return 'moderate';
    return 'concentrated';
}
