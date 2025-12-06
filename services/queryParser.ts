/**
 * queryParser.ts
 * Parser for structured search queries
 * 
 * Supports queries like: "stone ql>90 price<50 seller=jota"
 * Separates text search from structured filters
 */

import { MarketItem } from '../types';

interface ParsedQuery {
    textQuery: string;
    structuredQuery: string;
}

/**
 * Separates raw search string into text query and structured query
 * Example: "stone ql>50" -> { textQuery: "stone", structuredQuery: "ql>50" }
 */
export const parseSearchText = (searchText: string): ParsedQuery => {
    // Regex to find filter patterns: [field][operator][value]
    // Supports >, <, =, >=, <=
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
 * Converts a structured query string into a filter function
 * Example: "ql>90" -> (item) => item.quality > 90
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
            const fieldAlias = match[1].toLowerCase();
            const operator = match[2];
            const valueStr = match[3].toLowerCase();
            
            // Map alias to actual item field
            let itemField: keyof MarketItem | null = null;
            
            // Field aliases
            if (fieldAlias === 'ql' || fieldAlias === 'quality' || fieldAlias === 'q') {
                itemField = 'quality';
            } else if (fieldAlias === 'price' || fieldAlias === 'p') {
                itemField = 'price';
            } else if (fieldAlias === 'qty' || fieldAlias === 'quantity') {
                itemField = 'quantity';
            } else if (fieldAlias === 'seller' || fieldAlias === 's') {
                itemField = 'seller';
            } else if (fieldAlias === 'rarity' || fieldAlias === 'r') {
                itemField = 'rarity';
            } else if (fieldAlias === 'material' || fieldAlias === 'm') {
                itemField = 'material';
            } else if (fieldAlias === 'type' || fieldAlias === 't') {
                itemField = 'orderType';
            }
            
            if (!itemField || !(itemField in item)) return true; // Ignore invalid fields

            const itemValue = item[itemField];
            
            // Handle Numeric Fields (quality, price, quantity)
            if (typeof itemValue === 'number') {
                let targetValue = parseFloat(valueStr);
                
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
            // Handle String Fields (seller, material, rarity, orderType)
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

/**
 * Helper to get available filter fields and their aliases
 */
export const getAvailableFilters = () => {
    return {
        quality: ['ql', 'quality', 'q'],
        price: ['price', 'p'],
        quantity: ['qty', 'quantity'],
        seller: ['seller', 's'],
        rarity: ['rarity', 'r'],
        material: ['material', 'm'],
        orderType: ['type', 't']
    };
};
