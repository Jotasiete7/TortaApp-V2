
/**
 * priceUtils.ts
 * Service responsible for managing reference prices (Redheart) and calculating historical averages.
 */

import { TradeRecord } from './fileParser';

export interface PriceInsight {
    item_name: string;
    current_price: number;
    redheart_price: number | null;
    historical_avg: number | null;
    delta_redheart: number | null;
    delta_historical: number | null;
    message: string;
    rating: 'GOOD' | 'BAD' | 'FAIR' | 'UNKNOWN';
}

export class PriceUtils {
    private redheartPrices: Map<string, number> = new Map();

    /**
     * Parses CSV content string and populates the price map.
     * @param content CSV string content.
     */
    public parseCSV(content: string): void {
        const lines = content.split(/\r?\n/);
        let count = 0;

        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length < 3) continue;

            const name = parts[0].trim().replace(/"/g, '');
            const qtyStr = parts[1].trim().replace(/"/g, '');
            const priceStr = parts[2].trim().replace(/"/g, '');

            if (name === 'Nome_Item') continue;

            const qty = parseFloat(qtyStr);
            const totalCopper = parseFloat(priceStr);

            if (!isNaN(qty) && !isNaN(totalCopper) && qty > 0) {
                const unitPrice = totalCopper / qty;
                this.redheartPrices.set(name.toLowerCase(), unitPrice);
                count++;
            }
        }
        if (import.meta.env.DEV) console.log(`Loaded ${count} Redheart prices.`);
    }

    public getRedheartPrice(itemName: string): number | null {
        return this.redheartPrices.get(itemName.toLowerCase()) || null;
    }

    public getHistoricalAverage(trades: TradeRecord[], itemName: string, limit: number = 1000): number | null {
        const itemTrades = trades
            .filter(t => t.item_name.toLowerCase() === itemName.toLowerCase() && t.price_copper > 0)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

        if (itemTrades.length === 0) return null;

        const total = itemTrades.reduce((sum, t) => sum + t.price_copper, 0);
        return total / itemTrades.length;
    }

    public generateInsight(itemName: string, currentPrice: number, trades: TradeRecord[]): PriceInsight {
        const redheartPrice = this.getRedheartPrice(itemName);
        const historicalAvg = this.getHistoricalAverage(trades, itemName);

        let deltaRedheart: number | null = null;
        let deltaHistorical: number | null = null;
        let message = "No reference data.";
        let rating: 'GOOD' | 'BAD' | 'FAIR' | 'UNKNOWN' = 'UNKNOWN';

        if (redheartPrice !== null) {
            deltaRedheart = ((currentPrice - redheartPrice) / redheartPrice) * 100;
        }

        if (historicalAvg !== null) {
            deltaHistorical = ((currentPrice - historicalAvg) / historicalAvg) * 100;
        }

        const refPrice = redheartPrice ?? historicalAvg;
        const delta = deltaRedheart ?? deltaHistorical;

        if (refPrice !== null && delta !== null) {
            if (delta <= -15) {
                rating = 'GOOD';
                message = `Price is ${Math.abs(delta).toFixed(1)}% BELOW reference. Good buy!`;
            } else if (delta >= 15) {
                rating = 'BAD';
                message = `Price is ${delta.toFixed(1)}% ABOVE reference. Expensive.`;
            } else {
                rating = 'FAIR';
                message = `Price is fair (within 15% of reference).`;
            }
        }

        return {
            item_name: itemName,
            current_price: currentPrice,
            redheart_price: redheartPrice,
            historical_avg: historicalAvg,
            delta_redheart: deltaRedheart,
            delta_historical: deltaHistorical,
            message: message,
            rating: rating
        };
    }
}

// --- EXPORTED FUNCTIONS FOR APP COMPATIBILITY ---

export const parsePriceCSV = (content: string): Record<string, number> => {
    const utils = new PriceUtils();
    utils.parseCSV(content);
    // Expose the map as a Record
    const prices: Record<string, number> = {};
    // @ts-ignore - accessing private map for export
    utils.redheartPrices.forEach((value, key) => {
        prices[key] = value;
    });
    return prices;
};

export const formatWurmPrice = (copper: number): string => {
    if (copper === 0) return "0c";

    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const cop = Math.floor(copper % 100);
    const iron = Math.round((copper % 1) * 100);

    let parts = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    if (cop > 0) parts.push(`${cop}c`);
    if (iron > 0) parts.push(`${iron}i`);

    return parts.join(' ') || "0c";
};

export const findClosestReference = (searchTerm: string, referencePrices: Record<string, number>): { name: string, price: number } | null => {
    if (!searchTerm) return null;
    const lower = searchTerm.toLowerCase();
    const match = Object.keys(referencePrices).find(k => k === lower);
    if (match) return { name: match, price: referencePrices[match] };

    // Simple partial match
    const partial = Object.keys(referencePrices).find(k => k.includes(lower));
    if (partial) return { name: partial, price: referencePrices[partial] };

    return null;
};

export const evaluateTrade = (itemName: string, price: number, referencePrices: Record<string, number>): { referencePrice: number, deltaPercent: number, rating: 'GOOD' | 'BAD' | 'FAIR' | 'UNKNOWN' } => {
    const ref = findClosestReference(itemName, referencePrices);
    if (!ref) return { referencePrice: 0, deltaPercent: 0, rating: 'UNKNOWN' };

    const delta = ((price - ref.price) / ref.price) * 100;
    let rating: 'GOOD' | 'BAD' | 'FAIR' | 'UNKNOWN' = 'FAIR';

    if (delta <= -15) rating = 'GOOD';
    else if (delta >= 15) rating = 'BAD';

    return { referencePrice: ref.price, deltaPercent: delta, rating };
};

// --- PERSISTENCE UTILS ---

const STORAGE_KEY = 'torta_app_prices_v1';

export const savePricesToStorage = (prices: Record<string, number>): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
        if (import.meta.env.DEV) console.log('Prices saved to localStorage');
    } catch (e) {
        console.error('Failed to save prices to storage', e);
    }
};

export const loadPricesFromStorage = (): Record<string, number> | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load prices from storage', e);
        return null;
    }
};
