
import React from 'react';
import { LayoutDashboard, ShoppingCart, BarChart2, BrainCircuit, Settings, PieChart, BadgeDollarSign } from 'lucide-react';
import { ViewState, Language } from '../types';
import { translations } from '../services/i18n';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, language }) => {
  const t = translations[language];

  const navItems = [
    { id: ViewState.DASHBOARD, label: t.overview, icon: LayoutDashboard },
    { id: ViewState.MARKET, label: t.tradeMaster, icon: ShoppingCart },
    { id: ViewState.ANALYTICS, label: t.chartsEngine, icon: BarChart2 },
    { id: ViewState.PREDICTOR, label: t.mlPredictor, icon: BrainCircuit },
    { id: ViewState.PRICEMANAGER, label: t.priceManager, icon: BadgeDollarSign },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/20">
          <PieChart className="text-white w-5 h-5" />
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button 
          onClick={() => onNavigate(ViewState.SETTINGS)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === ViewState.SETTINGS ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">{t.settings}</span>
        </button>
        <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-600 font-mono">v2.2.0 (SuperPy Port)</span>
        </div>
      </div>
    </div>
  );
};
