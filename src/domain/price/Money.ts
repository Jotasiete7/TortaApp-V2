/**
 * Money class for Albion Online currency system (Adapted for Wurm Online)
 * 
 * Monetary System:
 * - 1 Gold = 100 Silver
 * - 1 Silver = 100 Copper
 * - 1 Copper = 100 Iron (implied by fileParser, not strictly handled here but allowed via floats)
 * - 1 Gold = 10,000 Copper
 * 
 * Internally stores values in copper (smallest unit) to avoid precision issues.
 * NOTE: To support 'iron' (decimals of copper), we accept non-integers.
 */
export class Money {
  private readonly copper: number;

  private constructor(copper: number) {
    this.copper = copper;
  }

  /**
   * Creates a Money instance from a copper value
   * @param copper - The amount in copper (accepts floats for iron support)
   * @throws Error if copper is negative
   */
  static fromCopper(copper: number): Money {
    if (copper < 0) {
      throw new Error('Copper value cannot be negative');
    }
    // Removed integer check to support Iron (decimals)
    return new Money(copper);
  }

  /**
   * Parses a string representation of money into a Money instance
   * 
   * Supported formats:
   * - "1g 500s 50c" (full format)
   * - "2g 300s" (gold and silver)
   * - "500s" (silver only)
   * - "1000c" (copper only)
   * - "2g" (gold only)
   * 
   * @param value - String representation of money
   * @throws Error if format is invalid
   */
  static fromString(value: string): Money {
    const trimmed = value.trim().toLowerCase();
    
    // Regular expression to match gold, silver, and copper
    const goldMatch = trimmed.match(/(\d+)g/);
    const silverMatch = trimmed.match(/(\d+)s/);
    const copperMatch = trimmed.match(/(\d+)c/);

    const gold = goldMatch ? parseInt(goldMatch[1], 10) : 0;
    const silver = silverMatch ? parseInt(silverMatch[1], 10) : 0;
    const copperValue = copperMatch ? parseInt(copperMatch[1], 10) : 0;

    // Validate that at least one unit was found
    if (!goldMatch && !silverMatch && !copperMatch) {
      throw new Error(`Invalid money format: "${value}"`);
    }

    // Calculate total copper (1g = 10000c, 1s = 100c)
    const totalCopper = gold * 10000 + silver * 100 + copperValue;
    
    return Money.fromCopper(totalCopper);
  }

  /**
   * Converts the money value to silver (with decimals)
   * @returns The value in silver
   */
  toSilver(): number {
    return this.copper / 100;
  }

  /**
   * Converts the money value to gold (with decimals)
   * @returns The value in gold
   */
  toGold(): number {
    return this.copper / 10000;
  }

  /**
   * Returns a human-readable string representation
   * Format: "Xg Ys Zc" (omits units with zero value)
   * Uses Math.floor for display, ignoring Iron (decimals) for standard format.
   */
  toString(): string {
    const gold = Math.floor(this.copper / 10000);
    const silver = Math.floor((this.copper % 10000) / 100);
    const copper = Math.floor(this.copper % 100);

    const parts: string[] = [];
    
    if (gold > 0) {
      parts.push(`${gold}g`);
    }
    if (silver > 0) {
      parts.push(`${silver}s`);
    }
    if (copper > 0) {
      parts.push(`${copper}c`);
    }

    // If all values are zero, return "0c"
    return parts.length > 0 ? parts.join(' ') : '0c';
  }

  /**
   * Compares this Money instance with another for equality
   * @param other - Another Money instance to compare
   * @returns true if both have the same copper value
   */
  equals(other: Money): boolean {
    return Math.abs(this.copper - other.copper) < 0.0001; // Float comparison safety
  }

  /**
   * Gets the raw copper value (useful for database storage)
   * @returns The copper value
   */
  getCopper(): number {
    return this.copper;
  }

  /**
   * Adds two Money values
   * @param other - Money to add
   * @returns New Money instance with the sum
   */
  add(other: Money): Money {
    return Money.fromCopper(this.copper + other.copper);
  }

  /**
   * Subtracts another Money value from this one
   * @param other - Money to subtract
   * @returns New Money instance with the difference
   * @throws Error if result would be negative
   */
  subtract(other: Money): Money {
    const result = this.copper - other.copper;
    if (result < 0) {
      throw new Error('Cannot subtract: result would be negative');
    }
    return Money.fromCopper(result);
  }

  /**
   * Multiplies the money value by a factor
   * @param factor - Multiplication factor (must be non-negative)
   * @returns New Money instance with the product
   * @throws Error if factor is negative
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    // Removed Math.floor to keep precision for Iron?
    // But original multiply used Math.floor to keep integer. 
    // If we support Iron (float), we should probably NOT floor.
    return Money.fromCopper(this.copper * factor);
  }
}
