
import { resolveItemIdentity } from '../services/ItemIdentity';
import { describe, test, expect } from 'vitest';

describe('ItemIdentity Parity Check', () => {

    test('Removes impurities to match Rust behavior', () => {
        const impure = resolveItemIdentity("Impure Iron Lump");
        const clean = resolveItemIdentity("Iron Lump");

        expect(impure.id).toBe('iron_lump');
        expect(clean.id).toBe('iron_lump');
        expect(impure.id).toBe(clean.id);
    });

    test('Removes shattered prefix', () => {
        const shattered = resolveItemIdentity("Shattered large anvil");
        const normal = resolveItemIdentity("Large Anvil");

        expect(shattered.id).toBe('large_anvil');
        expect(normal.id).toBe('large_anvil');
    });

    test('Removes corrosion', () => {
        const corroded = resolveItemIdentity("Corroded Bronze Plate");
        expect(corroded.id).toBe('bronze_plate');
    });

    test('Filters service advertisements', () => {
        const service = resolveItemIdentity("Cleaning service");
        expect(service.id).toBe('unknown');

        const recruitment = resolveItemIdentity("Alliance recruitment");
        expect(recruitment.id).toBe('alliance');

        const bulk = resolveItemIdentity("Selling bulk iron");
        expect(bulk.id).toBe('iron');
    });

    test('Sleep Powder Semantic Rule still holds', () => {
        const wheat = resolveItemIdentity("Wheat Sleep Powder");
        expect(wheat.id).toBe('sleep_powder');
    });

});
