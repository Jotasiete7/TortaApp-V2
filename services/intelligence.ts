import { supabase } from './supabase';
import { MarketItem } from '../types';
import { LEVELS, XP_PER_TRADE } from '../constants/gamification';

export interface TraderProfile {
    nick: string;
    total_trades: number;
    last_seen: string;
}

export interface PlayerStats {
    nick: string;
    wts_count: number;
    wtb_count: number;
    total: number;
    fav_server: string;
}

export interface PlayerStatsAdvanced extends PlayerStats {
    pc_count: number;
    first_seen: string;
    last_seen: string;
    rank_position: number;
    xp: number;
    level: number;
    user_id?: string;
}

export interface PlayerLog {
    id: string;
    trade_timestamp_utc: string;
    trade_type: string;
    message: string;
    server: string;
}

export interface ActivityPoint {
    activity_date: string;
    trade_count: number;
}

export interface GlobalStats {
    total_volume: number;
    items_indexed: number;
    avg_price: number;
    wts_count: number;
    wtb_count: number;
    wtb_count: number;
    wts_count: number;
    wtb_count: number;
    wtb_count: number;
}

export interface DbUsageStats {
    total_size_bytes: number;
    trade_logs_count: number;
    users_count: number;
    limit_bytes: number;
}

// --- NEW INTELLIGENCE INTERFACES ---
export interface MarketTrendItem {
    name: string;
    volume: number;
    price: number;
    avgPrice: number;
    absoluteChange: number;
    change: number;
}

export interface MarketIntelligenceData {
    topDemand: MarketTrendItem[];
    topSupply: MarketTrendItem[];
    topVolatility: MarketTrendItem[];
}

export interface ArbitrageOpportunity {
    name: string;
    wtbPrice: number;
    wtsPrice: number;
    spread: number;
    potentialProfit: number;
    ql?: string;
}

export type TimeWindow = '4h' | '12h' | '24h' | '7d' | '30d';

