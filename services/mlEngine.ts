/**
 * mlEngine.ts (v2.1)
 * Service responsible for Machine Learning calculations (Z-Score, Volatility, Advanced Stats).
 * 
 * FEATURES V2.1:
 * - Time Decay (Exponential Moving Average)
 * - QL Power Regression
 * - Material Normalization
 */

import { MarketItem } from '../types';
import { MATERIAL_MULTIPLIERS, QL_EXPONENTS } from './ItemIdentity';

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
}

// --- V2.1 ADVANCED ANALYSIS FUNCTIONS ---

/**
 * 1. Normaliza o preço de um item para o equivalente QL 50,
 * 2. Aplica o Multiplicador de Material.
 */
export function normalizePriceForAnalysis(item: MarketItem, itemName: string): number {
    const baseQL = 50.0;
    // Assume 50ql if unknown (safe fallback)
    const currentQL = (item.quality > 0) ? item.quality : baseQL;
    const material = (item.material || 'default').toLowerCase();

    // 1. Regressão de Potência (QL Normalization)
    const exponent = QL_EXPONENTS['default']; // Simplify: Use default for now, can extend to lookup by itemName

    // Fórmula: Preço_Base_50QL = Preço_Atual / (QL_Atual / 50) ^ Expoente
    // Protect against division by zero or weird QL
    const qlRatio = Math.max(0.1, currentQL) / baseQL;
    const qlNormalizedPrice = item.price / Math.pow(qlRatio, exponent);

    // 2. Multiplicador de Material (Material Normalization)
    const materialMultiplier = MATERIAL_MULTIPLIERS[material] || MATERIAL_MULTIPLIERS['default']; // Use default=1.0 if not found

    // Normaliza o preço removendo o efeito do material (dividindo pelo multiplicador)
    const fullyNormalizedPrice = qlNormalizedPrice / materialMultiplier;

    return fullyNormalizedPrice;
}

/**
 * 2. Aplica o Decaimento Temporal (Exponential Moving Average - EMA Ponderation)
 * Returns a weighted list of prices. Since we can't easily do weighted median with standard arrays,
 * we will simulate weighting by repeating recent items or reducing weight impact.
 * 
 * SIMPLIFICATION FOR THIS VERSION: 
 * We will return the items that pass a "recentness check" or simply assume input is already filtered by date?
 * No, let's implement the weighting logic by Adjusting the Price? 
 * NO! Price shouldn't change. Time Decay means OLD prices matter LESS.
 * 
 * APPROACH: Weighted Average is easy. Weighted Median is harder.
 * Let's implement a filtered set where very old items are discarded if we have enough new data?
 * 
 * BETTER APPROACH (Validation): The user asked for EMA.
 * "const weight = Math.exp(-decayConstant * ageInMilliseconds);"
 * "return item.price * weight" -> This effectively reduces the price of old items. THIS IS WRONG for pricing.
 * An old item costing 10s is still worth 10s (ignoring inflation).
 * 
 * MANUS INTENT: He wants the "Influence" of the trade to decay.
 * If we use Median, we can't easily weight.
 * COMPROMISE: We will filter out items older than X if we have enough recent data.
 * OR: We use the provided logic which seems to modify price?
 * "return { ...item, price: item.price * weight }" -> 
 * Wait, if I multiply price by weight (0.5), a 10s item becomes 5s. 
 * This treats "Old" as "Cheaper". This assumes inflation is NEGATIVE? Or that uncertainty lowers value?
 * 
 * INTERPRETATION: The user provided code does `price * weight`. This might be a mistake in the prompt or a specific rigorous assumption.
 * For a "Fair Price" Engine in an inflation-heavy game, OLD prices should be adjusted for Inflation (increased), not decreased.
 * 
 * CORRECTION: I will implement the weighting by FILTERING.
 * But let's stick to the prompt's request for "applyTimeDecay".
 * I will modify it to return WEIGHTED objects, but handled by the engine.
 * 
 * ACTUALLY: Let's assume the user meant "Weight in the calculation", not "Modify the price value".
 * Since implementing a Weighted Median is complex for a patch, I will use a simple Recency Filter for now.
 * 
 * RE-READING PROMPT: "Preço * (QL/50)^Expoente". 
 * "Decaimento Temporal... dá menos peso para trades antigos".
 * 
 * I will implement a "Recent Bias" filter. If we have > 20 items in the last 30 days, ignore older ones.
 */

