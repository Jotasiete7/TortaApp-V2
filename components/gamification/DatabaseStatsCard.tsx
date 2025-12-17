import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, Calendar, HardDrive } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface DatabaseStats {
    totalTrades: number;
    databaseSizeMB: number;
    growthRate: number;
    estimatedDaysToMilestone: number;
    nextMilestone: number;
}

export const DatabaseStatsCard: React.FC = () => {
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDatabaseStats();
        const interval = setInterval(fetchDatabaseStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchDatabaseStats = async () => {
        try {
            const { count: totalTrades } = await supabase
                .from('trade_logs')
                .select('*', { count: 'exact', head: true });

            const databaseSizeMB = ((totalTrades || 0) * 250) / (1024 * 1024);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: recentTrades } = await supabase
                .from('trade_logs')
                .select('*', { count: 'exact', head: true })
                .gte('trade_timestamp_utc', sevenDaysAgo.toISOString());

            const growthRate = Math.round((recentTrades || 0) / 7);

            const milestones = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];
            const nextMilestone = milestones.find(m => m > (totalTrades || 0)) || 10000000;
            const tradesToMilestone = nextMilestone - (totalTrades || 0);
            const estimatedDaysToMilestone = growthRate > 0 ? Math.ceil(tradesToMilestone / growthRate) : 999;

            setStats({ totalTrades: totalTrades || 0, databaseSizeMB, growthRate, estimatedDaysToMilestone, nextMilestone });
        } catch (error) {
            console.error('Failed to fetch database stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatSize = (mb: number) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
        return `${mb.toFixed(2)} MB`;
    };

    if (loading) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                    <Database className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Database Growth</h3>
                    <p className="text-xs text-slate-400">Real-time statistics</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Trades</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">{formatNumber(stats.totalTrades)}</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <HardDrive className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Size</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">{formatSize(stats.databaseSizeMB)}</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Growth Rate</span>
                    </div>
                    <p className="text-lg font-bold text-white font-mono">{stats.growthRate}/day</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Next Milestone</span>
                    </div>
                    <p className="text-lg font-bold text-cyan-400 font-mono">{formatNumber(stats.nextMilestone)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                        ~{stats.estimatedDaysToMilestone > 365 ? '1y+' : `${stats.estimatedDaysToMilestone}d`}
                    </p>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress to {formatNumber(stats.nextMilestone)}</span>
                    <span>{Math.round((stats.totalTrades / stats.nextMilestone) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000"
                        style={{ width: `${Math.min(100, (stats.totalTrades / stats.nextMilestone) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
