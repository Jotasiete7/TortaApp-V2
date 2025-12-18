/**
 * useMarketSearch.ts
 * React Hook for optimized market search
 * 
 * Combines SearchEngine (inverted index) with QueryParser (structured filters)
 * for high-performance searching on large datasets
 */

import { useMemo } from 'react';
import { MarketItem } from '../types';
import { SearchEngine } from '../services/searchEngine';
import { parseSearchText, getStructuredFilter } from '../services/queryParser';

interface SearchProps {
    data: MarketItem[];
    searchEngine: SearchEngine | null;
    searchText: string;
}

/**
 * Hook for optimized market search
 * Returns filtered data based on text search + structured filters
 */
export const useMarketSearch = ({ data, searchEngine, searchText }: SearchProps): MarketItem[] => {
    
    const filteredData = useMemo(() => {
        // If no data or no search engine, return all data
        if (!data || !searchEngine) return data || [];
        if (!searchText.trim()) return data;

        // 1. Parse Query into text and structured parts
        const { textQuery, structuredQuery } = parseSearchText(searchText);

        // 2. Phase 1: Text Search using Inverted Index (FAST)
        let results: MarketItem[] = data;
        
        if (textQuery) {
            results = searchEngine.search(textQuery);
        }

        // 3. Phase 2: Structured Filtering on subset (FAST ENOUGH)
        if (structuredQuery) {
            const applyFilter = getStructuredFilter(structuredQuery);
            results = results.filter(applyFilter);
        }

        return results;

    }, [data, searchEngine, searchText]);

    return filteredData;
};
