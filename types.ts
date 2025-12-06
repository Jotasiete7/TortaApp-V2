
// Data Models based on the implied Python structure
export interface MarketItem {
    id: string;
    name: string;
    material: string;
    quality: number;
    rarity: 'Common' | 'Rare' | 'Supreme' | 'Fantastic';
    price: number; // Normalized in COPPER (Unit Price: Total / Qty)
    quantity: number; // The bulk amount (e.g. 1000 for "1k stone")
    orderType: 'WTB' | 'WTS' | 'UNKNOWN';
    seller: string;
    location: string;
    timestamp: string;
    searchableText?: string; // Optional: Pre-computed search text for SearchEngine
}

export interface PredictionResult {
    predictedPrice: number; // In Copper
    confidence: number;
    zScore: number;
    trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
    date: string;
    avgPrice: number; // In Copper
    volume: number;
}

export interface ReferencePrice {
    itemName: string;
    price: number; // In Copper
}

export interface BulkAnalysis {
    hasBulks: boolean;
    bulkSizes: number[];
    bulkMultipliers: number[];
    recommendedBulk: number;
}

export enum ViewState {
    DASHBOARD = 'DASHBOARD',
    MARKET = 'MARKET',
    ANALYTICS = 'ANALYTICS',
    PREDICTOR = 'PREDICTOR',
    PRICEMANAGER = 'PRICEMANAGER',
    ADMIN = 'ADMIN',
    SETTINGS = 'SETTINGS',
    BULK_UPLOAD = 'BULK_UPLOAD'
}

export type Language = 'en' | 'pt';

// Gamification Types

export interface Badge {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon_name: string;
    color: string;
    created_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    earned_at: string;
    is_displayed: boolean;
    badge?: Badge; // Joined data
}

export interface ShoutBalance {
    user_id: string;
    weekly_shouts_remaining: number;
    monthly_shouts_remaining: number;
    last_weekly_reset: string;
    last_monthly_reset: string;
}

export interface UserStreak {
    user_id: string;
    current_streak: number;
    total_logins: number;
    last_claim_at: string | null;
    created_at: string;
}

export interface DailyClaimResult {
    success: boolean;
    error?: string;
    new_streak: number;
    xp_gained?: number;
    bonus_shouts?: number;
    earned_badge?: boolean;
}

// Charts Engine - Phase 1 Interfaces
export interface VolatilityMetrics {
    score: number; // 0-100
    priceVariance: number;
    supplyConsistency: number; // 0-100
    demandStability: number; // 0-100
    trend: 'rising' | 'falling' | 'stable';
}

export interface SellerInsights {
    seller: string;
    totalListings: number;
    avgPrice: number;
    marketShare: number; // percentage 0-100
    priceStrategy: 'premium' | 'discount' | 'market';
    activityScore: number; // 0-100
}

export interface CandlestickDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface HeatmapDataPoint {
    date: string;
    count: number;
    avgPrice: number;
}

