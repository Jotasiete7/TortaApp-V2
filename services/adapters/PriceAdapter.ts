import { Money } from '../../src/domain/price/Money';

/**
 * PriceAdapter - Bridge between components expecting primitives and Money class
 */
export class PriceAdapter {
  static toDisplayString(money: Money | null): string {
    return money ? money.toString() : '0c';
  }

  static toCopper(money: Money | null): number {
    return money ? money.getCopper() : 0;
  }

  static fromCopper(copper: number | null): Money | null {
    if (copper === null || copper === undefined) return null;
    if (copper <= 0) return null;
    try {
      return Money.fromCopper(copper);
    } catch (err) {
      console.warn('Invalid copper value:', copper, err);
      return null;
    }
  }

  static fromString(priceStr: string | null | undefined): Money | null {
    if (!priceStr || priceStr.trim() === '') return null;
    try {
      return Money.fromString(priceStr);
    } catch (err) {
      console.warn('Invalid price format:', priceStr, err);
      return null;
    }
  }

  static formatCopper(copper: number | null): string {
    const money = this.fromCopper(copper);
    return this.toDisplayString(money);
  }

  static parseToCopper(priceStr: string | null | undefined): number {
    const money = this.fromString(priceStr);
    return this.toCopper(money);
  }
}
