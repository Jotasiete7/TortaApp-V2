/**
 * rankings.ts
 * Service layer for ranking/leaderboard functionality
 */

import { supabase } from './supabase';

// ==================== TYPES ====================

export interface MostActiveTrader {
    rank: number;
    nick: string;
    wts_count: number;
    last_seen: string;
}

export interface ActiveSeller {
    rank: number;
    nick: string;
    wts_count: number;
}

export interface ActiveBuyer {
    rank: number;
    nick: string;
    wtb_count: number;
}

export interface PriceChecker {
    rank: number;
    nick: string;
    pc_count: number;
}

export type TimePeriod = 'all_time' | 'yearly' | 'monthly' | 'weekly';

// ==================== SERVICE ====================

export const RankingsService = {
    /**
     * Get most active traders (WTS count)
     */
    getMostActiveTraders: async (
        limit: number = 10,
        period: TimePeriod = 'all_time'
    ): Promise<MostActiveTrader[]> => {
        const { data, error } = await supabase.rpc('get_most_active_traders', {
            limit_count: limit,
            time_period: period
        });

        if (error) {
            console.error('Error fetching active traders:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get most active sellers (WTS) for a specific month
     */
    getMostActiveSellers: async (
        limit: number = 10,
        year?: number,
        month?: number
    ): Promise<ActiveSeller[]> => {
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? (now.getMonth() + 1); // JS months are 0-indexed

        const { data, error } = await supabase.rpc('get_most_active_sellers', {
            limit_count: limit,
            target_year: targetYear,
            target_month: targetMonth
        });

        if (error) {
            console.error('Error fetching active sellers:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get most active buyers (WTB) for a specific month
     */
    getMostActiveBuyers: async (
        limit: number = 10,
        year?: number,
        month?: number
    ): Promise<ActiveBuyer[]> => {
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? (now.getMonth() + 1);

        const { data, error } = await supabase.rpc('get_most_active_buyers', {
            limit_count: limit,
            target_year: targetYear,
            target_month: targetMonth
        });

        if (error) {
            console.error('Error fetching active buyers:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Get top price checkers (PC) for a specific week
     */
    getTopPriceCheckers: async (
        limit: number = 10,
        weekStart?: string
    ): Promise<PriceChecker[]> => {
        // Default to start of current week
        const start = weekStart ?? getStartOfWeek();

        const { data, error } = await supabase.rpc('get_top_price_checkers', {
            limit_count: limit,
            week_start: start
        });

        if (error) {
            console.error('Error fetching price checkers:', error);
            return [];
        }

        return data || [];
    }
};

// ==================== HELPERS ====================

/**
 * Get the start of the current week (Monday)
 */
function getStartOfWeek(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // YYYY-MM-DD format
}
