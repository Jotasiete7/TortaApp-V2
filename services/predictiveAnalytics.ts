import { MarketItem } from '../types';

export interface PriceForecast {
    currentPrice: number;
    predictedPrice: number;
    predictedChange: number;
    predictedChangePercent: number;
    confidence: number; // 0-100
    trend: 'strong_up' | 'moderate_up' | 'weak_up' | 'stable' | 'weak_down' | 'moderate_down' | 'strong_down';
    trendStrength: number; // 0-100
    forecastDays: number;
    dataPoints: number;
    rSquared: number; // Goodness of fit
}

export interface ForecastDataPoint {
    date: string;
    actual?: number;
    predicted: number;
    upperBound: number;
    lowerBound: number;
}

/**
 * Calculate linear regression for price prediction
 */
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; rSquared: number } {
    const n = data.length;

    if (n < 2) {
        return { slope: 0, intercept: 0, rSquared: 0 };
    }

    // Calculate means
    const meanX = data.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = data.reduce((sum, p) => sum + p.y, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (const point of data) {
        numerator += (point.x - meanX) * (point.y - meanY);
        denominator += Math.pow(point.x - meanX, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Calculate R-squared
    let ssRes = 0; // Sum of squares of residuals
    let ssTot = 0; // Total sum of squares

    for (const point of data) {
        const predicted = slope * point.x + intercept;
        ssRes += Math.pow(point.y - predicted, 2);
        ssTot += Math.pow(point.y - meanY, 2);
    }

    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, rSquared };
}

/**
 * Calculate exponential moving average
 */
function calculateEMA(prices: number[], period: number): number[] {
    if (prices.length === 0) return [];

    const k = 2 / (period + 1);
    const ema: number[] = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }

    return ema;
}

/**
 * Predict future price using linear regression
 */
export function predictPrice(items: MarketItem[], itemName: string, forecastDays: number = 7): PriceForecast | null {
    // Filter and sort data
    const itemData = items
        .filter(i => i.name.toLowerCase() === itemName.toLowerCase() && i.price > 0)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (itemData.length < 5) {
        return null; // Not enough data
    }

    // Use last 30 days for prediction
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentData = itemData.filter(i => new Date(i.timestamp).getTime() > thirtyDaysAgo);

    if (recentData.length < 5) {
        return null;
    }

    // Prepare data for regression (group by day)
    const dailyPrices = new Map<string, number[]>();
    recentData.forEach(item => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        if (!dailyPrices.has(date)) {
            dailyPrices.set(date, []);
        }
        dailyPrices.get(date)!.push(item.price);
    });

    // Calculate daily averages
    const sortedDates = Array.from(dailyPrices.keys()).sort();
    const regressionData = sortedDates.map((date, index) => {
        const prices = dailyPrices.get(date)!;
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return { x: index, y: avgPrice };
    });

    // Perform linear regression
    const { slope, intercept, rSquared } = linearRegression(regressionData);

    // Current price (latest day average)
    const currentPrice = regressionData[regressionData.length - 1].y;

    // Predicted price (forecast days ahead)
    const futureX = regressionData.length - 1 + forecastDays;
    const predictedPrice = slope * futureX + intercept;

    // Calculate change
    const predictedChange = predictedPrice - currentPrice;
    const predictedChangePercent = (predictedChange / currentPrice) * 100;

    // Confidence based on R-squared and data volume
    const dataVolumeScore = Math.min(100, (recentData.length / 30) * 100);
    const confidence = Math.round((rSquared * 70) + (dataVolumeScore * 0.3));

    // Trend strength (based on slope magnitude)
    const avgPrice = regressionData.reduce((sum, p) => sum + p.y, 0) / regressionData.length;
    const normalizedSlope = Math.abs(slope) / avgPrice;
    const trendStrength = Math.min(100, normalizedSlope * 1000);

    // Determine trend category
    let trend: PriceForecast['trend'];
    const changePercent = Math.abs(predictedChangePercent);

    if (predictedChangePercent > 10) {
        trend = 'strong_up';
    } else if (predictedChangePercent > 5) {
        trend = 'moderate_up';
    } else if (predictedChangePercent > 1) {
        trend = 'weak_up';
    } else if (predictedChangePercent < -10) {
        trend = 'strong_down';
    } else if (predictedChangePercent < -5) {
        trend = 'moderate_down';
    } else if (predictedChangePercent < -1) {
        trend = 'weak_down';
    } else {
        trend = 'stable';
    }

    return {
        currentPrice,
        predictedPrice,
        predictedChange,
        predictedChangePercent,
        confidence,
        trend,
        trendStrength: Math.round(trendStrength),
        forecastDays,
        dataPoints: recentData.length,
        rSquared
    };
}

/**
 * Generate forecast data points for visualization
 */
export function generateForecastData(items: MarketItem[], itemName: string, forecastDays: number = 7): ForecastDataPoint[] {
    const itemData = items
        .filter(i => i.name.toLowerCase() === itemName.toLowerCase() && i.price > 0)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (itemData.length < 5) return [];

    // Group by day
    const dailyPrices = new Map<string, number[]>();
    itemData.forEach(item => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        if (!dailyPrices.has(date)) {
            dailyPrices.set(date, []);
        }
        dailyPrices.get(date)!.push(item.price);
    });

    const sortedDates = Array.from(dailyPrices.keys()).sort();
    const regressionData = sortedDates.map((date, index) => {
        const prices = dailyPrices.get(date)!;
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return { x: index, y: avgPrice, date };
    });

    const { slope, intercept } = linearRegression(regressionData.map(d => ({ x: d.x, y: d.y })));

    // Calculate standard error for confidence interval
    const predictions = regressionData.map(d => slope * d.x + intercept);
    const residuals = regressionData.map((d, i) => d.y - predictions[i]);
    const standardError = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / regressionData.length);

    const result: ForecastDataPoint[] = [];

    // Historical data with actual values
    regressionData.forEach((d, i) => {
        const predicted = slope * d.x + intercept;
        result.push({
            date: d.date,
            actual: d.y,
            predicted,
            upperBound: predicted + standardError * 1.96,
            lowerBound: predicted - standardError * 1.96
        });
    });

    // Future predictions
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    for (let i = 1; i <= forecastDays; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setDate(futureDate.getDate() + i);
        const futureX = regressionData.length - 1 + i;
        const predicted = slope * futureX + intercept;

        result.push({
            date: futureDate.toISOString().split('T')[0],
            predicted,
            upperBound: predicted + standardError * 1.96,
            lowerBound: predicted - standardError * 1.96
        });
    }

    return result;
}

/**
 * Get trend icon and color
 */
export function getTrendDisplay(trend: PriceForecast['trend'], t?: (key: string) => string): { icon: string; color: string; label: string } {
    const useT = t || ((key: string) => key);
    
    switch (trend) {
        case 'strong_up':
            return { icon: '📈', color: 'emerald', label: useT('strong_uptrend') };
        case 'moderate_up':
            return { icon: '↗️', color: 'emerald', label: useT('moderate_uptrend') };
        case 'weak_up':
            return { icon: '⤴️', color: 'green', label: useT('weak_uptrend') };
        case 'stable':
            return { icon: '➡️', color: 'slate', label: useT('stable') };
        case 'weak_down':
            return { icon: '⤵️', color: 'orange', label: useT('weak_downtrend') };
        case 'moderate_down':
            return { icon: '↘️', color: 'red', label: useT('moderate_downtrend') };
        case 'strong_down':
            return { icon: '📉', color: 'red', label: useT('strong_downtrend') };
    }
};