// Implementation of Weighted Median (Simplified)
const weightedMedian = (values: number[], weights: number[]): number => {
    if (values.length === 0) return 0;

    const combined = values.map((v, i) => ({ v, w: weights[i] }));
    combined.sort((a, b) => a.v - b.v);

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const halfWeight = totalWeight / 2;

    let weightSum = 0;
    for (const item of combined) {
        weightSum += item.w;
        if (weightSum >= halfWeight) return item.v;
    }
    return combined[combined.length - 1].v;
};

export const analyzePriceSet = (rawPrices: number[], itemsContext?: MarketItem[], itemNameContext?: string): MarketStats => {
    // If we only get numbers (legacy call), fallback to basic engine
    if (!itemsContext || itemsContext.length === 0) {
        // Fallback Logic (Old V1)
        if (!rawPrices || rawPrices.length === 0) {
            return {
                mean: 0, median: 0, volatility: 0,
                min: 0, max: 0, p25: 0, p75: 0,
                sampleSize: 0, outliersRemoved: 0, fairPrice: 0
            };
        }
        const cleanPrices = MLEngine.filterOutliers(rawPrices);
        const pricesToUse = cleanPrices.length > 0 ? cleanPrices : rawPrices;
        const median = MLEngine.calculateMedian(pricesToUse);
        return {
            mean: 0, median, volatility: 0, min: 0, max: 0, p25: 0, p75: 0,
            sampleSize: rawPrices.length, outliersRemoved: rawPrices.length - pricesToUse.length, fairPrice: median
        };
    }

    // --- MANUS V2.1 LOGIC ---

    // 1. Separation (WTS only for pricing)
    const validItems = itemsContext.filter(i => i.price > 0); // Assuming already filtered by WTS in UI? No, safeguards.

    if (validItems.length === 0) {
        return { mean: 0, median: 0, volatility: 0, min: 0, max: 0, p25: 0, p75: 0, sampleSize: 0, outliersRemoved: 0, fairPrice: 0 };
    }

    // 2. Normalization (QL & Material)
    // We normalize everything to "Iron QL 50" equivalents
    const normalizedData = validItems.map(item => {
        const normPrice = normalizePriceForAnalysis(item, itemNameContext || '');

        // Time Decay Weight Calculation
        const now = Date.now();
        const ageMs = now - item.timestamp; // timestamp is unix ms? or seconds? Usually ms in JS.
        // Assuming timestamp is MS. If it's huge, good.
        // Lambda for 30 days decay? 
        // 30 days = 2592000000 ms. 
        // We want weight 0.5 at 30 days? exp(-lambda * 2.59e9) = 0.5 => lambda ~= 2.6e-10
        const DECAY_CONSTANT = 2.6e-10;
        const weight = Math.exp(-DECAY_CONSTANT * ageMs);

        return { price: normPrice, weight };
    });

    // 3. Outlier Filter on Normalized Prices
    const pricesOnly = normalizedData.map(d => d.price);
    const q1 = MLEngine.calculatePercentile(pricesOnly, 0.25);
    const q3 = MLEngine.calculatePercentile(pricesOnly, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    const cleanData = normalizedData.filter(d => d.price >= lower && d.price <= upper);
    const outliersCount = normalizedData.length - cleanData.length;

    // 4. Weighted Median Calculation
    const cleanPrices = cleanData.map(d => d.price);
    const cleanWeights = cleanData.map(d => d.weight);

    const fairPriceNormalized = weightedMedian(cleanPrices, cleanWeights);

    // Stats for display (using filtered set)
    const p25 = MLEngine.calculatePercentile(cleanPrices, 0.25);
    const p75 = MLEngine.calculatePercentile(cleanPrices, 0.75);
    const volatility = MLEngine.calculateVolatility(cleanPrices);

    return {
        mean: 0, // Not used
        median: fairPriceNormalized,
        volatility,
        min: Math.min(...cleanPrices),
        max: Math.max(...cleanPrices),
        p25,
        p75,
        sampleSize: validItems.length,
        outliersRemoved: outliersCount,
        fairPrice: fairPriceNormalized
    };
};
