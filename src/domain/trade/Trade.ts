import { Money } from '../price/Money';

/**
 * Represents a trade parsed directly from the Advanced Parser (Rust backend)
 * Uses primitive types for all fields to match the Rust ParsedTrade struct
 * 
 * Fields correspond to:
 * - timestamp: Trade timestamp (format: "HH:MM:SS")
 * - nick: Player nickname
 * - message: Original chat message
 * - tradeType: Type of trade ("WTS", "WTB", "WTT")
 * - item: Extracted item name
 * - quality: Item quality level (0-100)
 * - rarity: Item rarity ("rare", "supreme", "fantastic")
 * - priceCopper: Price in copper (smallest currency unit)
 */
export interface ParsedTrade {
  timestamp: string;
  nick: string;
  message: string;
  tradeType: string | null;
  item: string | null;
  quality: number | null;
  rarity: string | null;
  priceCopper: number | null;
}

/**
 * Represents an enriched trade with Money class for price handling
 * 
 * This interface extends the concept of ParsedTrade but replaces
 * the primitive priceCopper field with a Money instance for better
 * type safety and currency operations.
 * 
 * Use this interface when working with trades in the application layer
 * after they have been enriched with domain objects.
 */
export interface EnrichedTrade {
  timestamp: string;
  nick: string;
  message: string;
  tradeType: string | null;
  item: string | null;
  quality: number | null;
  rarity: string | null;
  price: Money | null;
}
