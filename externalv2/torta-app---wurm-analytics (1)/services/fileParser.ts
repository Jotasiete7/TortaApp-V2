
import { MarketItem } from '../types';

/**
 * Wurm Online Currency Normalizer
 * Rule: 1g = 10000c, 1s = 100c, 1i = 0.01c
 * MIGRATION PLAN: We normalize to COPPER (number).
 */
export const normalizePrice = (text: string | null): number => {
  if (!text) return 0;
  // Normalize string: "1g 50s" -> "1g50s", remove commas, lower case
  const cleanText = text.toLowerCase().replace(/,/g, '.').trim();

  // 1. Standard Currency Regex (e.g., "1g 50s 20c")
  const regex = /(?:(\d+(?:\.\d+)?)\s*g)|(?:(\d+(?:\.\d+)?)\s*s)|(?:(\d+(?:\.\d+)?)\s*c)|(?:(\d+(?:\.\d+)?)\s*i)/g;
  
  let totalCopper = 0;
  let match;
  let foundAny = false;

  while ((match = regex.exec(cleanText)) !== null) {
    foundAny = true;
    const gold = match[1] ? parseFloat(match[1]) : 0;
    const silver = match[2] ? parseFloat(match[2]) : 0;
    const copper = match[3] ? parseFloat(match[3]) : 0;
    const iron = match[4] ? parseFloat(match[4]) : 0;

    totalCopper += (gold * 10000);  // 1g = 10000c
    totalCopper += (silver * 100);  // 1s = 100c
    totalCopper += copper;          // 1c = 1c
    totalCopper += (iron * 0.01);   // 1i = 0.01c
  }

  if (foundAny) return parseFloat(totalCopper.toFixed(4));

  // 2. Fallback: Aggressive Pattern Matching for unitless prices
  // Example: "for 175" or ending with "175"
  
  // Try "for X" pattern
  const forMatch = cleanText.match(/for\s+(\d+(?:\.\d+)?)(?:\s|$)/);
  if (forMatch) {
      const val = parseFloat(forMatch[1]);
      if (!isNaN(val)) {
          // Heuristic: If float < 100, assume Silver (1.5 -> 150c). Integers -> Copper.
          if (val < 100 && val % 1 !== 0) return val * 100;
          return val;
      }
  }

  // Try extracting the last number in the string (common in CSV or simple logs: "Item;Qty;Price")
  // or "WTS 1000 bricks 200"
  const tokens = cleanText.replace(/[^\d\.]/g, ' ').split(/\s+/);
  const lastNum = tokens[tokens.length - 1];
  
  if (lastNum && !isNaN(parseFloat(lastNum))) {
      const val = parseFloat(lastNum);
      
      // If the original text was literally just a number (like from CSV), trust it perfectly.
      const isJustNumber = /^\d+(?:\.\d+)?$/.test(cleanText);
      if (isJustNumber) {
          // If CSV price has decimals (e.g. 175.5), treat as Copper.
          return val;
      }

      // For chat logs, apply heuristic
      if (val < 50 && val % 1 !== 0) return val * 100; // 0.5 -> 50c
      return val; // 175 -> 175c
  }

  return 0;
};

/**
 * HELPER: Convert quantity string (1k, 1000x) to number
 */
function convertQuantity(qtyStr: string): number {
    const numericPart = qtyStr.replace(/x/i, '');
    if (numericPart.toLowerCase().endsWith('k')) {
        const value = parseFloat(numericPart.slice(0, -1));
        return Math.round(value * 1000);
    }
    return parseFloat(numericPart);
}

/**
 * HELPER: Extract Name and Quantity from raw string
 * Handles: "1k stone bricks", "1000x iron lump", "stone bricks"
 */
export function extractNameAndQty(rawName: string): { cleanName: string; quantity: number; isBulk: boolean } {
    // Regex: Start, optional number+(k/x), optional space, rest of string
    const regex = /^\s*([\d\.]+(?:k|x)?\s*)?(.*)/i;
    const match = rawName.trim().match(regex);

    if (!match) {
        return { cleanName: rawName.trim(), quantity: 1, isBulk: false };
    }

    const rawQtyPart = match[1] ? match[1].trim() : '';
    const rawNamePart = match[2] ? match[2].trim() : rawName.trim();

    let quantity = 1;
    let isBulk = false;
    let cleanName = rawNamePart;

    if (rawQtyPart) {
        quantity = convertQuantity(rawQtyPart);
        isBulk = quantity > 1;
        
        // Double check: remove the qty part from name if it stuck around
        // Escape special chars for regex replacement
        const escQty = rawQtyPart.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        cleanName = rawNamePart.replace(new RegExp(`^${escQty}\\s*`, 'i'), '').trim();
    }

    if (isNaN(quantity) || quantity <= 0) {
        quantity = 1;
        isBulk = false;
    }

    return {
        cleanName: cleanName || rawName.trim(),
        quantity: quantity,
        isBulk: isBulk
    };
}

export const detectOrderType = (line: string, operation?: string | null): 'WTB' | 'WTS' | 'UNKNOWN' => {
  if (operation === 'WTB') return 'WTB';
  if (operation === 'WTS') return 'WTS';
  
  const l = line.toUpperCase();
  if (l.includes('WTB') || l.includes('BUYING') || l.includes('BUY')) return 'WTB';
  if (l.includes('WTS') || l.includes('SELLING') || l.includes('SELL')) return 'WTS';
  return 'UNKNOWN';
};

export const extractRarity = (name: string): 'Common' | 'Rare' | 'Supreme' | 'Fantastic' => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('fantastic')) return 'Fantastic';
  if (lowerName.includes('supreme')) return 'Supreme';
  if (lowerName.includes('rare')) return 'Rare';
  return 'Common';
};

