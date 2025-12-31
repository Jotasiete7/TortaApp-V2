
import React, { useMemo } from 'react';
import { calculateMarketHealth } from '../../services/marketHealthCalculator';
import { MarketItem } from '../../types';
import { Activity, TrendingUp, TrendingDown, Target, Shield, AlertTriangle } from 'lucide-react';
import { useChartsTranslation } from '../../services/chartsTranslations';

interface MarketHealthDashboardProps {
    rawData: MarketItem[];
    itemName?: string; // Optional: specific item analysis
}

/**
 * MarketHealthDashboard
 * Visualizes the 0-100 Market Stability Index (MSI).
 * Shows "Thriving", "Healthy", "Stable", "Poor", "Critical" states.
 */
export const MarketHealthDashboard: React.FC<MarketHealthDashboardProps> = ({ rawData, itemName }) => {
    const { t } = useChartsTranslation();

    const metrics = useMemo(() => {
        // If no specific item is selected, we could calculate a global market index (avg of top 50?)
        // For MVP, we only show this if an item is selected, or show a placeholder.
        if (!itemName) return null;
        return calculateMarketHealth(rawData, itemName);
    }, [rawData, itemName]);

    if (!itemName || !metrics) {
        return (
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 text-center animate-fade-in">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-400">Select an item to analyze Market Health</h3>
            </div>
        );
    }

    const { msi, health, liquidityScore, stabilityScore, reliabilityScore, trend } = metrics;

    let color = 'text-emerald-500';
    let bgColor = 'bg-emerald-500/10';
    let borderColor = 'border-emerald-500/20';

    if (health === 'Thriving') { color = 'text-purple-400'; bgColor = 'bg-purple-500/20'; borderColor = 'border-purple-500/30'; }
    if (health === 'Healthy') { color = 'text-emerald-400'; bgColor = 'bg-emerald-500/20'; borderColor = 'border-emerald-500/30'; }
    if (health === 'Stable') { color = 'text-blue-400'; bgColor = 'bg-blue-500/20'; borderColor = 'border-blue-500/30'; }
    if (health === 'Poor') { color = 'text-amber-400'; bgColor = 'bg-amber-500/20'; borderColor = 'border-amber-500/30'; }
    if (health === 'Critical') { color = 'text-red-400'; bgColor = 'bg-red-500/20'; borderColor = 'border-red-500/30'; }

    return (
        <div className={`rounded-xl border ${borderColor} ${bgColor} p-6 mb-6 animate-fade-in relative overflow-hidden backdrop-blur-sm`}>
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${bgColor} rounded-full blur-3xl opacity-30`} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                {/* Main Score */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * msi) / 100}
                                className={`${color} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className={`text-2xl font-bold ${color}`}>{msi}</span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest">MSI</span>
                        </div>
                    </div>

                    <div>
                        <h3 className={`text-2xl font-bold ${color} flex items-center gap-2`}>
                            {health} Market
                            {health === 'Critical' && <AlertTriangle className="w-5 h-5 animate-pulse" />}
                        </h3>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            {itemName} is currently {trend}
                            {trend === 'improving' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                                trend === 'deteriorating' ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                                    <Activity className="w-4 h-4 text-blue-500" />}
                        </p>
                    </div>
                </div>

                {/* Metrics Grid (Composite Index) */}
                <div className="flex-1 w-full md:w-auto grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
                    <MetricPill label="Liquidity" value={liquidityScore} icon={<Activity className="w-4 h-4" />} />
                    <MetricPill label="Stability" value={stabilityScore} icon={<Shield className="w-4 h-4" />} />
                    <MetricPill label="Reliability" value={reliabilityScore} icon={<Target className="w-4 h-4" />} />
                </div>
            </div>
        </div>
    );
};

const MetricPill = ({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) => {
    // calculate color based on value 0-100
    let color = 'bg-slate-700 text-slate-300';
    if (value >= 80) color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    else if (value >= 50) color = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    else if (value >= 20) color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    else color = 'bg-red-500/20 text-red-400 border-red-500/30';

    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${color} border-opacity-50 transition-all hover:bg-opacity-30`}>
            <div className="flex items-center gap-1 mb-1 opacity-80">
                {icon}
                <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
            </div>
            <span className="text-xl font-mono font-bold">{Math.round(value)}</span>
        </div>
    );
};
