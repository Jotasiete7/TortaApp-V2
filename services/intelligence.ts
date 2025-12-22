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

    // Additional fields returned by implementation
    avg_price: number;
    total_volume: number;
    unique_items: number;
    favorite_items: string[];
}

export interface PlayerLog {
    id: string;
    trade_timestamp_utc: string; // Enriched Log uses this
    trade_type: string;
    message: string;
    server: string;

    // Additional fields for Frontend Grid
    nick: string;
    item_name: string;
    price: number;
    timestamp?: string; // Legacy support or alias
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

// --- HELPERS (Local Data Only) ---
// Now used primarily for Local File normalization

const extractQL = (msg: string): string => {
    const match = msg.match(/\b(\d+)\s*ql\b/i);
    if (match) {
        const ql = parseInt(match[1]);
        const bucket = Math.floor(ql / 10) * 10;
        return `${bucket}ql+`;
    }
    return '';
};

export const IntelligenceService = {
    getGlobalStats: async (): Promise<GlobalStats | null> => {
        if (!supabase) {
            console.error('❌ Supabase client not initialized in getGlobalStats');
            return null;
        }
        const { data, error } = await supabase.rpc('get_global_stats');
        if (error) { console.error('Error fetching global stats:', error); return null; }
        return data && data.length > 0 ? data[0] : null;
    },

    getTopTraders: async (limit: number = 10): Promise<TraderProfile[]> => {
        if (!supabase) {
            console.error('❌ Supabase client not initialized in getTopTraders');
            return [];
        }
        const { data, error } = await supabase.rpc('get_top_traders', { limit_count: limit });
        if (error) { console.error('Error fetching top traders:', error); return []; }
        return data || [];
    },

    getPlayerStats: async (nick: string): Promise<PlayerStats | null> => {
        if (!supabase) {
            console.error('❌ Supabase client not initialized in getPlayerStats');
            return null;
        }
        const { data, error } = await supabase.rpc('get_player_stats', { player_nick: nick });
        if (error) { console.error('Error fetching player stats:', error); return null; }
        return data && data.length > 0 ? data[0] : null;
    },

    getPlayerStatsAdvanced: async (nick: string): Promise<PlayerStatsAdvanced | null> => {
        try {
            if (!supabase) {
                console.error('❌ Supabase client not initialized in getPlayerStatsAdvanced');
                return null;
            }

            // Query trade_logs directly to calculate stats
            const { data: logs, error } = await supabase
                .from('trade_logs')
                .select('*')
                .ilike('nick', nick)
                .order('trade_timestamp_utc', { ascending: false })
                .limit(1000);

            if (error) {
                console.error('Error fetching player stats:', error);
                return null;
            }

            if (!logs || logs.length === 0) {
                return null;
            }

            // Calculate stats from logs
            const wtsCount = logs.filter(l => l.trade_type === 'WTS').length;
            const wtbCount = logs.filter(l => l.trade_type === 'WTB').length;
            const totalVolume = logs.reduce((sum, l) => sum + (l.price || 0), 0);
            const avgPrice = totalVolume / logs.length;
            const uniqueItems = new Set(logs.map(l => l.item_name)).size;
            const totalTrades = logs.length;

            // Gamification Calculations
            const xp = totalTrades * XP_PER_TRADE;
            const levelData = LEVELS.find(l => totalTrades >= l.minTrades && totalTrades < l.maxTrades) || LEVELS[LEVELS.length - 1];

            // Rank Approximation (Fetch Top 50 to see if user is ranked)
            let rank = 0;
            try {
                const { data: topTraders } = await supabase.rpc('get_top_traders', { limit_count: 50 });
                if (topTraders) {
                    const foundIndex = topTraders.findIndex((t: any) => t.nick.toLowerCase() === nick.toLowerCase());
                    if (foundIndex !== -1) rank = foundIndex + 1;
                }
            } catch (e) {
                console.warn('Failed to fetch rank', e);
            }

            return {
                nick: nick,
                total: totalTrades,
                wts_count: wtsCount,
                wtb_count: wtbCount,
                avg_price: avgPrice,
                total_volume: totalVolume,
                unique_items: uniqueItems,
                first_seen: logs[logs.length - 1]?.trade_timestamp_utc || new Date().toISOString(),
                last_seen: logs[0]?.trade_timestamp_utc || new Date().toISOString(),
                favorite_items: [],
                pc_count: 0,
                fav_server: logs[0]?.server || 'Unknown',
                // New Gamification Fields
                xp: xp,
                level: levelData ? levelData.level : 1,
                rank_position: rank
            };
        } catch (error) {
            console.error('Error in getPlayerStatsAdvanced:', error);
            return null;
        }
    },

    getPlayerLogs: async (nick: string, limit: number = 50, offset: number = 0): Promise<PlayerLog[]> => {
        try {
            if (!supabase) {
                console.error('❌ Supabase client not initialized in getPlayerLogs');
                return [];
            }

            const { data, error } = await supabase
                .from('trade_logs')
                .select('*')
                .ilike('nick', nick)
                .order('trade_timestamp_utc', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching playerLogs:', error);
                return [];
            }

                        return (data || []).map(log => {
                // Client-side Fallback Parsing (if DB columns are missing)
                let finalItemName = log.item_name;
                let finalPrice = log.price;

                if (!finalItemName || finalItemName === 'Unknown') {
                    // Try to extract from message
                    const msg = log.message || '';
                    // Heuristic: remove price part
                    const cleaned = msg.replace(/\s*-\s*\d+[gsc].*$/i, '')
                                     .replace(/^\[\d+:\d+:\d+\]\s*/, '') // Remove timestamp if present
                                     .trim();
                    if (cleaned) finalItemName = cleaned;
                }

                return {
                    id: log.id,
                    nick: log.nick,
                    item_name: finalItemName || 'Unknown',
                    price: finalPrice || 0,
                    trade_type: log.trade_type || 'UNKNOWN',
                    server: log.server || 'Unknown',
                    trade_timestamp_utc: log.trade_timestamp_utc,
                    timestamp: log.trade_timestamp_utc, // Alias for compatibility
                    message: log.message || ''
                };
            });
        } catch (error) {
            console.error('Error in getPlayerLogs:', error);
            return [];
        }
    },

    getPlayerActivity: async (nick: string): Promise<ActivityPoint[]> => {
        // FALLBACK: Client-side aggregation to avoid persistent RPC 404/PGRST202 errors
        // Fetch raw logs for the last 90 days (limit 2000 to be safe on bandwidth)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        try {
            if (!supabase) {
                console.error('❌ Supabase client not initialized in getPlayerActivity');
                return [];
            }

            const { data, error } = await supabase
                .from('trade_logs')
                .select('trade_timestamp_utc')
                .ilike('nick', nick)
                .gte('trade_timestamp_utc', ninetyDaysAgo.toISOString())
                .limit(2000);

            if (error) {
                console.error('Error fetching player activity (client-side):', error);
                return [];
            }

            if (!data || data.length === 0) return [];

            // Client-side Grouping by Day
            const activityMap = new Map<string, number>();

            data.forEach(log => {
                const dateStr = new Date(log.trade_timestamp_utc).toISOString().split('T')[0]; // YYYY-MM-DD
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
            });

            // Convert map to array and sort
            const activityArray: ActivityPoint[] = Array.from(activityMap.entries()).map(([date, count]) => ({
                activity_date: date,
                trade_count: count
            }));

            return activityArray.sort((a, b) => a.activity_date.localeCompare(b.activity_date));

        } catch (err) {
            console.error("Unexpected error in getPlayerActivity client-fallback", err);
            return [];
        }
    },

