
/**
 * mlEngine.ts
 * Service responsible for Machine Learning calculations (Z-Score, Volatility, Advanced Stats).
 */

export interface MarketStats {
    mean: number;
    median: number;
    volatility: number;
    min: number;
    max: number;
    p25: number;
    p75: number;
    sampleSize: number;
    outliersRemoved: number;
    fairPrice: number; // The robust recommended price
}

export class MLEngine {

    public static calculateZScore(prices: number[]): number[] {
        if (!prices || prices.length === 0) {
            return [];
        }

        const mean = this.calculateMean(prices);
        const stdDev = this.calculateStdDev(prices, mean);

        if (stdDev === 0) {
            return prices.map(() => 0);
        }

        return prices.map(price => (price - mean) / stdDev);
    }

    public static calculateVolatility(prices: number[]): number {
        if (!prices || prices.length === 0) {
            return 0;
        }
        const mean = this.calculateMean(prices);
        return this.calculateStdDev(prices, mean);
    }

    private static calculateMean(data: number[]): number {
        if (data.length === 0) return 0;
        const sum = data.reduce((a, b) => a + b, 0);
        return sum / data.length;
    }

    private static calculateStdDev(data: number[], mean: number): number {
        if (data.length === 0) return 0;
        const squareDiffs = data.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = this.calculateMean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    public static calculateMedian(data: number[]): number {
        if (data.length === 0) return 0;
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    public static calculatePercentile(data: number[], p: number): number {
        if (data.length === 0) return 0;
        const sorted = [...data].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * p;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    }

    public static filterOutliers(data: number[]): number[] {
        if (data.length < 4) return data;
        const q1 = this.calculatePercentile(data, 0.25);
        const q3 = this.calculatePercentile(data, 0.75);
        const iqr = q3 - q1;
        // Moderate outlier filter (1.5x IQR)
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        return data.filter(x => x >= lower && x <= upper);
    }

    public static analyzeAnomalies(records: any[], threshold: number = 2.0): any[] {
        const prices = records.map(r => r.price); // Assumes price is normalized
        const zScores = this.calculateZScore(prices);
        const volatility = this.calculateVolatility(prices);

        return records.map((record, index) => ({
            item_name: record.name,
            z_score: zScores[index],
            volatility: volatility,
            is_anomaly: Math.abs(zScores[index]) > threshold
        }));
    }
}

// --- EXPORTED FUNCTIONS FOR APP COMPATIBILITY ---

export const analyzePriceSet = (rawPrices: number[]): MarketStats => {
    if (!rawPrices || rawPrices.length === 0) {
        return {
            mean: 0, median: 0, volatility: 0,
            min: 0, max: 0, p25: 0, p75: 0,
            sampleSize: 0, outliersRemoved: 0, fairPrice: 0
        };
    }

    // 1. Filter Outliers first for robust stats
    const cleanPrices = MLEngine.filterOutliers(rawPrices);
    const outliersCount = rawPrices.length - cleanPrices.length;

    // Use clean prices for main stats, but keep min/max from raw (or clean? usually clean is better for prediction)
    // Let's use clean prices for prediction stats
    const pricesToUse = cleanPrices.length > 0 ? cleanPrices : rawPrices;

    const mean = pricesToUse.reduce((a, b) => a + b, 0) / pricesToUse.length;
    const median = MLEngine.calculateMedian(pricesToUse);
    const volatility = MLEngine.calculateVolatility(pricesToUse);
    const min = Math.min(...pricesToUse);
    const max = Math.max(...pricesToUse);
    const p25 = MLEngine.calculatePercentile(pricesToUse, 0.25);
    const p75 = MLEngine.calculatePercentile(pricesToUse, 0.75);

    // Fair Price Strategy:
    // If high volatility, prefer Median. If low volatility, Mean is fine.
    // Let's stick to Median as it's generally safer for game markets with manipulation.
    const fairPrice = median;

    return {
        mean,
        median,
        volatility,
        min,
        max,
        p25,
        p75,
        sampleSize: rawPrices.length,
        outliersRemoved: outliersCount,
        fairPrice
    };
};
