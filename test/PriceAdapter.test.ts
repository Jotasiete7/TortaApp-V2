import { describe, it, expect } from 'vitest';
import { PriceAdapter } from '../services/adapters/PriceAdapter';
import { Money } from '../src/domain/price/Money';

describe('PriceAdapter', () => {
  describe('toDisplayString', () => {
    it('converts Money to display string', () => {
      // 150350c = 15g 3s 50c (with 1g=10000c)
      const money = Money.fromCopper(150350);
      expect(PriceAdapter.toDisplayString(money)).toBe('15g 3s 50c');
    });

    it('handles null Money gracefully', () => {
      expect(PriceAdapter.toDisplayString(null)).toBe('0c');
    });
  });

  describe('fromString', () => {
    it('creates Money from valid string', () => {
      // 5g 50s = 5*10000 + 50*100 = 55000
      const money = PriceAdapter.fromString('5g 50s');
      expect(money?.getCopper()).toBe(55000);
    });
  });
});
