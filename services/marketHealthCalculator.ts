
import { MarketItem } from '../types';

export const calculateMarketHealth = (items: MarketItem[], itemName?: string) => {
    // 1. Filter Data
    const relevantItems = itemName
        ? items.filter(i => i.name === itemName)
        : items; // Global health if no item selected (TODO: limit to top 50)

    if (!relevantItems.length) return null;

    // 2. Calculate Metrics

    // A. Liquidity (volume of trades)
    // Score based on trade count. 50 trades = 100 score? 
    // Let's say 10 trades/week is "Healthy" (60).
    const tradeCount = relevantItems.length;
    let liquidityScore = Math.min((tradeCount / 20) * 100, 100);

    // B. Stability (Inverse of Volatility)
    // We need price variance.
    const prices = relevantItems.map(i => i.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // CV (Coefficient of Variation)
    const cv = mean > 0 ? (stdDev / mean) : 0;
    // If CV is 0 (stable), score is 100. If CV is 1.0 (volatile), score is 0.
    let stabilityScore = Math.max(0, 100 - (cv * 100));

    // C. Reliability (Seller Diversity + Sample Size)
    const sellers = new Set(relevantItems.map(i => i.seller)).size;
    // 5 sellers = 100 score. 1 seller = 20 score.
    const diversityScore = Math.min((sellers / 5) * 100, 100);
    // Penalty for low sample size
    const reliabilityScore = diversityScore * (Math.min(tradeCount, 10) / 10);

    // Trend (Last 3 vs First 3)
    let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    if (relevantItems.length >= 6) { // Need at least some history
        // timestamp sort
        const sorted = [...relevantItems].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
        const mid = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, mid);
        const lastHalf = sorted.slice(mid);

        const price1 = firstHalf.reduce((a, b) => a + b.price, 0) / firstHalf.length;
        const price2 = lastHalf.reduce((a, b) => a + b.price, 0) / lastHalf.length;

        if (price2 > price1 * 1.05) trend = 'improving'; // Price going up is "improving" for sellers
        else if (price2 < price1 * 0.95) trend = 'deteriorating';
    }

    const healthData = {
        liquidityScore: isNaN(liquidityScore) ? 0 : liquidityScore,
        stabilityScore: isNaN(stabilityScore) ? 0 : stabilityScore,
        reliabilityScore: isNaN(reliabilityScore) ? 0 : reliabilityScore,
        priceScore: 0, // Legacy
        trend
    };

    // Composite Index (Weighted)
    // 40% Liquidity, 40% Stability, 20% Reliability
    const msi = (healthData.liquidityScore * 0.4) + (healthData.stabilityScore * 0.4) + (healthData.reliabilityScore * 0.2);

    // Determine Health Label
    let health = 'Stable';
    if (msi >= 80) health = 'Thriving';
    else if (msi >= 60) health = 'Healthy';
    else if (msi >= 40) health = 'Stable';
    else if (msi >= 20) health = 'Poor';
    else health = 'Critical';

    return {
        msi: Math.round(msi) || 0,
        health,
        ...healthData
    };
};
