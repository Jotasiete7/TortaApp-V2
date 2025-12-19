import React, { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { LayoutDashboard, ShoppingCart, BarChart2, BrainCircuit, Settings, BadgeDollarSign, Shield, RefreshCw } from 'lucide-react';
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
    const [progress, setProgress] = useState(0);

    // Cooldown Animation Effect
    useEffect(() => {
        const duration = 60000; // 60 seconds sync cycle
        const interval = 100;
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { id: ViewState.DASHBOARD, label: t.overview, icon: LayoutDashboard },
        { id: ViewState.MARKET, label: t.tradeMaster, icon: ShoppingCart },
        { id: ViewState.ANALYTICS, label: t.chartsEngine, icon: BarChart2 },
        { id: ViewState.PREDICTOR, label: t.mlPredictor, icon: BrainCircuit },
    ];

    const isAdmin = role === 'admin' || role === 'moderator';

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 pt-12">
            <div className="p-6 flex items-center gap-3">
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-500 border-l-4 border-amber-500 shadow-[inset_10px_0_20px_-10px_rgba(245,158,11,0.2)]'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent'
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 group relative overflow-hidden ${currentView === ViewState.ADMIN
                                ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-purple-400 border-l-4 border-purple-500 shadow-[inset_10px_0_20px_-10px_rgba(168,85,247,0.2)]'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent'
                                }`}
                        >
                            <Shield className={`w-5 h-5 ${currentView === ViewState.ADMIN ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">Admin Panel</span>
                        </button>
                        <button
                            onClick={() => onNavigate(ViewState.PRICEMANAGER)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 group relative overflow-hidden ${currentView === ViewState.PRICEMANAGER
                                ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-purple-400 border-l-4 border-purple-500 shadow-[inset_10px_0_20px_-10px_rgba(168,85,247,0.2)]'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent'
                                }`}
                        >
                            <BadgeDollarSign className={`w-5 h-5 ${currentView === ViewState.PRICEMANAGER ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">Price Manager</span>
                        </button>
                    </>
                )}
            </nav>

            {/* STATUS / COOLDOWN BAR */}
            <div className="px-6 mb-4">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">
                    <span>Next Sync</span>
                    <span>{Math.round((100 - progress) / 100 * 60)}s</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-slate-600 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button
                    onClick={() => onNavigate(ViewState.SETTINGS)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === ViewState.SETTINGS ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{t.settings}</span>
                </button>
                <button onClick={() => open("https://www.patreon.com/c/tortawurmapp?vanity=user")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:text-[#ff424d] hover:bg-[#ff424d]/10 mb-2 text-left">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z" /></svg>
                    </div>
                    <span className="font-medium">Patreon</span>
                </button>
            </div>
        </div>
    );
};
