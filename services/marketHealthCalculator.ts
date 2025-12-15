import { MarketItem } from '../types';
import { calculateVolatility } from './volatilityCalculator';

export interface MarketHealthMetrics {
    msi: number; // 0-100 Market Stability Index
    liquidityScore: number; // 0-100
    volatilityScore: number; // 0-100 (Inverted: 100 = Stable)
    priceScore: number; // 0-100 (Price Consistency)
    health: 'Critical' | 'Poor' | 'Stable' | 'Healthy' | 'Thriving';
    trend: 'improving' | 'deteriorating' | 'stable';
}

/**
 * Calculates the Market Stability Index (MSI)
 * A composite metric to determine if a market item is "Healthy".
 * Formula: (Liquidity * 0.4) + (Stability * 0.4) + (Demand * 0.2)
 */
export const calculateMarketHealth = (items: MarketItem[], itemName: string): MarketHealthMetrics => {
    // Reuse existing volatility calculator for base metrics
    const volatility = calculateVolatility(items, itemName);

    // 1. Liquidity Score: Based on Volume and Unique Days
    // We want high volume and frequent trades.
    // For a game like Wurm, 1 trade/day is decent, 10/day is high.

    // Get distinct days
    const days = new Set(items.filter(i => i.name.toLowerCase() === itemName.toLowerCase()).map(i => i.timestamp.split('T')[0])).size;
    const totalVolume = items.filter(i => i.name.toLowerCase() === itemName.toLowerCase()).length;

    // Simple heuristic: 
    // < 5 trades total = Low Liquidity
    // > 50 trades = High Liquidity
    const volumeScore = Math.min(100, (totalVolume / 20) * 100);

    // Consistency: trades on > 50% of observed days
    // This requires knowing the total window, which we approximate by (maxDate - minDate)
    // For MVP, we use the volumeScore mostly.
    const liquidityScore = volumeScore;

    // 2. Volatility Score (Already 0-100 where 100 is stable)
    // calculateVolatility returns a "Volatility Score" where 0 is stable? 
    // Let's check: "score: 0-100 normalized volatility score". 
    // Usually "High Volatility Score" = Bad.
    // We want "Stability Score". So we invert it.
    // Actually, looking at volatilityCalculator.ts: 
    // "priceVolatility... min(100, (stdDev/avg)*100)" -> High is Volatile.
    // So 100 is bad. 0 is perfect stability.
    // We want 100 = Healthy.
    const volatilityScore = Math.max(0, 100 - volatility.score);

    // 3. Price Consistency (Spread)
    // How close are Min/Max?
    // Use supplyConsistency from volatility metrics
    const priceScore = volatility.supplyConsistency; // This is actually supply consistency, not price.
    // Let's use 100 - priceVariance normalized?
    // Actually, let's allow the volatilityScore to carry the weight of price stability.

    // Composite Calculation
    // MSI = (Liquidity * 0.4) + (Stability * 0.4) + (DemandStability * 0.2)
    const msi = Math.round(
        (liquidityScore * 0.4) +
        (volatilityScore * 0.4) +
        (volatility.demandStability * 0.2)
    );

    // Health Category
    let health: MarketHealthMetrics['health'] = 'Stable';
    if (msi >= 80) health = 'Thriving';
    else if (msi >= 60) health = 'Healthy';
    else if (msi >= 40) health = 'Stable';
    else if (msi >= 20) health = 'Poor';
    else health = 'Critical';

    return {
        msi,
        liquidityScore,
        volatilityScore,
        priceScore: volatilityScore, // Proxy
        health,
        trend: volatility.trend === 'rising' ? 'improving' : volatility.trend === 'falling' ? 'deteriorating' : 'stable'
    };
};
