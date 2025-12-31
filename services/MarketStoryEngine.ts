
import { ItemHistoryPoint, VolatilityMetrics } from '../types';

export type MarketPhaseId = 'DORMANT' | 'STABLE' | 'GROWING' | 'INFLATED' | 'COLLAPSING' | 'CHAOTIC';
export type MarketMoodId = 'BORED' | 'PEACEFUL' | 'OPTIMISTIC' | 'EUPHORIC' | 'NERVOUS' | 'PANICKED' | 'DEPRESSED';

export interface MarketPhase {
    id: MarketPhaseId;
    label: string;
    confidence: number;
    explanation: string[];
    recommendation: string;
    color: string;
}

export interface MarketMood {
    id: MarketMoodId;
    label: string;
    emoji: string;
    description: string;
}

export interface MarketStory {
    phase: MarketPhase;
    mood: MarketMood;
    insights: string[];
}

/**
 * MarketStoryEngine
 * Transforms raw statistics into narrative phases and moods.
 */
export const MarketStoryEngine = {

    analyze: (
        history: ItemHistoryPoint[],
        volatility: VolatilityMetrics | null,
        sellerCount: number,
        distinctDays: number
    ): MarketStory => {

        const insights: string[] = [];

        // 0. Default Fallback
        if (!history || history.length < 3 || !volatility) {
            return {
                phase: {
                    id: 'DORMANT',
                    label: 'Dormant',
                    confidence: 1.0,
                    explanation: ['Not enough data to determine active phase.'],
                    recommendation: 'Market is likely inactive.',
                    color: 'slate'
                },
                mood: { id: 'BORED', label: 'Bored', emoji: '💤', description: 'Nobody is looking at this.' },
                insights: ['Insufficient data for narrative analysis.']
            };
        }

        // 1. Calculate Trends (Window Analysis)
        const recentWindow = history.slice(-3);
        const farWindow = history.slice(-30, -20); // Baseline from ~month ago

        const currentPrice = recentWindow[recentWindow.length - 1].avgPrice;
        const avgVolumeRecent = recentWindow.reduce((acc, h) => acc + h.volume, 0) / recentWindow.length;

        // Price Trend
        // Simple linear slope of last 7 points (or fewer)
        const trendWindow = history.slice(-7);
        const priceSlope = calculateSlope(trendWindow.map(h => h.avgPrice));
        const volumeSlope = calculateSlope(trendWindow.map(h => h.volume));

        // 2. Heuristics for Phases

        // DORMANT: Very low volume, few sellers
        const isDormant = avgVolumeRecent < 1 && sellerCount <= 1;

        // CHAOTIC: High volatility + Erratic Volume slope
        const isChaotic = volatility.score > 75;

        // INFLATED: Price slope positive + High Volatility + High Concentration (proxy by Seller Count low)
        const isInflated = priceSlope > 0 && volatility.score > 60 && sellerCount < 3;

        // COLLAPSING: Price slope negative + High Volatility
        const isCollapsing = priceSlope < 0 && volatility.score > 50;

        // GROWING: Price slope positive + Controlled Volatility (< 60)
        const isGrowing = priceSlope > 0 && volatility.score < 60;

        // STABLE: Default if active but not moving much
        const isStable = Math.abs(priceSlope) < 0.1 && volatility.score < 40;


        let phase: MarketPhase;

        // Decision Tree (Order matters)
        if (isDormant) {
            phase = {
                id: 'DORMANT',
                label: 'Dormant',
                confidence: 0.9,
                explanation: ['Volume is negligible', 'Very rare trades detected'],
                recommendation: 'Only produce on demand.',
                color: 'slate'
            };
        } else if (isChaotic) {
            phase = {
                id: 'CHAOTIC',
                label: 'Chaotic',
                confidence: 0.8,
                explanation: ['Extreme price volatility detected', 'Market behaviour is erratic'],
                recommendation: 'High risk. Avoid unless arbitrage trading.',
                color: 'purple'
            };
        } else if (isCollapsing) {
            phase = {
                id: 'COLLAPSING',
                label: 'Collapsing',
                confidence: 0.85,
                explanation: ['Price trend is sharply negative', 'Volatility is elevated'],
                recommendation: 'Do not buy. Wait for bottom.',
                color: 'red'
            };
        } else if (isInflated) {
            phase = {
                id: 'INFLATED',
                label: 'Inflated',
                confidence: 0.75,
                explanation: ['Prices rising fast with low liquidity', 'Possible speculative bubble'],
                recommendation: 'Sell into strength. Do not buy.',
                color: 'amber'
            };
        } else if (isGrowing) {
            phase = {
                id: 'GROWING',
                label: 'Growing',
                confidence: 0.8,
                explanation: ['Steady upward price trend', 'Volatility is regular'],
                recommendation: 'Good time to enter production.',
                color: 'blue'
            };
        } else {
            phase = {
                id: 'STABLE',
                label: 'Stable',
                confidence: 0.9,
                explanation: ['Prices are consistent over 7 days', 'Healthy volume flow'],
                recommendation: 'Safe for regular bulk trading.',
                color: 'emerald'
            };
        }

        // 3. Determine Mood (Emotion Layer)
        // Mood is intersection of Trend + Volatility
        let mood: MarketMood;

        if (phase.id === 'DORMANT') mood = { id: 'BORED', label: 'Bored', emoji: '💤', description: 'Nothing happening.' };
        else if (phase.id === 'STABLE') mood = { id: 'PEACEFUL', label: 'Peaceful', emoji: '😌', description: 'Business as usual.' };
        else if (phase.id === 'CHAOTIC') mood = { id: 'PANICKED', label: 'Panicked', emoji: '😱', description: 'Traders are losing their minds.' };
        else if (phase.id === 'INFLATED') mood = { id: 'EUPHORIC', label: 'Euphoric', emoji: '🤑', description: 'Greed is driving prices up.' };
        else if (phase.id === 'COLLAPSING') mood = { id: 'DEPRESSED', label: 'Depressed', emoji: '📉', description: 'Sentiment is bearish.' };
        else if (phase.id === 'GROWING') mood = { id: 'OPTIMISTIC', label: 'Optimistic', emoji: '🚀', description: 'Buyers are confident.' };
        else mood = { id: 'NERVOUS', label: 'Nervous', emoji: '😬', description: 'Uncertain future.' };


        // 4. Generate Narrative Insights
        if (priceSlope > 0) insights.push(`Price is gaining momentum (${(priceSlope * 100).toFixed(1)}% trend).`);
        if (priceSlope < 0) insights.push(`Price momentum is negative.`);
        if (volatility.score > 80) insights.push(`Extreme risk warning.`);

        return { phase, mood, insights };
    }
};

// Helper: Calculate linear regression slope
function calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    // Normalize slope slightly for game scale 
    return slope;
}
