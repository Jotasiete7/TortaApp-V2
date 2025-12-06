
import { useMemo } from 'react';
import { MarketItem } from '../types';
import { SearchEngine } from '../services/searchEngine';
import { parseSearchText, getStructuredFilter } from '../services/queryParser';

interface SearchProps {
    data: MarketItem[];
    searchEngine: SearchEngine | null;
    searchText: string;
}

export const useMarketSearch = ({ data, searchEngine, searchText }: SearchProps) => {
    
    const filteredData = useMemo(() => {
        // If no data or no query, return all
        if (!data || !searchEngine) return data || [];
        if (!searchText.trim()) return data;

        // 1. Parse Query
        const { textQuery, structuredQuery } = parseSearchText(searchText);

        // 2. Phase 1: Text Search (Inverted Index) - FAST
        let results: MarketItem[] = data;
        
        if (textQuery) {
            results = searchEngine.search(textQuery);
        }

        // 3. Phase 2: Structured Filtering (Linear on subset) - FAST ENOUGH
        if (structuredQuery) {
            const applyFilter = getStructuredFilter(structuredQuery);
            results = results.filter(applyFilter);
        }

        return results;

    }, [data, searchEngine, searchText]);

    return filteredData;
};
