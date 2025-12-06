
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Coins, ShoppingBag, Tag, ThumbsUp, ThumbsDown, BookOpen, Layers } from 'lucide-react';
import { MarketItem } from '../types';
import { evaluateTrade, formatWurmPrice, findClosestReference } from '../services/priceUtils';
import { SearchEngine } from '../services/searchEngine';
import { useMarketSearch } from '../hooks/useMarketSearch';

interface MarketTableProps {
  data: MarketItem[];
  referencePrices: Record<string, number>;
  searchEngine: SearchEngine | null; // Receive search engine
}

const ITEMS_PER_PAGE = 50;

const PriceDisplay = ({ copperVal }: { copperVal: number }) => {
    const formatted = formatWurmPrice(copperVal);
    // DEBUG FALLBACK: If value > 0 but format returns 0c, show raw
    if (copperVal > 0 && formatted === '0c') {
         return (
             <span className="font-mono text-xs text-rose-400" title="Format Error">
                 {copperVal.toFixed(4)}c
             </span>
         )
    }

    return (
        <span className="font-mono text-sm whitespace-nowrap">
            <span dangerouslySetInnerHTML={{ __html: formatted.replace(/([0-9]+)([gsc])/g, '<span class="value">$1</span><span class="unit">$2</span>').replace(/(\d+)g/, '<span class="text-yellow-500 font-bold">$1g</span>').replace(/(\d+)s/, '<span class="text-slate-300 font-medium">$1s</span>').replace(/(\d+)c/, '<span class="text-orange-400">$1c</span>').replace(/(\d+)i/, '<span class="text-slate-500 text-xs">$1i</span>') }} />
        </span>
    );
};

const BulkPriceDisplay = ({ unitPrice }: { unitPrice: number }) => {
    const price1k = unitPrice * 1000;
    // Show 1k price if unit price is less than 1 copper
    const showBulk = unitPrice < 1; 

    return (
        <div className="flex flex-col items-start">
            <PriceDisplay copperVal={unitPrice} />
            {showBulk && (
                <span className="text-[10px] text-slate-500 font-mono">
                    ({formatWurmPrice(price1k)}/1k)
                </span>
            )}
        </div>
    );
};

