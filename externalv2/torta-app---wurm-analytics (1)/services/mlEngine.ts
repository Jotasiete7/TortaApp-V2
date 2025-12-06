/**
 * ML Engine for Torta Analytics
 * Migrated from ml_predictor.py
 */

// Helper: Calculate Mean
export const calculateMean = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
};

// Helper: Calculate Standard Deviation (Volatility)
export const calculateStandardDeviation = (numbers: number[], mean?: number): number => {
    if (numbers.length === 0) return 0;
    const m = mean ?? calculateMean(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - m, 2));
    const avgSquareDiff = calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
};

// Helper: Calculate Z-Scores
// Z = (X - Mean) / StdDev
export const calculateZScores = (numbers: number[]): number[] => {
    if (numbers.length === 0) return [];
    const mean = calculateMean(numbers);
    const stdDev = calculateStandardDeviation(numbers, mean);

    if (stdDev === 0) return numbers.map(() => 0); // Avoid division by zero

    return numbers.map(num => (num - mean) / stdDev);
};

/**
 * Filter Outliers based on Z-Score
 * Typically removes data points with Z-Score > 3 or < -3
 */
export const filterOutliers = (numbers: number[], threshold = 3): number[] => {
    const mean = calculateMean(numbers);
    const stdDev = calculateStandardDeviation(numbers, mean);
    
    if (stdDev === 0) return numbers;

    return numbers.filter(num => {
        const z = Math.abs((num - mean) / stdDev);
        return z <= threshold;
    });
};

export const analyzePriceSet = (prices: number[]) => {
    const cleanPrices = prices.filter(p => p > 0); // Ignore zero price for analysis
    const mean = calculateMean(cleanPrices);
    const volatility = calculateStandardDeviation(cleanPrices, mean);
    
    return {
        mean,
        volatility,
        sampleSize: cleanPrices.length,
        min: Math.min(...cleanPrices),
        max: Math.max(...cleanPrices)
    };
};
