
import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import { ChartDataPoint, MarketItem } from '../types';
import { getDistinctItems, getItemHistory, getPriceDistribution } from '../services/dataUtils';
import { formatWurmPrice } from '../services/priceUtils';
import { Search, BarChart2, TrendingUp } from 'lucide-react';

interface ChartsViewProps {
  data: ChartDataPoint[]; // Legacy prop, kept for compatibility but unused
  rawItems?: MarketItem[]; // Added raw items for detailed analysis
}

export const ChartsView: React.FC<ChartsViewProps> = ({ rawItems = [] }) => {
  const [selectedItem, setSelectedItem] = useState<string>('');
  
  const distinctItems = useMemo(() => getDistinctItems(rawItems), [rawItems]);

  // Set default item if none selected and items exist
  useMemo(() => {
      if (!selectedItem && distinctItems.length > 0) {
          // Try to find a common item to start with, or just the first one
          const common = distinctItems.find(i => i.includes('brick') || i.includes('iron'));
          setSelectedItem(common || distinctItems[0]);
      }
  }, [distinctItems]);

  const historyData = useMemo(() => {
      if (!selectedItem) return [];
      return getItemHistory(rawItems, selectedItem);
  }, [selectedItem, rawItems]);

  const distributionData = useMemo(() => {
      if (!selectedItem) return [];
      return getPriceDistribution(rawItems, selectedItem);
  }, [selectedItem, rawItems]);

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                  <p className="text-slate-400 font-mono mb-2">{label}</p>
                  {payload.map((entry: any) => (
                      <div key={entry.name} className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-slate-300">{entry.name}:</span>
                          <span className="font-mono text-white">
                              {entry.name.includes('Price') ? formatWurmPrice(entry.value) : entry.value}
                          </span>
                      </div>
                  ))}
              </div>
          );
      }
      return null;
  };

  if (rawItems.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
              <BarChart2 className="w-16 h-16 opacity-20 mb-4" />
              <p>No market data loaded. Please upload a log file first.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <TrendingUp className="text-amber-500 w-6 h-6" />
               Market Trends
           </h2>
           <p className="text-slate-400 text-sm">Analyze price history and supply distribution per item.</p>
        </div>
        
        <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
                 list="chart-items" 
                 type="text"
                 placeholder="Select Item to Analyze..."
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                 value={selectedItem}
                 onChange={(e) => setSelectedItem(e.target.value)}
             />
             <datalist id="chart-items">
                 {distinctItems.map(item => <option key={item} value={item} />)}
             </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Price Trend Chart */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="mb-6 flex justify-between items-end">
            <div>
                <h3 className="text-lg font-semibold text-white capitalize">{selectedItem} History</h3>
                <p className="text-sm text-slate-400">Unit Price evolution over time</p>
            </div>
            {historyData.length > 0 && (
                 <div className="text-right">
                     <p className="text-xs text-slate-500">Latest Avg</p>
                     <p className="text-xl font-mono text-emerald-400">
                         {formatWurmPrice(historyData[historyData.length - 1].avgPrice)}
                     </p>
                 </div>
            )}
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historyData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} minTickGap={30} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 10}} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area 
                    type="monotone" 
                    dataKey="avgPrice" 
                    name="Avg Price" 
                    stroke="#f59e0b" 
                    fill="url(#colorAvg)" 
                    strokeWidth={2}
                />
                <Line 
                    type="monotone" 
                    dataKey="minPrice" 
                    name="Min Price" 
                    stroke="#10b981" 
                    strokeWidth={1} 
                    dot={false} 
                    strokeDasharray="5 5" 
                />
                <Bar dataKey="volume" name="Daily Volume" barSize={20} fill="#3b82f6" opacity={0.3} yAxisId={0} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Distribution (Histogram) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Price Cluster</h3>
            <p className="text-sm text-slate-400">Where are most sales happening?</p>
          </div>
          <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={distributionData} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                     <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 10}} />
                     <YAxis dataKey="range" type="category" stroke="#94a3b8" tick={{fontSize: 10}} width={70} />
                     <Tooltip 
                        cursor={{fill: '#334155', opacity: 0.2}}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                     />
                     <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Trades" />
                 </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