// --- NOISE FILTERS ---
const NOISE_PHRASES = [
  "this is the trade channel",
  "only messages starting with",
  "please pm the person",
  "you can disable receiving",
  "joined the channel",
  "left the channel",
  "view the full trade chat etiquette",
  "you can also use @ to"
];

const JUNK_ITEM_KEYWORDS = ["common", "null", "fragment", "casket", "clay", "dirt", "sand"];

export const isNoise = (text: string, player?: string | null): boolean => {
  if (player === 'System') return true;
  if (!text) return true;
  const lower = text.toLowerCase().trim();
  if (NOISE_PHRASES.some(phrase => lower.includes(phrase))) return true;
  return false;
};

export const isJunkItem = (itemName: string): boolean => {
    const lower = itemName.toLowerCase();
    if (['common', 'rare', 'supreme', 'fantastic'].includes(lower)) return true;
    if (JUNK_ITEM_KEYWORDS.some(kw => lower.includes(kw))) return true;
    return false;
};

/**
 * Core parsing logic for a single line.
 * Can handle both JSONL (object) and Raw Text.
 */
export const parseTradeLine = (line: string, index: number): MarketItem | null => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    try {
        // Detect JSONL
        if (trimmedLine.startsWith('{')) {
            const json = JSON.parse(trimmedLine);
            if (isNoise(json.raw_text, json.player)) return null;

            // Raw Name Extraction
            let rawName = json.main_item || "Unknown Item";
            
            // Bulk Extraction Logic
            const extraction = extractNameAndQty(rawName);
            
            if (isJunkItem(extraction.cleanName)) return null;

            // Price Processing
            let totalPrice = normalizePrice(json.price_s);
            // Fallback to raw text if price_s is missing/zero but text has something like "for 175"
            if (totalPrice === 0 && json.raw_text) {
                totalPrice = normalizePrice(json.raw_text);
            }

            // Calculate UNIT Price
            // If main_qty is explicit in JSON, use that, otherwise use regex extracted qty
            let finalQty = json.main_qty && json.main_qty > 1 ? json.main_qty : extraction.quantity;
            let unitPrice = totalPrice / finalQty;

            // Quality
            let quality = 0;
            if (json.main_ql) quality = parseFloat(json.main_ql);
            else if (json.items && json.items.length > 0 && json.items[0].ql) quality = parseFloat(json.items[0].ql);

            let itemData: MarketItem = {
                id: `json-${index}`,
                name: extraction.cleanName,
                material: "Unknown", 
                quality: quality || 0,
                rarity: extractRarity(rawName),
                price: unitPrice, // STORE UNIT PRICE
                quantity: finalQty, // STORE QTY
                orderType: detectOrderType(json.raw_text, json.operation),
                seller: json.player || "Unknown",
                location: json.server || "Wurm",
                timestamp: json.date || new Date().toISOString().split('T')[0],
                searchableText: ''
            };
            
             // Final cleanup
            if (itemData.name !== "Unknown Item" && itemData.seller !== 'System') {
                 itemData.name = itemData.name.replace(/[^\w\s-]/g, '').trim(); 
                 itemData.searchableText = (itemData.name + " " + itemData.seller + " " + itemData.material + " " + itemData.orderType).toLowerCase();
                 return itemData;
            }
            return null;

        } else {
            // --- TEXT PARSING ---
            if (isNoise(trimmedLine)) return null;

            const orderType = detectOrderType(trimmedLine);
            const totalPrice = normalizePrice(trimmedLine); 
            
            let dirtyName = trimmedLine
                .replace(/\[.*?\]/, '') 
                .replace(/<.*?>/, '') 
                .replace(/wtb|wts|buying|selling|for/gi, '') 
                .replace(/(?:(\d+(?:\.\d+)?)\s*g)|(?:(\d+(?:\.\d+)?)\s*s)|(?:(\d+(?:\.\d+)?)\s*c)|(?:(\d+(?:\.\d+)?)\s*i)/gi, '')
                .trim();
             
             // Bulk Extraction
             const extraction = extractNameAndQty(dirtyName);
             
             if (extraction.cleanName.length < 3) return null;
             if (isJunkItem(extraction.cleanName)) return null;

             const sellerMatch = trimmedLine.match(/<([^>]+)>/);

             let itemData: MarketItem = {
                id: `raw-${index}`,
                name: extraction.cleanName,
                material: "Unknown",
                quality: 0,
                rarity: extractRarity(dirtyName),
                price: totalPrice / extraction.quantity, // Unit Price
                quantity: extraction.quantity,
                orderType,
                seller: sellerMatch ? sellerMatch[1] : "Unknown",
                location: "Unknown",
                timestamp: new Date().toISOString().split('T')[0],
                searchableText: ''
             };

             if (itemData.name !== "Unknown Item") {
                itemData.name = itemData.name.replace(/[^\w\s-]/g, '').trim();
                itemData.searchableText = (itemData.name + " " + itemData.seller + " " + itemData.orderType).toLowerCase();
                return itemData;
             }
             return null;
        }
    } catch (e) {
        return null;
    }
};

/**
 * LEGACY (Synchronous): Kept for reference or small file fallbacks
 */
export const parseTradeFile = (file: File): Promise<MarketItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        reject(new Error("File is empty"));
        return;
      }

      console.time('ParserJSONL');
      const lines = text.split(/\r?\n/);
      const data: MarketItem[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const item = parseTradeLine(lines[i], i);
        if (item) data.push(item);
      }
      
      console.timeEnd('ParserJSONL');
      console.log(`Parsed ${data.length} valid trade records.`);
      resolve(data);
    };

    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
