
// Data Models based on the implied Python structure
export interface MarketItem {
  id: string;
  name: string;
  material: string;
  quality: number;
  rarity: 'Common' | 'Rare' | 'Supreme' | 'Fantastic';
  price: number; // Normalized in COPPER (Unit Price: Total / Qty)
  quantity: number; // The bulk amount (e.g. 1000 for "1k stone")
  orderType: 'WTB' | 'WTS' | 'UNKNOWN';
  seller: string;
  location: string;
  timestamp: string;
  // Optimized field for search indexing (combines name, seller, material, etc.)
  searchableText: string;
}

export interface PredictionResult {
  predictedPrice: number; // In Copper
  confidence: number;
  zScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  avgPrice: number; // In Copper
  volume: number;
}

export interface ReferencePrice {
  itemName: string;
  price: number; // In Copper
}

export interface BulkAnalysis {
  hasBulks: boolean;
  bulkSizes: number[];
  bulkMultipliers: number[];
  recommendedBulk: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MARKET = 'MARKET',
  ANALYTICS = 'ANALYTICS',
  PREDICTOR = 'PREDICTOR',
  PRICEMANAGER = 'PRICEMANAGER',
  SETTINGS = 'SETTINGS'
}

export type Language = 'en' | 'pt';