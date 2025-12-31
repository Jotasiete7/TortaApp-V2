import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { MarketItem } from '../../types';
import {
    searchItems,
    getPopularItems,
    getRecentSearches,
    saveRecentSearch,
    clearRecentSearches,
    getCategoryEmoji,
    SearchResult
} from '../../services/searchUtils';
import { formatWurmPrice } from '../../services/priceUtils';
import { useDebounce } from '../../hooks/useDebounce';

interface SmartSearchProps {
    items: { id: string, name: string }[]; // ARCHITECTURAL CHANGE: Objects
    rawData: MarketItem[];
    selectedItemId: string; // ID
    onSelect: (item: { id: string, name: string }) => void; // Pass full object back
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
    items,
    rawData,
    selectedItemId,
    onSelect
}) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300); // Debounce search by 300ms
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<{ id: string, name: string }[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    // Search results with fuzzy matching
    const searchResults = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return searchItems(debouncedQuery, items, rawData, 10);
    }, [debouncedQuery, items, rawData]);

    // Popular items
    const popularItems = useMemo(() => {
        return getPopularItems(rawData, 10);
    }, [rawData]);

    // Items to display in dropdown
    const displayItems = useMemo(() => {
        if (debouncedQuery.trim()) {
            return searchResults;
        }

        // Show recent + popular when empty
        // Recent is already object { id, name }
        const recent = recentSearches.map(recentItem => {
            const itemData = rawData.filter(d => d.itemId === recentItem.id);
            return {
                id: recentItem.id,
                item: recentItem.name,
                score: 100,
                avgPrice: itemData.reduce((sum, d) => sum + d.price, 0) / (itemData.length || 1),
                volume: itemData.length,
                category: 'Recent'
            } as SearchResult;
        });

        return recent;
    }, [debouncedQuery, searchResults, recentSearches, rawData]);

    // Handle selection
    const handleSelect = (item: { id: string, name: string }) => {
        onSelect(item);
        saveRecentSearch(item);
        setRecentSearches(getRecentSearches());
        setQuery(''); // Maybe keep query as name? No, clear it.
        setIsOpen(false);
        inputRef.current?.blur();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                setHighlightedIndex(prev =>
                    prev < displayItems.length - 1 ? prev + 1 : prev
                );
                e.preventDefault();
                break;
            case 'ArrowUp':
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                e.preventDefault();
                break;
            case 'Enter':
                if (displayItems[highlightedIndex]) {
                    // SearchResult has 'item' (name) and 'id'
                    const { id, item: name } = displayItems[highlightedIndex];
                    handleSelect({ id, name });
                }
                e.preventDefault();
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                e.preventDefault();
                break;
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when results change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [displayItems]);

    // Highlight matching text
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <span className="bg-amber-500/30 text-amber-300 font-semibold">
                    {text.substring(index, index + query.length)}
                </span>
                {text.substring(index + query.length)}
            </>
        );
    };

    return (
        <div className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search items... (fuzzy search enabled)"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-20 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                inputRef.current?.focus();
                            }}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                            title="Clear"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50 animate-fade-in"
                >
                    {/* Search Results */}
                    {query.trim() && searchResults.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/50 sticky top-0 z-10">
                                🎯 Search Results ({searchResults.length})
                            </div>
                            {searchResults.map((result, idx) => (
                                <button
                                    key={result.id} // Use ID as Key
                                    onClick={() => handleSelect({ id: result.id, name: result.item })}
                                    className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors ${idx === highlightedIndex ? 'bg-slate-800' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-lg">{getCategoryEmoji(result.category)}</span>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm text-white truncate">
                                                {highlightMatch(result.item, query)}
                                            </p>
                                            <p className="text-xs text-slate-500">{result.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end ml-2">
                                        <span className="text-xs font-mono text-emerald-400">
                                            {formatWurmPrice(result.avgPrice)}
                                        </span>
                                        <span className="text-[10px] text-slate-500">{result.volume} trades</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {query.trim() && searchResults.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <p className="text-sm">No items found for "{query}"</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                    )}

                    {/* Recent Searches */}
                    {!query.trim() && recentSearches.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/50 flex items-center justify-between sticky top-0 z-10">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Recent Searches
                                </span>
                                <button
                                    onClick={() => {
                                        clearRecentSearches();
                                        setRecentSearches([]);
                                    }}
                                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            {displayItems.map((result, idx) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect({ id: result.id, name: result.item })}
                                    className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors ${idx === highlightedIndex ? 'bg-slate-800' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        <p className="text-sm text-white truncate">{result.item}</p>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">
                                        {formatWurmPrice(result.avgPrice)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Popular Items */}
                    {!query.trim() && popularItems.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/50 flex items-center gap-1 sticky top-0 z-10">
                                <TrendingUp className="w-3 h-3" />
                                Popular Items
                            </div>
                            {popularItems.slice(0, 5).map((popItem) => {
                                // PopItem is now { id, name }
                                const itemData = rawData.filter(d => d.itemId === popItem.id);
                                const avgPrice = itemData.reduce((sum, d) => sum + d.price, 0) / (itemData.length || 1);
                                const volume = itemData.length;

                                return (
                                    <button
                                        key={popItem.id}
                                        onClick={() => handleSelect(popItem)}
                                        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <TrendingUp className="w-4 h-4 text-amber-500" />
                                            <p className="text-sm text-white truncate">{popItem.name}</p>
                                        </div>
                                        <div className="flex flex-col items-end ml-2">
                                            <span className="text-xs font-mono text-emerald-400">
                                                {formatWurmPrice(avgPrice)}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{volume} trades</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
