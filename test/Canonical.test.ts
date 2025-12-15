
import { describe, it, expect } from 'vitest';
import { getCanonicalName } from '../services/ItemIdentity';

describe('ItemIdentity Canonicalization', () => {
    it('should normalize basic naming variations', () => {
        expect(getCanonicalName('Large Anvil')).toBe('Large Anvil');
        expect(getCanonicalName('large anvil')).toBe('Large Anvil');
        expect(getCanonicalName('Lg Anvil')).toBe('Large Anvil');
    });

    it('should remove quality and brackets', () => {
        expect(getCanonicalName('Large Anvil [90ql]')).toBe('Large Anvil');
        expect(getCanonicalName('Rare Large Anvil')).toBe('Large Anvil');
        expect(getCanonicalName('Supreme Large Anvil')).toBe('Large Anvil');
    });

    it('should handle material repetitions / impurities', () => {
        expect(getCanonicalName('Impure Iron Lump')).toBe('Iron Lump');
        expect(getCanonicalName('Impure Zinc Lump')).toBe('Zinc Lump');
    });

    it('should handle known material prefixes', () => {
        expect(getCanonicalName('Wheat Sleep Powder')).toBe('Sleep Powder');
    });
});
