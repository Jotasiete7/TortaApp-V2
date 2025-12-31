import { MarketItem } from '../types';

/**
 * fileParser.ts - Versão 2.2 (Robust Pattern Hunter)
 * Otimizado para extrair Preço, QL e Nome de forma independente.
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

    let name = itemName.trim();
    let quantity = 1;

    // Regex para capturar padrões de quantidade no início da string
    const qtyRegex = /^(\d+k|\d+)\s*[x\s]+/i;
    const match = name.match(qtyRegex);

    if (match) {
        let qtyStr = match[1].toLowerCase();
        if (qtyStr.endsWith('k')) {
            quantity = parseFloat(qtyStr.replace('k', '')) * 1000;
        } else {
            quantity = parseInt(qtyStr, 10);
        }
        name = name.substring(match[0].length).trim();
    }

    const cleanName = name.replace(/\s+/g, ' ').trim();
    return { cleanName, quantity };
};

// --- COMPATIBILITY LAYER (Fix for LiveTradeMonitor build error) ---
export const FileParser = {
    isNoise: (message: string): boolean => {
        const lower = message.toLowerCase();
        const noiseTriggers = [
            'you create', 'you improve', 'you continue', 'finished',
            'starts to', 'fizzles', 'fails', 'you carefully',
            'you disable receiving', 'view the full trade', 'please pm the person',
            'this is the trade channel', 'only messages starting with'
        ];
        return noiseTriggers.some(t => lower.includes(t));
    },
    normalizePrice: (message: string): number => {
        if (!message) return 0.0;
        const s = String(message).toLowerCase().trim();

        let totalCopper = 0.0;
        // Regex caçador de unidades: g/gold, s/silver, c/copper, i/iron
        const regex = /([\d.]+)\s*(gold|silver|copper|iron|g|s|c|i)\b/g;
        let match;
        let foundMatch = false;

        while ((match = regex.exec(s)) !== null) {
            foundMatch = true;
            const val = parseFloat(match[1]);
            const unit = match[2];

            if (!isNaN(val)) {
                if (unit.startsWith('g')) totalCopper += val * 10000.0;
                else if (unit.startsWith('s')) totalCopper += val * 100.0;
                else if (unit.startsWith('c')) totalCopper += val;
                else if (unit.startsWith('i')) totalCopper += val / 100.0;
            }
        }
        return foundMatch ? totalCopper : 0.0;
    }
};

export const parseRecords = (logContent: string): MarketItem[] => {
    const lines = logContent.split(/\r?\n/);
    const records: MarketItem[] = [];
    const now = Date.now();

    const timeRegex = /^\[(\d{2}):(\d{2}):(\d{2})\]\s+(.*)/;

    lines.forEach((line) => {
        if (!line.trim()) return;

        const timeMatch = line.match(timeRegex);
        let message = line;
        let timestamp = now;

        if (timeMatch) {
            const [_, h, m, s] = timeMatch;
            const d = new Date();
            d.setHours(parseInt(h), parseInt(m), parseInt(s));
            timestamp = d.getTime();
            message = timeMatch[4];
        }

        // Noise Filter Check
        if (FileParser.isNoise(message)) return;

        // 1. Identificar Tipo de Ordem (Robust Regex)
        // Check first 30 chars for WTS/WTB to avoid confusion
        const prefix = message.substring(0, 30).toLowerCase();
        const isWTB = /\bwtb\b/i.test(prefix);
        const isWTS = /\bwts\b/i.test(prefix);

        // Filter out non-trade messages (unless we want EVERYTHING)
        if (!isWTB && !isWTS && !message.toLowerCase().includes('wtt')) {
            return;
        }

        const orderType = isWTB ? 'WTB' : (isWTS ? 'WTS' : 'UNKNOWN');

        // Extract Nickname (first word usually)
        const parts = message.split(' ');
        let nick = parts[0];

        // 2. Caçar o Preço na mensagem (Independent)
        const priceCopper = FileParser.normalizePrice(message);

        // Regex used for cleaning price text from name
        const priceRegex = /([\d.]+)\s*(gold|silver|copper|iron|g|s|c|i)\b/gi;

        // 3. Caçar o QL (Independent)
        const qlMatch = message.match(/QL[:\s]*(\d+(\.\d+)?)|(\d+(\.\d+)?)ql/i);
        const quality = qlMatch ? parseFloat(qlMatch[1] || qlMatch[3]) : 50.0;

        // 4. Caçar Raridade
        let rarity: 'Common' | 'Rare' | 'Supreme' | 'Fantastic' = 'Common';
        if (/\bfantastic\b/i.test(message)) rarity = 'Fantastic';
        else if (/\bsupreme\b/i.test(message)) rarity = 'Supreme';
        else if (/\brare\b/i.test(message)) rarity = 'Rare';

        // 5. Limpar o Nome do Item (O que sobrar é o nome)
        let cleanText = message
            .replace(nick, "") // Remove nick
            .replace(/\b(wts|wtb|wtt)\b/gi, "") // Remove known trade markers
            .replace(priceRegex, "") // Remove price text
            .replace(/QL[:\s]*(\d+(\.\d+)?)|(\d+(\.\d+)?)ql/gi, "") // Remove QL text
            .replace(/\([a-z]+\)/gi, "") // Remove server tags
            .replace(/\[|\]/g, "") // Remove brackets
            .replace(/[:>]/g, "") // Remove separators
            .replace(/\s+/g, " ") // Remove double spaces
            .trim();

        // Extração final de quantidade do nome limpo
        const { cleanName, quantity } = extractNameAndQty(cleanText);

        records.push({
            id: simpleHash(message + timestamp),
            timestamp,
            name: cleanName,
            price: priceCopper,
            quantity,
            quality,
            seller: nick,
            orderType,
            material: 'Unknown',
            rarity,
            raw_message: message
        });
    });

    return records;
};
