import React, { useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, BarChart3, Brain, Briefcase, Settings, Shield, DollarSign } from 'lucide-react';
import { ViewState, Language } from '../../types';
import { translations } from '../../services/i18n';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, language }) => {
    const t = translations[language];

    const menuItems = useMemo(() => [
        { id: ViewState.DASHBOARD, label: t.overview, icon: LayoutDashboard },
        { id: ViewState.MARKET, label: t.tradeMaster, icon: ShoppingCart },
        { id: ViewState.ANALYTICS, label: t.chartsEngine, icon: BarChart3 },
        { id: ViewState.PREDICTOR, label: t.mlPredictor, icon: Brain },
        { id: ViewState.SERVICES, label: 'Services', icon: Briefcase },
    ], [t]);

    const adminItems = useMemo(() => [
        { id: ViewState.ADMIN, label: 'Admin Panel', icon: Shield },
        { id: ViewState.PRICEMANAGER, label: 'Price Manager', icon: DollarSign },
    ], []);

    const MenuItem = ({ item }: { item: { id: ViewState; label: string; icon: LucideIcon } }) => {
        const isActive = currentView === item.id;
        const Icon = item.icon;

        return (
            <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all relative group ${isActive
                    ? 'text-white bg-slate-900' // Active: Darker bg + White text
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
            >
                {/* Active Indicator Bar */}
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-sm shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}

                {/* Icon */}
                <Icon
                    size={20}
                    className={`transition-colors ${isActive
                        ? 'text-indigo-400 drop-shadow-sm'
                        : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                    strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Label */}
                <span className={isActive ? 'font-semibold tracking-wide' : ''}>
                    {item.label}
                </span>
            </button>
        );
    };

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 pt-10">
            {/* Logo Area - VISUALLY BALANCED */}
            <div className="px-6 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0 border border-white/10">
                    <span className="text-2xl drop-shadow-md">🥧</span>
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-0.5">Torta App</h1>
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold opacity-90">Analytics</span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto px-0 space-y-8">
                <div>
                    <div className="px-6 mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold flex items-center gap-2">
                            Analytics Module {/* <div className="h-px bg-slate-800 flex-1"></div> */}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {menuItems.map((item) => (
                            <MenuItem key={item.id} item={item} />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="px-6 mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Administration</span>
                    </div>
                    <div className="space-y-0.5">
                        {adminItems.map((item) => (
                            <MenuItem key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-900 bg-slate-950 space-y-2">
                <button
                    onClick={() => onNavigate(ViewState.SETTINGS)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === ViewState.SETTINGS
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                >
                    <Settings size={18} />
                    <span className="font-medium text-sm">{t.settings}</span>
                </button>

                <a
                    href="https://www.patreon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-amber-500 transition-all group"
                >
                    <span className="text-lg grayscale group-hover:grayscale-0 transition-all">💳</span>
                    <span className="font-medium text-sm">Patreon</span>
                </a>
            </div>
        </div>
    );
};
