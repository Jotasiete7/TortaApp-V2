
import React from 'react';
import { LayoutDashboard, ShoppingCart, BarChart2, BrainCircuit, Settings, BadgeDollarSign, Shield } from 'lucide-react';
import { ViewState, Language } from '../../types';
import { translations } from '../../services/i18n';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, language }) => {
    const t = translations[language];
    const { role } = useAuth();

    const navItems = [
        { id: ViewState.DASHBOARD, label: t.overview, icon: LayoutDashboard },
        { id: ViewState.MARKET, label: t.tradeMaster, icon: ShoppingCart },
        { id: ViewState.ANALYTICS, label: t.chartsEngine, icon: BarChart2 },
        { id: ViewState.PREDICTOR, label: t.mlPredictor, icon: BrainCircuit },
    ];

    const isAdmin = role === 'admin' || role === 'moderator';

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
            <div className="p-6 flex items-center gap-3 mt-8">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/5 shadow-lg shadow-amber-900/20">
                    <img src="/logo.png" alt="Torta Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                    <span className="block text-xl font-bold text-white tracking-tight leading-none">Torta App</span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Analytics</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 pt-2">
                    {t.analyticsModule}
                </div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}

                {/* Admin Panel - Only for admin/moderator */}
                {isAdmin && (
                    <>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 pt-4">
                            Administration
                        </div>
                        <button
                            onClick={() => onNavigate(ViewState.ADMIN)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${currentView === ViewState.ADMIN
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Shield className={`w-5 h-5 ${currentView === ViewState.ADMIN ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">Admin Panel</span>
                        </button>
                        <button
                            onClick={() => onNavigate(ViewState.PRICEMANAGER)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${currentView === ViewState.PRICEMANAGER
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <BadgeDollarSign className={`w-5 h-5 ${currentView === ViewState.PRICEMANAGER ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">Price Manager</span>
                        </button>
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button
                    onClick={() => onNavigate(ViewState.SETTINGS)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.SETTINGS ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{t.settings}</span>
                </button>
                <div className="mt-4 text-center">
                    <span className="text-[10px] text-slate-600 font-mono">v3.0.0 (Auth + Ticker)</span>
                </div>
            </div>
        </div>
    );
};
