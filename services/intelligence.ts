
import { supabase } from './supabase';

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
    user_id?: string; // ADDED for Realtime filtering
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
    change: number; // Percent change
}

export interface MarketIntelligenceData {
    topDemand: MarketTrendItem[];
    topSupply: MarketTrendItem[];
    topVolatility: MarketTrendItem[];
}

export const IntelligenceService = {
    getGlobalStats: async (): Promise<GlobalStats | null> => {
        const { data, error } = await supabase
            .rpc('get_global_stats');

        if (error) {
            console.error('Error fetching global stats:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    },

    getTopTraders: async (limit: number = 10): Promise<TraderProfile[]> => {
        const { data, error } = await supabase
            .rpc('get_top_traders', { limit_count: limit });

        if (error) {
            console.error('Error fetching top traders:', error);
            return [];
        }

        return data || [];
    },

    getPlayerStats: async (nick: string): Promise<PlayerStats | null> => {
        const { data, error } = await supabase
            .rpc('get_player_stats', { player_nick: nick });

        if (error) {
            console.error('Error fetching player stats:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    },

    getPlayerStatsAdvanced: async (nick: string): Promise<PlayerStatsAdvanced | null> => {
        const { data, error } = await supabase
            .rpc('get_player_stats_v3', { target_nick: nick });

        if (error) {
            console.error('Error fetching advanced player stats:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    },

    getPlayerLogs: async (nick: string, limit: number = 50, offset: number = 0): Promise<PlayerLog[]> => {
        const { data, error } = await supabase
            .rpc('get_player_logs', { target_nick: nick, limit_count: limit, offset_count: offset });

        if (error) {
            console.error('Error fetching playerLogs:', error);
            return [];
        }

        return data || [];
    },

    getPlayerActivity: async (nick: string): Promise<ActivityPoint[]> => {
        const { data, error } = await supabase
            .rpc('get_player_activity_chart', { target_nick: nick });

        if (error) {
            console.error('Error fetching player activity:', error);
            return [];
        }

        return data || [];
    },

    getTradeLogs: async (limit: number = 50000): Promise<any[]> => {
        const { data, error } = await supabase
            .rpc('get_trade_logs_for_market', { limit_count: limit });

        if (error) {
            console.error('Error fetching trade logs:', error);
            return [];
        }

        return data || [];
    },

    getDbUsage: async (): Promise<DbUsageStats | null> => {
        const { data, error } = await supabase.rpc('get_db_usage');
        if (error) {
            console.error('Error fetching DB usage:', error);
            return null;
        }
        return data;
    },

    // --- NEW METHOD FOR DASHBOARD 2.0 ---
    getMarketIntelligence: async (): Promise<MarketIntelligenceData> => {
        // MOCK DATA - In future connect to supabase RPC 'get_market_intelligence'
        await new Promise(resolve => setTimeout(resolve, 500)); 

        return {
            topDemand: [
                { name: "Iron Lump (90ql+)", volume: 42, price: 1500, change: 12 },
                { name: "Seryll Lump", volume: 18, price: 5000, change: 5 },
                { name: "Cotton", volume: 156, price: 10, change: 25 }
            ],
            topSupply: [
                { name: "Clay", volume: 500, price: 2, change: -10 },
                { name: "Dirt", volume: 1200, price: 1, change: -5 },
                { name: "Kindling", volume: 350, price: 5, change: 0 }
            ],
            topVolatility: [
                { name: "Drake Hide", volume: 5, price: 250000, change: 150 },
                { name: "Glimmersteel", volume: 8, price: 8500, change: 45 },
                { name: "Rare Bone", volume: 3, price: 15000, change: 30 }
            ]
        };
    }
};
