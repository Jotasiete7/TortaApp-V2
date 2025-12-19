import React, { useEffect, useState } from 'react';
import { Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { IntelligenceService, ArbitrageOpportunity } from '../../services/intelligence';
import { formatWurmPrice } from '../../services/priceUtils';
import { ViewState } from '../../types';

export const ArbitrageWidget = ({ onNavigate }: { onNavigate: (view: ViewState) => void }) => {
    const [opps, setOpps] = useState<ArbitrageOpportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        
        const checkArbitrage = async () => {
            try {
                // Poll for opportunities
                const results = await IntelligenceService.getArbitrageOpportunities();
                if (mounted) {
                    setOpps(results);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Arbitrage check failed", e);
            }
        };

        checkArbitrage();
        // Poll every 60 seconds? Or just once on mount?
        // Realtime updates would be better, but polling is safer for now.
        const interval = setInterval(checkArbitrage, 30000); 

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // Standard "Link" view if no opportunities
    if (opps.length === 0) {
        return (
            <button 
                onClick={() => onNavigate(ViewState.MARKET)}
                className="w-full py-2 bg-slate-800/50 hover:bg-slate-700 text-xs font-medium text-slate-400 hover:text-white transition-colors border-t border-slate-700/50 flex items-center justify-center gap-1 group"
            >
                View Full Analysis
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
        );
    }

    // "Alert" view if opportunities exist
    const topOpp = opps[0];

    return (
        <div className="border-t border-slate-700/50 bg-amber-500/10 p-3 animate-in slide-in-from-bottom-2 fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        Arbitrage Alert <Zap size={10} className="fill-amber-500" />
                    </h4>
                </div>
                <span className="text-[10px] text-amber-400/80 font-mono">
                    {opps.length} Active
                </span>
            </div>

            <div 
                onClick={() => onNavigate(ViewState.MARKET)}
                className="bg-slate-900/50 rounded p-2 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer group transition-colors"
                title={`Potential Profit: ${formatWurmPrice(topOpp.potentialProfit)}`}
            >
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-amber-200 truncate pr-2">
                        {topOpp.name}
                    </span>
                    <div className="flex items-center gap-1 bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                        +<span dangerouslySetInnerHTML={{ __html: formatWurmPrice(topOpp.potentialProfit) }} />
                    </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="text-cyan-400">Buy:</span>
                        <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(topOpp.wtsPrice) }} /> 
                        {/* WTS is what we BUY from */}
                    </div>
                    <ArrowRight size={10} className="text-slate-600" />
                    <div className="flex items-center gap-1">
                        <span className="text-amber-400">Sell:</span>
                        <span dangerouslySetInnerHTML={{ __html: formatWurmPrice(topOpp.wtbPrice) }} />
                        {/* WTB is what we SELL to */}
                    </div>
                </div>
            </div>
            
             <button 
                onClick={() => onNavigate(ViewState.MARKET)}
                className="w-full mt-2 text-[10px] text-amber-500/50 hover:text-amber-400 text-center hover:underline"
            >
                View all {opps.length} opportunities
            </button>
        </div>
    );
};
