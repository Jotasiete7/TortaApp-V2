
import { MarketItem } from '../types';

interface ParsedQuery {
    textQuery: string;
    structuredQuery: string;
}

/**
 * Separates the raw search string into a text query (for SearchEngine)
 * and a structured query string (for JS filtering).
 * Example: "stone ql>50" -> { textQuery: "stone", structuredQuery: "ql>50" }
 */
export const parseSearchText = (searchText: string): ParsedQuery => {
    // Regex to find filter patterns: [word][operator][value]
    // Supports >, <, =, >=, <=
    // e.g., ql>90, price<100c, seller=jota
    const filterRegex = /([a-zA-Z]+)\s*(>=|<=|>|<|=)\s*([\w\d\.]+)/g;
    
    let structuredQuery = '';
    let textQuery = searchText;

    const matches = [...searchText.matchAll(filterRegex)];
    
    if (matches.length > 0) {
        // Collect all structured parts
        structuredQuery = matches.map(match => match[0]).join(' ');
        // Remove structured parts from text query
        textQuery = searchText.replace(filterRegex, '').trim();
    }

    return { textQuery, structuredQuery };
};

type FilterFunction = (item: MarketItem) => boolean;

/**
 * Converts a structured query string into a filter function.
 */
export const getStructuredFilter = (structuredQuery: string): FilterFunction => {
    if (!structuredQuery) {
        return () => true;
    }

    const filterRegex = /([a-zA-Z]+)\s*(>=|<=|>|<|=)\s*([\w\d\.]+)/g;
    const matches = [...structuredQuery.matchAll(filterRegex)];

    return (item: MarketItem) => {
        // Must satisfy ALL filters (AND logic)
        return matches.every(match => {
            const fieldAlias = match[1].toLowerCase(); // e.g. 'ql'
            const operator = match[2]; // e.g. '>'
            const valueStr = match[3].toLowerCase(); // e.g. '90' or '1s'
            
            // Map alias to actual item field
            let itemField: keyof MarketItem | null = null;
            
            if (fieldAlias === 'ql' || fieldAlias === 'quality') itemField = 'quality';
            else if (fieldAlias === 'price' || fieldAlias === 'p') itemField = 'price';
            else if (fieldAlias === 'qty' || fieldAlias === 'quantity') itemField = 'quantity';
            else if (fieldAlias === 'seller') itemField = 'seller';
            
            if (!itemField || !(itemField in item)) return true; // Ignore invalid fields

            const itemValue = item[itemField];
            
            // Handle Numeric Fields (ql, price, quantity)
            if (typeof itemValue === 'number') {
                let targetValue = parseFloat(valueStr);
                
                // Special handling for Price strings (1s, 1g) in filter
                if (fieldAlias === 'price' || fieldAlias === 'p') {
                    // Simple heuristic: if user typed "1s", try to convert.
                    // If just number, assume it matches the normalized format (Copper)
                    // But usually users type "100" for 1s. 
                    // Let's assume the user knows the copper values OR implement a mini-parser here.
                    // For now, assume raw number.
                }

                if (isNaN(targetValue)) return true;

                switch (operator) {
                    case '>': return itemValue > targetValue;
                    case '<': return itemValue < targetValue;
                    case '=': return Math.abs(itemValue - targetValue) < 0.001; // Float equality
                    case '>=': return itemValue >= targetValue;
                    case '<=': return itemValue <= targetValue;
                    default: return true;
                }
            } 
            // Handle String Fields (seller)
            else if (typeof itemValue === 'string') {
                const sItem = itemValue.toLowerCase();
                const sTarget = valueStr;
                
                switch (operator) {
                    case '=': return sItem === sTarget || sItem.includes(sTarget);
                    default: return true; // String only supports equals/includes for now
                }
            }

            return true;
        });
    };
};