export const MarketTable: React.FC<MarketTableProps> = ({ data, referencePrices, searchEngine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof MarketItem>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRarity, filterType]);

  const handleSort = (field: keyof MarketItem) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // 1. ADVANCED SEARCH PHASE
  // Uses the hook to combine Index Search + Structured Queries (ql>90)
  const searchResults = useMarketSearch({
      data,
      searchEngine,
      searchText: searchTerm
  });

  // 2. FILTER & SORT PHASE (Linear on subset)
  const processedData = useMemo(() => {
    let result = searchResults;

    if (filterRarity !== 'ALL') {
      result = result.filter(item => item.rarity === filterRarity);
    }

    if (filterType !== 'ALL') {
      result = result.filter(item => item.orderType === filterType);
    }

    return result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc' 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchResults, sortField, sortDir, filterRarity, filterType]);

  // Calculations for the Summary Bar
  const stats = useMemo(() => {
      const totalVolume = processedData.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const totalQuantity = processedData.reduce((acc, i) => acc + i.quantity, 0);
      const avgUnitPrice = totalQuantity > 0 ? processedData.reduce((acc, i) => acc + i.price, 0) / processedData.length : 0;
      
      return { totalVolume, avgUnitPrice };
  }, [processedData]);

  // Find the closest reference price for the current search term
  // We use the raw search term, but stripping query logic might be better for finding refs.
  // E.g. "stone ql>90" -> find ref for "stone"
  const cleanSearchTerm = useMemo(() => {
       return searchTerm.replace(/([a-zA-Z]+)\s*(>=|<=|>|<|=)\s*([\w\d\.]+)/g, '').trim();
  }, [searchTerm]);

  const referenceMatch = useMemo(() => {
      return findClosestReference(cleanSearchTerm, referencePrices);
  }, [cleanSearchTerm, referencePrices]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentData = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Market Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs font-mono">
           <div className="flex flex-col">
               <span className="text-slate-500">Filtered Items</span>
               <span className="text-white font-bold">{processedData.length.toLocaleString()}</span>
           </div>
           <div className="flex flex-col">
               <span className="text-slate-500">Total Database</span>
               <span className="text-white font-bold">{data.length.toLocaleString()}</span>
           </div>
           <div className="flex flex-col">
               <span className="text-slate-500">Volume (Visible)</span>
               <span className="text-amber-500">
                   {formatWurmPrice(stats.totalVolume)}
               </span>
           </div>
           <div className="flex flex-col">
               <span className="text-slate-500">Avg. Unit Price</span>
               <span className="text-emerald-400">
                   {formatWurmPrice(stats.avgUnitPrice)}
               </span>
           </div>
      </div>

      {/* Controls Header */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Trade Database
            </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                type="text"
                placeholder="Search (e.g. stone ql>50)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
            </div>
            
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
            >
                <option value="ALL">All Orders</option>
                <option value="WTB">WTB (Buying)</option>
                <option value="WTS">WTS (Selling)</option>
            </select>

            <select 
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
            >
                <option value="ALL">All Rarities</option>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Supreme">Supreme</option>
                <option value="Fantastic">Fantastic</option>
            </select>
            </div>
        </div>
        
        {/* Dynamic Reference Match Panel */}
        {referenceMatch && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-900/80 border border-emerald-900/50 rounded-lg animate-fade-in shadow-inner items-stretch">
                <div className="flex items-center gap-3 flex-1 border-r border-slate-800 pr-4">
                    <div className="p-2 bg-emerald-500/10 rounded-full">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Reference Found</div>
                        <div className="text-lg text-slate-200 font-bold capitalize">{referenceMatch.name}</div>
                    </div>
                </div>

                <div className="flex gap-8 px-4 items-center">
                    <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 uppercase">Unit Price (1x)</span>
                         <span className="font-mono text-emerald-400 font-bold text-lg">
                            {formatWurmPrice(referenceMatch.price)}
                        </span>
                    </div>
                    
                    {/* Show 1k Price if it's cheap */}
                    {referenceMatch.price < 100 && (
                        <div className="flex flex-col border-l border-slate-700 pl-8">
                             <span className="text-[10px] text-slate-500 uppercase">Bulk Price (1k)</span>
                             <span className="font-mono text-emerald-300 font-bold text-lg">
                                {formatWurmPrice(referenceMatch.price * 1000)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-380px)] shadow-xl">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left relative min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm border-b border-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center text-slate-400">Type</th>
                <th className="p-4 font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors w-1/4" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Item Name <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 font-semibold text-slate-400 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-center gap-2">Qty <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('quality')}>
                  <div className="flex items-center gap-2">QL <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-2">Unit Price <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4 font-semibold text-slate-400 text-center">Ref. Price</th>
                <th className="p-4 font-semibold text-slate-400 text-center">Insight</th>
                <th className="p-4 font-semibold text-slate-400">Seller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {currentData.length > 0 ? (
                currentData.map((item) => {
                  const evaluation = evaluateTrade(item.name, item.price, referencePrices);
                  const totalPrice = item.price * item.quantity;
                  
                  return (
                  <tr key={item.id} className="hover:bg-slate-700/40 transition-colors group">
                    <td className="p-4 text-center">
                        {item.orderType === 'WTB' ? (
                             <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30" title="Buying">
                                <ShoppingBag className="w-4 h-4" />
                             </div>
                        ) : item.orderType === 'WTS' ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Selling">
                                <Tag className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 text-slate-500">
                                <span className="text-xs font-bold">?</span>
                            </div>
                        )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white flex flex-col">
                        <span className="flex items-center gap-2">
                            {item.name}
                            {item.rarity === 'Rare' && <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">Rare</span>}
                            {item.rarity === 'Supreme' && <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]">Sup</span>}
                        </span>
                        <span className="text-xs text-slate-500">{item.material !== 'Unknown' ? item.material : ''}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                        {item.quantity > 1 ? (
                            <div className="flex flex-col items-center gap-1 group/qty relative">
                                <span className="flex items-center gap-1 bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono text-xs">
                                    <Layers className="w-3 h-3" />
                                    {item.quantity}x
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    Total: {formatWurmPrice(totalPrice)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-slate-500">-</span>
                        )}
                    </td>
                    <td className="p-4">
                      {item.quality > 0 ? (
                        <div className="flex items-center gap-2" title={`${item.quality.toFixed(2)} quality`}>
                            <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${item.quality > 90 ? 'bg-purple-500' : item.quality > 70 ? 'bg-emerald-500' : item.quality > 50 ? 'bg-amber-500' : 'bg-slate-500'}`} 
                                style={{ width: `${item.quality}%` }}
                            />
                            </div>
                            <span className={`font-mono ${item.quality > 90 ? 'text-purple-300 font-bold' : 'text-slate-300'}`}>
                            {Math.floor(item.quality)}
                            </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <PriceDisplay copperVal={item.price} />
                    </td>
                    <td className="p-4 text-center">
                        {evaluation.referencePrice > 0 ? (
                             <BulkPriceDisplay unitPrice={evaluation.referencePrice} />
                        ) : (
                            <span className="text-slate-700">-</span>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        {evaluation.rating === 'GOOD' && (
                            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold" title="Cheaper than reference">
                                <ThumbsUp className="w-3 h-3" /> {Math.abs(evaluation.deltaPercent).toFixed(0)}%
                            </div>
                        )}
                        {evaluation.rating === 'BAD' && (
                            <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-bold" title="More expensive than reference">
                                <ThumbsDown className="w-3 h-3" /> {Math.abs(evaluation.deltaPercent).toFixed(0)}%
                            </div>
                        )}
                        {evaluation.rating === 'FAIR' && evaluation.referencePrice > 0 && (
                            <span className="text-slate-500 text-xs">Fair</span>
                        )}
                    </td>
                    <td className="p-4 text-amber-500/80 font-medium">{item.seller !== 'Unknown' ? item.seller : '-'}</td>
                  </tr>
                )})
              ) : (
                <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 opacity-20" />
                            <p>No trade records found for these filters.</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-slate-700 text-sm bg-slate-800 flex justify-between items-center">
          <div className="hidden sm:block text-slate-500">
            Page <span className="text-white font-medium">{currentPage}</span> of {totalPages}
          </div>
          
          <div className="flex items-center gap-1">
            <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronsLeft className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="sm:hidden px-3 text-slate-300">
                {currentPage} / {totalPages}
            </div>

            <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
