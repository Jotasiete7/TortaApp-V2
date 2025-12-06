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
            console.error('Error fetching player logs:', error);
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

    /**
     * Fetches trade logs for Trade Master view
     * 📊 INCREASED LIMIT: 5000 -> 50000 to match Supabase max_rows config
     */
    getTradeLogs: async (limit: number = 50000): Promise<any[]> => {
        const { data, error } = await supabase
            .rpc('get_trade_logs_for_market', { limit_count: limit });

        if (error) {
            console.error('Error fetching trade logs:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Fetches database usage statistics.
     */
    getDbUsage: async (): Promise<DbUsageStats | null> => {
        const { data, error } = await supabase.rpc('get_db_usage');
        if (error) {
            console.error('Error fetching DB usage:', error);
            return null;
        }
        return data;
    }
};
