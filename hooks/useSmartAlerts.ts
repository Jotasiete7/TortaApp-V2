import { useMemo } from 'react';
import { MarketItem } from '../types';

export interface SmartAlert {
    id: string;
    item: MarketItem;
    discountPercent: number;
    marketPrice: number;
    unitPrice: number;
}

/**
 * useSmartAlerts
 * 
 * Analyzes live trades to detect "Smart Buy" opportunities.
 * A Smart Buy is defined as:
 * 1. Unit Price significantly lower than recent aggregation average (e.g. 20% discount).
 * 2. High reliability (Quantity > 1 helps verify it's a bulk deal).
 */
export const useSmartAlerts = (liveItems: MarketItem[], historicalItems: MarketItem[]) => {

    // 1. Build a Price Index from History (Optimization: Do this once or use a context)
    // Map: ItemName -> AvgPrice
    const priceIndex = useMemo(() => {
        const index = new Map<string, number>();
        const sums = new Map<string, { total: number, count: number }>();

        historicalItems.forEach(i => {
            if (i.price <= 0) return;
            const key = i.name.toLowerCase(); // Use canonical name logic if possible, but rawItems match

            if (!sums.has(key)) sums.set(key, { total: 0, count: 0 });
            const s = sums.get(key)!;
            s.total += i.price;
            s.count++;
        });

        sums.forEach((val, key) => {
            if (val.count > 3) { // Min 3 trades to establish price
                index.set(key, val.total / val.count);
            }
        });
        return index;
    }, [historicalItems]); // Rebuild only when history changes

    // 2. Scan Live Items for Alerts
    const alerts = useMemo(() => {
        const found: SmartAlert[] = [];

        liveItems.forEach(item => {
            if (item.orderType !== 'WTS') return; // Only interested in Sellers
            if (item.price <= 0) return;

            const marketPrice = priceIndex.get(item.name.toLowerCase());
            if (!marketPrice) return; // No reference price

            // Threshold: 20% discount
            const threshold = marketPrice * 0.8;

            if (item.price < threshold) {
                const discount = Math.round(((marketPrice - item.price) / marketPrice) * 100);
                found.push({
                    id: item.id,
                    item,
                    discountPercent: discount,
                    marketPrice,
                    unitPrice: item.price
                });
            }
        });

        return found.sort((a, b) => b.discountPercent - a.discountPercent); // Best deals first
    }, [liveItems, priceIndex]);

    return { alerts };
};
