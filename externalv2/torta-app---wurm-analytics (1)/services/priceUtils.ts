
/**
 * Utility functions for Price Management and Formatting
 * Ported from legacy Python logic.
 */

export interface TradeEvaluation {
    rating: 'GOOD' | 'BAD' | 'FAIR' | 'UNKNOWN';
    deltaPercent: number;
    referencePrice: number;
}

const RARITIES = ['rare', 'supreme', 'fantastic', 'common'];

/**
 * Strips rarity prefixes to find the base item name.
 * e.g. "Rare Iron Lump" -> "iron lump"
 */
export const normalizeItemName = (name: string): string => {
    if (!name) return '';
    let clean = name.toLowerCase();
    
    // Remove rarity keywords
    RARITIES.forEach(r => {
        // Match whole word rarity to avoid replacing parts of names
        const regex = new RegExp(`\\b${r}\\b`, 'g');
        clean = clean.replace(regex, '');
    });
    
    // Remove extra whitespace
    return clean.replace(/\s+/g, ' ').trim();
};

export const evaluateTrade = (itemName: string, tradePrice: number, referencePrices: Record<string, number>): TradeEvaluation => {
    if (!itemName) return { rating: 'UNKNOWN', deltaPercent: 0, referencePrice: 0 };

    const cleanKey = normalizeItemName(itemName);

    // 1. Try Exact Normalized Match
    let ref = referencePrices[cleanKey];
    
    // 2. Try Plural/Singular variations on normalized key
    if (ref === undefined) {
        if (cleanKey.endsWith('s')) ref = referencePrices[cleanKey.slice(0, -1)];
        else ref = referencePrices[cleanKey + 's'];
    }

    // 3. Fuzzy / Contains Match (Aggressive Fallback)
    // Useful for "rare marble marble brick" matching "marble bricks"
    if (ref === undefined) {
        const refKeys = Object.keys(referencePrices);
        // Find a reference key that is contained within the clean item name OR vice versa
        // Prioritize the longest match to be specific
        const match = refKeys
            .filter(k => cleanKey.includes(k) || k.includes(cleanKey))
            .sort((a, b) => b.length - a.length)[0];
            
        if (match) ref = referencePrices[match];
    }

    if (ref === undefined || ref === 0) {
        return { rating: 'UNKNOWN', deltaPercent: 0, referencePrice: 0 };
    }

    // Calculate Delta Percentage
    const delta = ((tradePrice - ref) / ref) * 100;
    
    let rating: 'GOOD' | 'BAD' | 'FAIR' = 'FAIR';
    
    if (delta <= -10) rating = 'GOOD';
    else if (delta >= 10) rating = 'BAD';

    return { rating, deltaPercent: delta, referencePrice: ref };
};

/**
 * Finds the closest matching reference item for the UI Panel
 */
export const findClosestReference = (searchTerm: string, prices: Record<string, number>): { name: string; price: number } | null => {
    if (!searchTerm || searchTerm.length < 3) return null;
    
    const cleanSearch = normalizeItemName(searchTerm);
    const keys = Object.keys(prices);

    // 1. Exact Match
    if (prices[cleanSearch]) return { name: cleanSearch, price: prices[cleanSearch] };

    // 2. Starts With
    const startsWith = keys.find(k => k.startsWith(cleanSearch));
    if (startsWith) return { name: startsWith, price: prices[startsWith] };

    // 3. Includes (Fuzzy) - Search inside keys or keys inside search
    // e.g. Search "Rare Marble" -> Matches "Marble Bricks" if "Marble" is key? No, safer to match full words.
    // e.g. Search "Marble Brick" -> Matches "Marble Bricks"
    const includes = keys.find(k => k.includes(cleanSearch) || cleanSearch.includes(k));
    if (includes) return { name: includes, price: prices[includes] };

    return null;
};

export const formatWurmPrice = (copperVal: number): string => {
    if (copperVal === 0) return "0c";
    
    // Safety check for tiny values that are positive but would round to 0
    if (copperVal > 0 && copperVal < 0.005) {
        return "~0.01i"; // Trace amount
    }

    // 1g = 10000c
    const gold = Math.floor(copperVal / 10000);
    const remainingAfterGold = copperVal % 10000;
    
    // 1s = 100c
    const silver = Math.floor(remainingAfterGold / 100);
    const copper = Math.floor(remainingAfterGold % 100);
    
    // 1i = 0.01c
    const decimals = (remainingAfterGold % 1);
    const iron = Math.round(decimals * 100); 

    const parts: string[] = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    if (copper > 0) parts.push(`${copper}c`);
    if (iron > 0) parts.push(`${iron}i`);

    return parts.join(' ') || "0c";
};

/**
 * Parses a CSV string specifically formatted for Wurm Price Lists
 * Handles quotes, semicolons, and bulk calculations (Total Price / Qty)
 */
export const parsePriceCSV = (csvContent: string): Record<string, number> => {
    const lines = csvContent.split(/\r?\n/);
    const prices: Record<string, number> = {};
    
    // Helper to clean quotes: "Stone bricks" -> Stone bricks
    const clean = (s: string) => s ? s.replace(/^"|"$/g, '').trim() : '';

    lines.forEach(line => {
        if (!line || line.trim() === '') return;
        
        // Handle "Nome";Qtd;Preco format
        const parts = line.split(';');
        
        // Header check
        if (parts[0].includes('Nome_Item')) return;

        if (parts.length >= 3) {
            try {
                const name = clean(parts[0]).toLowerCase();
                const qty = parseFloat(clean(parts[1]));
                const totalPrice = parseFloat(clean(parts[2]));
                
                if (name && qty > 0 && !isNaN(totalPrice)) {
                    // CRITICAL: Calculate UNIT Price in Copper
                    // The CSV contains TOTAL price for the batch.
                    const unitPrice = totalPrice / qty;
                    prices[name] = unitPrice;
                }
            } catch (err) {
                console.warn(`Failed to parse line: ${line}`, err);
            }
        }
    });

    return prices;
};
