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

    it('should throw error for non-integer copper', () => {
      expect(() => Money.fromCopper(100.5)).toThrow('Copper value must be an integer');
    });
  });

  describe('fromString', () => {
    it('should parse full format "1g 500s 50c"', () => {
      const money = Money.fromString('1g 500s 50c');
      expect(money.getCopper()).toBe(150050); // 1*100000 + 500*100 + 50
    });

    it('should parse gold and silver "2g 300s"', () => {
      const money = Money.fromString('2g 300s');
      expect(money.getCopper()).toBe(230000); // 2*100000 + 300*100
    });

    it('should parse only gold "5g"', () => {
      const money = Money.fromString('5g');
      expect(money.getCopper()).toBe(500000); // 5*100000
    });

    it('should parse only silver "500s"', () => {
      const money = Money.fromString('500s');
      expect(money.getCopper()).toBe(50000); // 500*100
    });

    it('should parse only copper "1000c"', () => {
      const money = Money.fromString('1000c');
      expect(money.getCopper()).toBe(1000);
    });

    it('should handle extra whitespace', () => {
      const money = Money.fromString('  1g   500s  50c  ');
      expect(money.getCopper()).toBe(150050);
    });

    it('should be case insensitive', () => {
      const money = Money.fromString('1G 500S 50C');
      expect(money.getCopper()).toBe(150050);
    });

    it('should throw error for invalid format', () => {
      expect(() => Money.fromString('invalid')).toThrow('Invalid money format');
    });

    it('should throw error for empty string', () => {
      expect(() => Money.fromString('')).toThrow('Invalid money format');
    });
  });

  describe('toSilver', () => {
    it('should convert copper to silver correctly', () => {
      const money = Money.fromCopper(50000);
      expect(money.toSilver()).toBe(500);
    });

    it('should return decimal values when needed', () => {
      const money = Money.fromCopper(550);
      expect(money.toSilver()).toBe(5.5);
    });

    it('should return 0 for zero copper', () => {
      const money = Money.fromCopper(0);
      expect(money.toSilver()).toBe(0);
    });
  });

  describe('toGold', () => {
    it('should convert copper to gold correctly', () => {
      const money = Money.fromCopper(500000);
      expect(money.toGold()).toBe(5);
    });

    it('should return decimal values when needed', () => {
      const money = Money.fromCopper(150000);
      expect(money.toGold()).toBe(1.5);
    });

    it('should return 0 for zero copper', () => {
      const money = Money.fromCopper(0);
      expect(money.toGold()).toBe(0);
    });
  });

  describe('toString', () => {
    it('should format full value "1g 503s 50c"', () => {
      const money = Money.fromCopper(150350);
      expect(money.toString()).toBe('1g 503s 50c');
    });

    it('should omit zero gold', () => {
      const money = Money.fromCopper(500);
      expect(money.toString()).toBe('5s');
    });

    it('should omit zero silver', () => {
      const money = Money.fromCopper(100050);
      expect(money.toString()).toBe('1g 50c');
    });

    it('should omit zero copper', () => {
      const money = Money.fromCopper(100000);
      expect(money.toString()).toBe('1g');
    });

    it('should return "0c" for zero value', () => {
      const money = Money.fromCopper(0);
      expect(money.toString()).toBe('0c');
    });

    it('should format only silver', () => {
      const money = Money.fromCopper(50000);
      expect(money.toString()).toBe('500s');
    });

    it('should format only copper', () => {
      const money = Money.fromCopper(50);
      expect(money.toString()).toBe('50c');
    });
  });

  describe('equals', () => {
    it('should return true for equal values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(1000);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(2000);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should work with Money created from different methods', () => {
      const money1 = Money.fromCopper(150050);
      const money2 = Money.fromString('1g 500s 50c');
      expect(money1.equals(money2)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add two Money values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(500);
      const result = money1.add(money2);
      expect(result.getCopper()).toBe(1500);
    });

    it('should not mutate original values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(500);
      money1.add(money2);
      expect(money1.getCopper()).toBe(1000);
      expect(money2.getCopper()).toBe(500);
    });
  });

  describe('subtract', () => {
    it('should subtract two Money values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(500);
      const result = money1.subtract(money2);
      expect(result.getCopper()).toBe(500);
    });

    it('should throw error if result would be negative', () => {
      const money1 = Money.fromCopper(500);
      const money2 = Money.fromCopper(1000);
      expect(() => money1.subtract(money2)).toThrow('Cannot subtract: result would be negative');
    });

    it('should not mutate original values', () => {
      const money1 = Money.fromCopper(1000);
      const money2 = Money.fromCopper(500);
      money1.subtract(money2);
      expect(money1.getCopper()).toBe(1000);
      expect(money2.getCopper()).toBe(500);
    });
  });

  describe('multiply', () => {
    it('should multiply Money by a factor', () => {
      const money = Money.fromCopper(1000);
      const result = money.multiply(2.5);
      expect(result.getCopper()).toBe(2500);
    });

    it('should floor the result', () => {
      const money = Money.fromCopper(1000);
      const result = money.multiply(1.7);
      expect(result.getCopper()).toBe(1700);
    });

    it('should throw error for negative factor', () => {
      const money = Money.fromCopper(1000);
      expect(() => money.multiply(-1)).toThrow('Factor cannot be negative');
    });

    it('should not mutate original value', () => {
      const money = Money.fromCopper(1000);
      money.multiply(2);
      expect(money.getCopper()).toBe(1000);
    });
  });

  describe('integration tests', () => {
    it('should handle round-trip conversion: string -> Money -> string', () => {
      const original = '1g 500s 50c';
      const money = Money.fromString(original);
      expect(money.toString()).toBe(original);
    });

    it('should handle complex calculations', () => {
      const price1 = Money.fromString('2g 500s');
      const price2 = Money.fromString('1g 300s 50c');
      const total = price1.add(price2);
      expect(total.toString()).toBe('3g 800s 50c');
    });

    it('should handle percentage calculations', () => {
      const price = Money.fromString('1g');
      const tax = price.multiply(0.15); // 15% tax
      expect(tax.toString()).toBe('150s');
    });
  });
});
