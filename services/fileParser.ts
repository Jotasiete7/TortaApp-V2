
/**
 * fileParser.ts
 * Service responsible for parsing and cleaning raw data from Wurm Online logs.
 */

import { MarketItem } from '../types';

export interface TradeRecord {
    timestamp: string;
    sender: string;
    raw_text: string;
    price_copper: number;
    item_name: string;
    // Add other fields as necessary
}

export class FileParser {

    // 1. CONSTANTE: Lista de Termos de RuÃ­do (Stop Words)
    private static readonly NOISE_TERMS = [
        "You can disable receiving these messages",
        "View the full Trade Chat Etiquette",
        "Please PM the person if you",
        "This is the Trade channel",
        "Only messages starting with WTB, WTS",
        "You can also use @<name> to",
        "common",
        "rare",
        "null",
        "fragment",
        "casket",
        "clay",
    ];

    /**
     * Normalizes a price string into a numeric Copper value.
     */
    public static normalizePrice(priceVal: string | number | null | undefined): number {
        if (priceVal === null || priceVal === undefined) {
            return 0.0;
        }

        const s = String(priceVal).toLowerCase().trim();
        if (!s || s === 'nan' || s === 'none') {
            return 0.0;
        }

        const cleanStr = s.replace(',', '.');
        const directVal = parseFloat(cleanStr);
        if (!isNaN(directVal) && /^-?\d*(\.\d+)?$/.test(cleanStr)) {
            return directVal;
        }

        let totalCopper = 0.0;
        const regex = /([\d.]+)\s*([gsci])/g;
        let match;
        let foundMatch = false;

        while ((match = regex.exec(cleanStr)) !== null) {
            foundMatch = true;
            const val = parseFloat(match[1]);
            const unit = match[2];

            if (!isNaN(val)) {
                switch (unit) {
                    case 'g': totalCopper += val * 10000.0; break;
                    case 's': totalCopper += val * 100.0; break;
                    case 'c': totalCopper += val; break;
                    case 'i': totalCopper += val / 100.0; break;
                }
            }
        }

        if (foundMatch) {
            return totalCopper;
        }

        return 0.0;
    }

    public static isNoise(text: string): boolean {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return FileParser.NOISE_TERMS.some(term => lowerText.includes(term.toLowerCase()));
    }

    public static parseRecords(rawRecords: any[]): TradeRecord[] {
        const parsedRecords: TradeRecord[] = [];

        for (const record of rawRecords) {
            // Support both formats: direct fields or nested in 'raw_text'
            const rawText = record.raw_text || record.raw || "";
            const itemName = record.main_item || record.item_name || "";
            const sender = record.player || record.sender || "Unknown";

            // Handle price: could be 'price_s' (string), 'price_raw', or 'price'
            const priceStr = record.price_s || record.price_raw || record.price_str || record.price;

            if (this.isNoise(rawText) || this.isNoise(itemName)) {
                continue;
            }

            const priceCopper = this.normalizePrice(priceStr);

            parsedRecords.push({
                timestamp: record.timestamp,
                sender: sender,
                raw_text: rawText,
                item_name: itemName,
                price_copper: priceCopper
            });
        }

        return parsedRecords;
    }
}

// --- EXPORTED FUNCTIONS FOR APP COMPATIBILITY ---

export const parseTradeFile = async (file: File): Promise<MarketItem[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) {
                    resolve([]);
                    return;
                }

                let rawRecords: any[] = [];

                // 1. Try Standard JSON Array (Fast path for small files)
                if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
                    try {
                        const json = JSON.parse(text);
                        if (Array.isArray(json)) {
                            rawRecords = json;
                        }
                    } catch (e) {
                        // Fallback to line parsing if JSON parse fails
                    }
                }

                // 2. NDJSON / Log Parsing (Memory Efficient)
                if (rawRecords.length === 0) {
                    let startIndex = 0;
                    let newlineIndex = text.indexOf('\n');

                    while (startIndex < text.length) {
                        const endIndex = newlineIndex === -1 ? text.length : newlineIndex;
                        const line = text.substring(startIndex, endIndex).trim();

                        if (line) {
                            try {
                                const record = JSON.parse(line);
                                rawRecords.push(record);
                            } catch (err) {
                                // Ignore invalid lines
                            }
                        }

                        if (newlineIndex === -1) break;
                        startIndex = newlineIndex + 1;
                        newlineIndex = text.indexOf('\n', startIndex);
                    }
                }

                if (rawRecords.length === 0) {
                    console.warn("No valid records found. File might be empty or unknown format.");
                    resolve([]);
                    return;
                }

                const records = FileParser.parseRecords(rawRecords);

                // Map to MarketItem
                const marketItems: MarketItem[] = records.map((r, index) => ({
                    id: String(index),
                    name: (r.item_name || 'Unknown'),
                    price: r.price_copper,
                    quantity: 1, // Default to 1 if not parsed
                    quality: 50, // Default
                    seller: (r.sender || 'Unknown'),
                    timestamp: (r.timestamp ? new Date(r.timestamp).getTime() : Date.now()),
                                        orderType: (r.raw_text ? (r.raw_text.toLowerCase().startsWith('wtb') ? 'WTB' : 'WTS') : 'UNKNOWN'),
                    rarity: 'Common', // Default
                    material: 'Unknown',
                    searchableText: ((r.item_name || '') + ' ' + (r.sender || '') + ' ' + 'Common' + ' ' + 'Unknown').toLowerCase()
                }));

                resolve(marketItems);

            } catch (error) {
                console.error("Critical error during file parsing:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(error);
        };

        // Use readAsText. For 130MB it should be fine in modern browsers.
        reader.readAsText(file);
    });
};

export const extractNameAndQty = (itemName: string): { cleanName: string, quantity: number } => {
    if (!itemName) return { cleanName: '', quantity: 1 };

    // Regex to find "100x", "100 ", "1k" at start
    const qtyRegex = /^(\d+)[x\s]+(.+)/i;
    const match = itemName.match(qtyRegex);

    if (match) {
        return {
            quantity: parseInt(match[1]),
            cleanName: match[2].trim()
        };
    }

    return { cleanName: itemName, quantity: 1 };
};


