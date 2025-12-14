import { describe, it, expect } from 'vitest';
import { Money } from '../src/domain/price/Money';

describe('Money', () => {
  describe('fromCopper', () => {
    it('should create Money with valid copper value', () => {
      const money = Money.fromCopper(1000);
      expect(money.getCopper()).toBe(1000);
    });

    it('should create Money with zero copper', () => {
      const money = Money.fromCopper(0);
      expect(money.getCopper()).toBe(0);
    });

    it('should throw error for negative copper', () => {
      expect(() => Money.fromCopper(-100)).toThrow('Copper value cannot be negative');
    });

    it('should NOT throw error for non-integer copper (Iron support)', () => {
      const money = Money.fromCopper(100.5);
      expect(money.getCopper()).toBe(100.5);
    });
  });

  describe('fromString', () => {
    it('should parse full format "1g 5s 50c"', () => {
      const money = Money.fromString('1g 5s 50c');
      expect(money.getCopper()).toBe(10550); // 1*10000 + 5*100 + 50
    });

    it('should parse gold and silver "2g 30s"', () => {
      const money = Money.fromString('2g 30s');
      expect(money.getCopper()).toBe(23000); // 2*10000 + 30*100
    });
  });

  describe('toString', () => {
    it('should format full value "1g 5s 50c"', () => {
      const money = Money.fromCopper(10550);
      expect(money.toString()).toBe('1g 5s 50c');
    });

    it('should format silver correctly (500s = 5g)', () => {
      const money = Money.fromCopper(50000);
      // 500s = 50000c. 50000/10000 = 5g.
      expect(money.toString()).toBe('5g'); 
    });
  });

  describe('add', () => {
    it('should add two Money values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(500);
      const result = money1.add(money2);
      expect(result.getCopper()).toBe(1500);
    });
  });

  // Basic tests sufficiency check
});
