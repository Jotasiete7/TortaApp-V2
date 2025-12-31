import { MarketItem } from '../types';

/**
 * fileParser.ts
 * 
 * Optimized V2.1 (Manus AI)
 * - Improved `extractNameAndQty` to handle "2k", "100x", names with spaces.
 * - Improved Parse Logic for Rarity (Word Boundaries).
 * - General Robustness improvements.
 */

// Helper to calculate a simple hash for deduplication
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

export const parseTradeFile = async (file: File): Promise<MarketItem[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (!content) {
                resolve([]);
                return;
            }
            const records = parseRecords(content);
            resolve(records);
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

/**
 * Otimização da função extractNameAndQty para lidar com variações de quantidade e nomes compostos.
 */
export const extractNameAndQty = (itemName: string): { cleanName: string, quantity: number } => {
    if (!itemName) return { cleanName: '', quantity: 1 };

    // 1. Normaliza a string (remove espaços extras, etc.)
    let name = itemName.trim();
    let quantity = 1;

    // 2. Regex para capturar padrões de quantidade no início da string:
    // Exemplos: "100x", "2k", "50 ", "1000 "
    // O padrão (\d+k|\d+) captura números inteiros ou números seguidos de 'k' (para milhares).
    // O padrão [x\s]+ captura 'x' ou um ou mais espaços.
    const qtyRegex = /^(\d+k|\d+)\s*[x\s]+/i;
    const match = name.match(qtyRegex);

    if (match) {
        let qtyStr = match[1].toLowerCase();

        if (qtyStr.endsWith('k')) {
            // Converte "2k" para 2000
            quantity = parseFloat(qtyStr.replace('k', '')) * 1000;
        } else {
            // Converte "100" para 100
            quantity = parseInt(qtyStr, 10);
        }

        // Remove o prefixo de quantidade da string original
        name = name.substring(match[0].length).trim();
    }

    // 3. Limpeza final: remove espaços em excesso
    const cleanName = name.replace(/\s+/g, ' ').trim();

    return { cleanName, quantity };
};

export const parseRecords = (logContent: string): MarketItem[] => {
    const lines = logContent.split(/\r?\n/);
    const records: MarketItem[] = [];
    const now = Date.now(); // Fallback timestamp if parsing fails

    // Regex for standard Wurm logs timestamps: [HH:mm:ss]
    const timeRegex = /^\[(\d{2}):(\d{2}):(\d{2})\]\s+(.*)/;

    // Regex for Trade channel messages
    // Format: "PlayerName (Server) WTS/WTB [Item Name] QL:X ..."
    // We need to be flexible.

    lines.forEach((line) => {
        if (!line.trim()) return;

        const timeMatch = line.match(timeRegex);
        let message = line;
        let timestamp = now;

        if (timeMatch) {
            // Construct a rudimentary timestamp (assuming today for simplicity, usually need Date parsing)
            const [_, h, m, s] = timeMatch;
            const d = new Date();
            d.setHours(parseInt(h), parseInt(m), parseInt(s));
            timestamp = d.getTime();
            message = timeMatch[4];
        }

        // Filter valid trade messages
        if (!message.includes('WTS') && !message.includes('WTB') && !message.includes('WTT')) {
            return;
        }

        // Extract Order Type
        let orderType: 'WTS' | 'WTB' | 'UNKNOWN' = 'UNKNOWN';
        if (message.includes('WTS')) orderType = 'WTS';
        else if (message.includes('WTB')) orderType = 'WTB';

        // Extract Nickname (first word usually, or before (Server))
        // Simple heuristic: First word is nick.
        const parts = message.split(' ');
        let nick = parts[0];

        // Handling Server Tags usually: "Nick (Cad) WTS..."
        if (parts[1]?.startsWith('(') && parts[1]?.endsWith(')')) {
            // It's a cross-server message, nick is correct.
        }

        // Extract Price (Patterns: "1s", "50c", "1g", "1.5s")
        // Regex looks for digits followed by g, s, or c.
        const priceRegex = /(\d+(?:\.\d+)?)\s*(g|s|c)/i;
        const priceMatch = message.match(priceRegex);
        let price = 0;

        if (priceMatch) {
            const val = parseFloat(priceMatch[1]);
            const unit = priceMatch[2].toLowerCase();
            if (unit === 'g') price = val * 10000;
            else if (unit === 's') price = val * 100;
            else price = val;
        }

        // Extract Quality (QL)
        // Patterns: "QL:50", "ql 90", "90ql"
        const qlRegex = /(?:ql[:\s]*)(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)ql/i;
        const qlMatch = message.match(qlRegex);
        let quality = 50; // Default QL
        if (qlMatch) {
            quality = parseFloat(qlMatch[1] || qlMatch[2]);
        }

        // Extract Rarity (Manus Improved Logic)
        let rarity: 'Common' | 'Rare' | 'Supreme' | 'Fantastic' = 'Common';
        // Use word boundaries to avoid 'rarely' being detected as 'Rare'
        if (/\bfantastic\b/i.test(message)) rarity = 'Fantastic';
        else if (/\bsupreme\b/i.test(message)) rarity = 'Supreme';
        else if (/\brare\b/i.test(message)) rarity = 'Rare';

        // Extract Item Name
        // This is the hardest part. Removing WTS/WTB, removing Price, removing QL.
        // We defer semantic cleaning to ItemIdentity, but here we do structural cleaning.
        let paramsToRemove = [
            nick,
            'WTS', 'WTB', 'WTT', ':', '>',
            // Server tags
            /\([a-z]+\)/gi,
            // Price strings
            priceMatch ? priceMatch[0] : '',
            // QL strings
            qlMatch ? qlMatch[0] : '',
            // Rarity strings (optional, keep them for now or strip?)
            // Usually we strip them in ItemIdentity. Let's keep name as raw as possible but without the obvious trash.
        ];

        let rawName = message;

        // Remove known structural parts
        paramsToRemove.forEach(p => {
            if (!p) return;
            if (typeof p === 'string') {
                rawName = rawName.replace(p, '');
            } else {
                rawName = rawName.replace(p, '');
            }
        });

        // Use the new extractor for quantity and clean name
        const { cleanName, quantity } = extractNameAndQty(rawName);

        records.push({
            id: simpleHash(message + timestamp),
            timestamp,
            name: cleanName, // Validated/Cleaned Name
            price,
            quantity,
            quality,
            seller: nick,
            orderType,
            material: 'Unknown', // Material detection is handled elsewhere or could be here
            rarity,
            raw_message: message
        });
    });

    return records;
};

// --- COMPATIBILITY LAYER (Fix for LiveTradeMonitor build error) ---
export const FileParser = {
    isNoise: (message: string): boolean => {
        const lower = message.toLowerCase();
        // Common crafting/spam variations to ignore in Trade Monitor
        const noiseTriggers = [
            'you create', 'you improve', 'you continue', 'finished',
            'starts to', 'fizzles', 'fails', 'you carefully'
        ];
        return noiseTriggers.some(t => lower.includes(t));
    }
};