    getTradeLogs: async (limit: number = 50000): Promise<any[]> => {
        if (!supabase) {
            console.error('❌ Supabase client not initialized in getTradeLogs');
            return [];
        }
        const { data, error } = await supabase.rpc('get_trade_logs_for_market', { limit_count: limit });
        if (error) { console.error('Error fetching trade logs:', error); return []; }
        return data || [];
    },

    getDbUsage: async (): Promise<DbUsageStats | null> => {
        if (!supabase) {
            console.error('❌ Supabase client not initialized in getDbUsage');
            return null;
        }
        const { data, error } = await supabase.rpc('get_db_usage');
        if (error) { console.error('Error fetching DB usage:', error); return null; }
        return data;
    },

    // --- REALTIME MARKET INTELLIGENCE (OPTIMIZED HYBRID) ---
    getMarketIntelligence: async (window: TimeWindow = '24h', localData?: MarketItem[]): Promise<MarketIntelligenceData> => {

        let demandMap = new Map<string, { vol: number, prices: number[], timestamps: number[], avgPrice: number, absChange: number }>();
        let supplyMap = new Map<string, { vol: number, prices: number[], timestamps: number[], avgPrice: number, absChange: number }>();

        // 1. Fetch SERVER-SIDE Aggregated Data (Optimized RPC)
        if (supabase) {
            try {
                let windowHours = 24;
                if (window === '4h') windowHours = 4;
                if (window === '12h') windowHours = 12;
                if (window === '7d') windowHours = 168;
                if (window === '30d') windowHours = 720;

                const { data: remoteData, error } = await supabase.rpc('get_market_trends_optimized', {
                    window_hours: windowHours
                });

                if (error) throw error;

                if (remoteData) {
                    remoteData.forEach((row: any) => {
                        const key = row.ql ? `${row.name} (${row.ql})` : row.name;
                        const item = {
                            vol: row.volume,
                            prices: [], // Pre-aggregated doesn't give array, but gives necessary stats
                            timestamps: [],
                            avgPrice: row.avg_price,
                            absChange: row.price_change || row.volatility // Use change or volat proxy
                        };

                        if (row.trade_type === 'WTB') demandMap.set(key, item);
                        else if (row.trade_type === 'WTS') supplyMap.set(key, item);
                    });
                }
            } catch (e) {
                console.warn("Failed to fetch optimized trends, falling back to local only or empty", e);
            }
        }

        // 2. Process LOCAL Data (Client-Side Aggregation) - Only if file exists
        if (localData && localData.length > 0) {
            const now = new Date();
            const cutoff = new Date();
            if (window === '4h') cutoff.setHours(now.getHours() - 4);
            else if (window === '12h') cutoff.setHours(now.getHours() - 12);
            else if (window === '7d') cutoff.setDate(now.getDate() - 7);
            else if (window === '30d') cutoff.setDate(now.getDate() - 30);
            else cutoff.setHours(now.getHours() - 24);

            const filteredLocal = localData.filter(item => {
                const ts = typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp;
                return ts > cutoff.getTime();
            });

            filteredLocal.forEach(item => {
                const qlBucket = item.quality ? `${Math.floor(item.quality / 10) * 10}ql+` : '';
                const key = qlBucket ? `${item.name} (${qlBucket})` : item.name;

                const processMap = (map: Map<string, any>, type: string) => {
                    const existing = map.get(key) || { vol: 0, prices: [], timestamps: [] };
                    existing.vol += 1;
                    existing.prices.push(item.price);

                    if (!map.has(key)) {
                        map.set(key, existing);
                    }
                };

                if (item.orderType === 'WTB') processMap(demandMap, 'WTB');
                if (item.orderType === 'WTS') processMap(supplyMap, 'WTS');
            });
        }

        // 3. Format Output
        const buildTrendItems = (map: Map<string, any>): MarketTrendItem[] => {
            return Array.from(map.entries())
                .filter(([name]) => {
                    const lower = name.toLowerCase();
                    if (lower === 'unknown' || lower.includes('unknown')) return false;
                    if (lower.startsWith('@') || lower.startsWith('!')) return false;
                    if (/^\d+$/.test(lower)) return false;
                    if (lower.length < 3) return false;
                    return true;
                })
                .map(([name, data]) => {
                    let finalAvg = data.avgPrice;
                    let finalPrice = data.avgPrice;
                    let change = data.absChange || 0;

                    if (data.prices && data.prices.length > 0) {
                        finalPrice = data.prices[data.prices.length - 1];
                        const localAvg = data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length;
                        if (!finalAvg) finalAvg = localAvg;
                    }

                    return {
                        name,
                        volume: data.vol,
                        price: finalPrice || 0,
                        avgPrice: finalAvg || 0,
                        absoluteChange: change,
                        change: 0
                    };
                });
        };

        const demandItems = buildTrendItems(demandMap).sort((a, b) => b.volume - a.volume).slice(0, 5);
        const supplyItems = buildTrendItems(supplyMap).sort((a, b) => b.volume - a.volume).slice(0, 5);
        const volatilityItems = [...supplyItems]
            .sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange))
            .slice(0, 5);

        return {
            topDemand: demandItems,
            topSupply: supplyItems,
            topVolatility: volatilityItems
        };
    },

    // --- SPARKLINE DATA ---
    getSparklineData: async (metric: 'volume' | 'count' | 'avg_price', hours: number = 24): Promise<number[]> => {
        const logs = await IntelligenceService.getTradeLogs(2000);
        const now = new Date();
        const cutoff = new Date();
        cutoff.setHours(now.getHours() - hours);
        const recentLogs = logs.filter(l => new Date(l.trade_timestamp_utc) > cutoff);

        const bucketCount = 20;
        const bucketDuration = (hours * 60 * 60 * 1000) / bucketCount;
        const buckets = new Array(bucketCount).fill(0);
        const counts = new Array(bucketCount).fill(0);

        const parseWurmPrice = (str: string): number => {
            let total = 0;
            const g = str.match(/(\d+)\s*g/i);
            const s = str.match(/(\d+)\s*s/i);
            const c = str.match(/(\d+)\s*c/i);
            const i = str.match(/(\d+)\s*i/i);
            if (g) total += parseInt(g[1]) * 10000;
            if (s) total += parseInt(s[1]) * 100;
            if (c) total += parseInt(c[1]);
            if (i) total += parseInt(i[1]);
            return total;
        };

        recentLogs.forEach(log => {
            const time = new Date(log.trade_timestamp_utc).getTime();
            const timeFromCutoff = time - cutoff.getTime();
            if (timeFromCutoff < 0) return;
            const bucketIndex = Math.floor(timeFromCutoff / bucketDuration);
            if (bucketIndex >= 0 && bucketIndex < bucketCount) {
                const price = parseWurmPrice(log.message);
                if (metric === 'volume') buckets[bucketIndex] += price;
                else if (metric === 'count') buckets[bucketIndex] += 1;
                else if (metric === 'avg_price') {
                    if (price > 0 && (log.trade_type === 'WTS' || log.trade_type === 'SOLD')) {
                        buckets[bucketIndex] += price;
                        counts[bucketIndex] += 1;
                    }
                }
            }
        });
        if (metric === 'avg_price') return buckets.map((total, i) => counts[i] > 0 ? total / counts[i] : 0);
        return buckets;
    },

    // --- ARBITRAGE OPPORTUNITIES (Optimized) ---
    getArbitrageOpportunities: async (): Promise<ArbitrageOpportunity[]> => {
        try {
            if (!supabase) {
                console.error('❌ Supabase client not initialized in getArbitrageOpportunities');
                return [];
            }

            const { data, error } = await supabase.rpc('get_arbitrage_opportunities_sql');
            if (error) throw error;

            if (data) {
                return data.map((row: any) => ({
                    name: row.item_name + (row.ql ? ` (${row.ql})` : ''),
                    wtbPrice: row.wtb_max,
                    wtsPrice: row.wts_min,
                    spread: row.spread,
                    potentialProfit: row.spread
                }));
            }
        } catch (e) {
            console.error("Optimized Arbitrage fetch failed", e);
        }
        return [];
    }
};
