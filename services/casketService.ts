
/**
 * casketService.ts
 * Logic for calculating Tier and Value of Dirty Caskets based on Sleep Powder yield.
 */

// Base price per Sleep Powder unit in Copper (80c = 0.80s)
const DEFAULT_SLEEP_PRICE_COPPER = 80;

export interface CasketInfo {
    tier: number;
    sleepCount: number;
    estimatedValueCopper: number;
    formattedValue: string;
}

export const CasketService = {
    /**
     * Calculates Casket Tier, Sleep Count and Value based on Quality Level (QL).
     * @param ql Quality Level of the casket (0-100)
     * @param sleepPriceCopper Optional override for Sleep Powder price (default 80c)
     */
    analyzeCasket(ql: number, sleepPriceCopper: number = DEFAULT_SLEEP_PRICE_COPPER): CasketInfo {
        let sleepCount = 0;
        let tier = 0;

        // Logic Source: User Request
        // <= 29: 1 sleep (Tier 1)
        // 30-59: 2 sleep (Tier 2)
        // >= 60: 3 sleep (Tier 3)

        if (ql <= 29.99) { // Using 29.99 to be safe for decimals
            sleepCount = 1;
            tier = 1;
        } else if (ql <= 59.99) {
            sleepCount = 2;
            tier = 2;
        } else {
            sleepCount = 3;
            tier = 3;
        }

        const estimatedValue = sleepCount * sleepPriceCopper;

        return {
            tier,
            sleepCount,
            estimatedValueCopper: estimatedValue,
            formattedValue: (estimatedValue / 100).toFixed(2) + 's'
        };
    },

    /**
     * Checks if an item name indicates it is a Dirty Casket.
     */
    isCasket(itemName: string): boolean {
        if (!itemName) return false;
        return itemName.toLowerCase().includes('dirty casket');
    }
};
