
import React, { useRef, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Database, DollarSign, Cpu, Upload, Loader2 } from 'lucide-react';
import { MarketItem, Language } from '../types';
import { translations } from '../services/i18n';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
}

interface DashboardProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  progress: number; // Added progress prop
  marketData: MarketItem[];
  language: Language;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
    {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ onFileUpload, isProcessing, progress, marketData, language }) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  // Dynamic calculations based on REAL data
  const stats = useMemo(() => {
    if (!marketData || marketData.length === 0) {
        return {
            totalVolume: 0,
            count: 0,
            avgPrice: 0,
            wtsCount: 0,
            wtbCount: 0
        };
    }

    const count = marketData.length;
    let totalVolume = 0;
    let totalPrice = 0;
    let wtsCount = 0;
    let wtbCount = 0;

    marketData.forEach(item => {
        totalVolume += item.price;
        totalPrice += item.price;
        if (item.orderType === 'WTS') wtsCount++;
        if (item.orderType === 'WTB') wtbCount++;
    });

    const avgPrice = count > 0 ? totalPrice / count : 0;

    return {
        totalVolume,
        count,
        avgPrice,
        wtsCount,
        wtbCount
    };
  }, [marketData]);

  const formatPrice = (c: number) => {
      if (c === 0) return "0c";
      if (c >= 10000) return `${(c/10000).toFixed(1)}g`;
      if (c >= 100) return `${(c/100).toFixed(1)}s`;
      return `${c.toFixed(0)}c`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.dashboardOverview}</h1>
          <p className="text-slate-400 mt-1">{t.realTimeStats}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className={`w-2 h-2 rounded-full ${marketData.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
          {marketData.length > 0 ? t.dataLoaded : t.awaitingData}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.totalVolume}
          value={formatPrice(stats.totalVolume)}
          subValue="Aggregate value of all listings"
          icon={Activity}
          color="amber"
        />
        <StatCard 
          title={t.itemsIndexed}
          value={stats.count.toLocaleString()} 
          subValue={`${stats.wtsCount} WTS / ${stats.wtbCount} WTB`}
          icon={Database}
          color="blue"
        />
        <StatCard 
          title={t.avgPrice}
          value={formatPrice(stats.avgPrice)}
          subValue="Across all rarities"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard 
          title={t.systemStatus}
          value={marketData.length > 0 ? t.active : t.idle}
          subValue={marketData.length > 0 ? t.mlReady : t.noData}
          icon={Cpu}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t.recentLogs}</h3>
          <div className="space-y-4">
            {marketData.length > 0 ? (
                <>
                    <div className="flex items-start gap-3 text-sm">
                        <span className="text-slate-500 font-mono">NOW</span>
                        <span className="text-emerald-400">Successfully indexed {marketData.length} records.</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <span className="text-slate-500 font-mono">NOW</span>
                        <span className="text-blue-400">Analytics Engine ready for queries.</span>
                    </div>
                </>
            ) : (
                <div className="flex items-start gap-3 text-sm">
                    <span className="text-slate-500 font-mono">--:--</span>
                    <span className="text-amber-400">Waiting for user input file...</span>
                </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t.quickActions}</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.csv,.log"
              className="hidden"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-1 relative z-10">
                <div className="font-medium text-white">
                  {isProcessing ? t.processing : t.uploadDump}
                </div>
                {isProcessing ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400 group-hover:text-white" />}
              </div>
              <div className="text-xs text-slate-400 relative z-10">
                {isProcessing ? `${progress}% complete` : t.uploadHint}
              </div>
              
              {/* Progress Bar Background */}
              {isProcessing && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
              )}
            </button>

            <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all opacity-50 cursor-not-allowed">
              <div className="font-medium text-white mb-1">Run Predictions</div>
              <div className="text-xs text-slate-400">Requires Loaded Data</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
