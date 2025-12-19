import { supabase } from './supabase';
import { MarketItem } from '../types'; // Import MarketItem

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
}

export type TimeWindow = '4h' | '12h' | '24h' | '7d' | '30d';

// --- HELPERS ---

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

const extractQL = (msg: string): string => {
    const match = msg.match(/\b(\d+)\s*ql\b/i);
    if (match) {
        const ql = parseInt(match[1]);
        const bucket = Math.floor(ql / 10) * 10;
        return `${bucket}ql+`;
    }
    return '';
};

const extractItemName = (msg: string): string => {
    let clean = msg.replace(/\b(wts|wtb|selling|buying|sold)\b/gi, '').trim();
    clean = clean.replace(/\b(impure|shattered|unfinished|corroded|broken|damaged|rusty)\s+/gi, '');
    const parts = clean.split(/\s+(\d+([gsc]|ql))/i);
    return parts[0].trim();
};

export const IntelligenceService = {
    getGlobalStats: async (): Promise<GlobalStats | null> => {
        const { data, error } = await supabase.rpc('get_global_stats');
        if (error) { console.error('Error fetching global stats:', error); return null; }
        return data && data.length > 0 ? data[0] : null;
    },

    getTopTraders: async (limit: number = 10): Promise<TraderProfile[]> => {
        const { data, error } = await supabase.rpc('get_top_traders', { limit_count: limit });
        if (error) { console.error('Error fetching top traders:', error); return []; }
        return data || [];
    },

    getPlayerStats: async (nick: string): Promise<PlayerStats | null> => {
        const { data, error } = await supabase.rpc('get_player_stats', { player_nick: nick });
        if (error) { console.error('Error fetching player stats:', error); return null; }
        return data && data.length > 0 ? data[0] : null;
    },

    getPlayerStatsAdvanced: async (nick: string): Promise<PlayerStatsAdvanced | null> => {
        const { data, error } = await supabase.rpc('get_player_stats_v3', { target_nick: nick });
        if (error) { console.error('Error fetching advanced player stats:', error); return null; }
        return data && data.length > 0 ? data[0] : null;
    },

    getPlayerLogs: async (nick: string, limit: number = 50, offset: number = 0): Promise<PlayerLog[]> => {
        const { data, error } = await supabase.rpc('get_player_logs', { target_nick: nick, limit_count: limit, offset_count: offset });
        if (error) { console.error('Error fetching playerLogs:', error); return []; }
        return data || [];
    },

    getPlayerActivity: async (nick: string): Promise<ActivityPoint[]> => {
        const { data, error } = await supabase.rpc('get_player_activity_chart', { target_nick: nick });
        if (error) { console.error('Error fetching player activity:', error); return []; }
        return data || [];
    },

    getTradeLogs: async (limit: number = 50000): Promise<any[]> => {
        // If Supabase is down or user is offline, this might fail.
        // We should handle that gracefully in getMarketIntelligence if using local data.
        const { data, error } = await supabase.rpc('get_trade_logs_for_market', { limit_count: limit });
        if (error) { console.error('Error fetching trade logs:', error); return []; }
        return data || [];
    },

    getDbUsage: async (): Promise<DbUsageStats | null> => {
        const { data, error } = await supabase.rpc('get_db_usage');
        if (error) { console.error('Error fetching DB usage:', error); return null; }
        return data;
    },

    // --- REALTIME MARKET INTELLIGENCE (HYBRID) ---
    getMarketIntelligence: async (window: TimeWindow = '24h', localData?: MarketItem[]): Promise<MarketIntelligenceData> => {
        // 1. Fetch RAW logs (Remote)
        let logs: any[] = [];
        try {
            logs = await IntelligenceService.getTradeLogs(10000);
        } catch (e) {
            console.warn("Failed to fetch remote logs, falling back to local only");
        }
        
        // 2. Determine Time Cutoff
        const now = new Date();
        const cutoff = new Date();
        if (window === '4h') cutoff.setHours(now.getHours() - 4);
        else if (window === '12h') cutoff.setHours(now.getHours() - 12);
        else if (window === '7d') cutoff.setDate(now.getDate() - 7);
        else if (window === '30d') cutoff.setDate(now.getDate() - 30);
        else cutoff.setHours(now.getHours() - 24);

        const recentRemoteLogs = logs.filter(l => new Date(l.trade_timestamp_utc) > cutoff);

        // 3. Aggregate
        // We normalize both Remote and Local data into a common structure
        interface NormalizedData {
            name: string;
            ql: string;
            price: number;
            type: 'WTB' | 'WTS';
            timestamp: number;
        }

        const normalized: NormalizedData[] = [];

        // Process Remote
        recentRemoteLogs.forEach(log => {
            let baseName = extractItemName(log.message);
            if (baseName.length < 3) return;
            const ql = extractQL(log.message);
            const price = parseWurmPrice(log.message);
            const type = log.trade_type === 'WTB' ? 'WTB' : log.trade_type === 'WTS' ? 'WTS' : null;
            
            if (type && (price > 0 || type === 'WTB')) {
                 normalized.push({
                     name: baseName,
                     ql: ql,
                     price: price,
                     type: type,
                     timestamp: new Date(log.trade_timestamp_utc).getTime()
                 });
            }
        });

        // Process Local
        if (localData && localData.length > 0) {
            localData.forEach(item => {
                const ts = typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp;
                if (ts > cutoff.getTime()) {
                     const bucket = item.quality ? `${Math.floor(item.quality / 10) * 10}ql+` : '';
                     normalized.push({
                         name: item.name,
                         ql: bucket,
                         price: item.price, // already copper
                         type: item.orderType as 'WTB'|'WTS',
                         timestamp: ts
                     });
                }
            });
        }

        const demandMap = new Map<string, { vol: number, prices: number[], timestamps: number[] }>();
        const supplyMap = new Map<string, { vol: number, prices: number[], timestamps: number[] }>();

        normalized.forEach(item => {
            const key = item.ql ? `${item.name} (${item.ql})` : item.name;
            
            if (item.type === 'WTB') {
                const existing = demandMap.get(key) || { vol: 0, prices: [], timestamps: [] };
                existing.vol += 1;
                existing.prices.push(item.price);
                existing.timestamps.push(item.timestamp);
                demandMap.set(key, existing);
            } else if (item.type === 'WTS') {
                 const existing = supplyMap.get(key) || { vol: 0, prices: [], timestamps: [] };
                existing.vol += 1;
                existing.prices.push(item.price);
                existing.timestamps.push(item.timestamp);
                supplyMap.set(key, existing);
            }
        });

        // 4. Build Result Lists
        const buildTrendItems = (map: Map<string, any>): MarketTrendItem[] => {
            return Array.from(map.entries()).map(([name, data]) => {
                const sortedIndices = data.timestamps.map((t: number, i: number) => ({ t, i }))
                    .sort((a: any, b: any) => a.t - b.t);
                
                const oldestPrice = data.prices[sortedIndices[0].i];
                const latestPrice = data.prices[sortedIndices[sortedIndices.length - 1].i];
                const avgPrice = data.prices.reduce((a: number, b: number) => a + b, 0) / (data.prices.length || 1);
                
                return {
                    name,
                    volume: data.vol,
                    price: latestPrice,
                    avgPrice: avgPrice,
                    absoluteChange: latestPrice - oldestPrice,
                    change: oldestPrice > 0 ? ((latestPrice - oldestPrice) / oldestPrice) * 100 : 0
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

    // --- ARBITRAGE OPPORTUNITIES ---
    getArbitrageOpportunities: async (): Promise<ArbitrageOpportunity[]> => {
        const logs = await IntelligenceService.getTradeLogs(5000);
        const now = new Date();
        const cutoff = new Date();
        cutoff.setHours(now.getHours() - 24);

        const recentLogs = logs.filter(l => new Date(l.trade_timestamp_utc) > cutoff);

        const demandMap = new Map<string, number[]>(); // Name -> Prices[]
        const supplyMap = new Map<string, number[]>(); // Name -> Prices[]

        recentLogs.forEach(log => {
            let baseName = extractItemName(log.message);
            if (baseName.length < 3) return;
            const ql = extractQL(log.message);
            const key = ql ? `${baseName} (${ql})` : baseName;
            const price = parseWurmPrice(log.message);
            if (price === 0) return;

            if (log.trade_type === 'WTB') {
                const prices = demandMap.get(key) || [];
                prices.push(price);
                demandMap.set(key, prices);
            } else if (log.trade_type === 'WTS') {
                const prices = supplyMap.get(key) || [];
                prices.push(price);
                supplyMap.set(key, prices);
            }
        });

        const opportunities: ArbitrageOpportunity[] = [];

        demandMap.forEach((buyPrices, name) => {
            if (supplyMap.has(name)) {
                const sellPrices = supplyMap.get(name) || [];
                const maxWTB = Math.max(...buyPrices);
                const minWTS = Math.min(...sellPrices);
                
                if (maxWTB > minWTS) {
                    const spread = maxWTB - minWTS;
                    opportunities.push({
                        name,
                        wtbPrice: maxWTB,
                        wtsPrice: minWTS,
                        spread: spread,
                        potentialProfit: spread
                    });
                }
            }
        });

        return opportunities.sort((a, b) => b.spread - a.spread);
    }
};
