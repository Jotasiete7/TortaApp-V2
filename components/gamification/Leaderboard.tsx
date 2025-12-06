import React, { useState, useEffect } from 'react';
import { Trophy, ShoppingBag, ShoppingCart, Search, Calendar, ChevronDown } from 'lucide-react';
import { RankingsService, MostActiveTrader, ActiveSeller, ActiveBuyer, PriceChecker, TimePeriod } from '../../services/rankings';

// ==================== SUB-COMPONENTS ====================

const RankingCard = ({ title, icon: Icon, children, color }: any) => (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col h-full`}>
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="flex-1 space-y-3">
            {children}
        </div>
    </div>
);

const RankItem = ({ rank, nick, value, subValue, badge }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                    rank === 2 ? 'bg-slate-400/20 text-slate-400 border border-slate-400/50' :
                        rank === 3 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/50' :
                            'bg-slate-800 text-slate-500'}
            `}>
                {rank}
            </div>
            <div>
                <span className="text-white font-medium block">{nick}</span>
                {badge && <span className="text-xs text-slate-500">{badge}</span>}
            </div>
        </div>
        <div className="text-right">
            <span className="block text-white font-bold">{value}</span>
            {subValue && <span className="text-xs text-slate-500">{subValue}</span>}
        </div>
    </div>
);

// ==================== MAIN COMPONENT ====================

export const Leaderboard = () => {
    const [activeTraders, setActiveTraders] = useState<MostActiveTrader[]>([]);
    const [activeSellers, setActiveSellers] = useState<ActiveSeller[]>([]);
    const [activeBuyers, setActiveBuyers] = useState<ActiveBuyer[]>([]);
    const [priceCheckers, setPriceCheckers] = useState<PriceChecker[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<TimePeriod>('all_time');

    useEffect(() => {
        loadRankings();
    }, [period]);

    const loadRankings = async () => {
        setLoading(true);
        try {
            const [traders, sellers, buyers, checkers] = await Promise.all([
                RankingsService.getMostActiveTraders(5, period),
                RankingsService.getMostActiveSellers(5),
                RankingsService.getMostActiveBuyers(5),
                RankingsService.getTopPriceCheckers(5)
            ]);

            setActiveTraders(traders);
            setActiveSellers(sellers);
            setActiveBuyers(buyers);
            setPriceCheckers(checkers);
        } catch (error) {
            console.error("Failed to load rankings", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-500">Loading rankings...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Filters */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Market Leaderboards
                    </h2>
                    <p className="text-slate-400">Top traders and community contributors</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    {(['all_time', 'monthly', 'weekly'] as TimePeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`
                                px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                                ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}
                            `}
                        >
                            {p.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Most Active Traders */}
                <RankingCard title="Most Active Traders" icon={Trophy} color="yellow">
                    {activeTraders.map((t, index) => (
                        <RankItem
                            key={`${t.nick}-${index}`}
                            rank={t.rank}
                            nick={t.nick}
                            value={t.wts_count}
                            subValue="WTS Posts"
                            badge="🔥 Trader"
                        />
                    ))}
                </RankingCard>

                {/* 2. Top Sellers */}
                <RankingCard title="Top Sellers (Month)" icon={ShoppingBag} color="emerald">
                    {activeSellers.map((s, index) => (
                        <RankItem
                            key={`${s.nick}-${index}`}
                            rank={s.rank}
                            nick={s.nick}
                            value={s.wts_count}
                            subValue="Listings"
                            badge="📦 Merchant"
                        />
                    ))}
                </RankingCard>

                {/* 3. Top Buyers */}
                <RankingCard title="Top Buyers (Month)" icon={ShoppingCart} color="blue">
                    {activeBuyers.map((b, index) => (
                        <RankItem
                            key={`${b.nick}-${index}`}
                            rank={b.rank}
                            nick={b.nick}
                            value={b.wtb_count}
                            subValue="Requests"
                            badge="💰 Investor"
                        />
                    ))}
                </RankingCard>

                {/* 4. Price Checkers */}
                <RankingCard title="Top Appraisers (Week)" icon={Search} color="purple">
                    {priceCheckers.map((pc, index) => (
                        <RankItem
                            key={`${pc.nick}-${index}`}
                            rank={pc.rank}
                            nick={pc.nick}
                            value={pc.pc_count}
                            subValue="Checks"
                            badge="🔍 Expert"
                        />
                    ))}
                </RankingCard>

            </div>
        </div>
    );
};
