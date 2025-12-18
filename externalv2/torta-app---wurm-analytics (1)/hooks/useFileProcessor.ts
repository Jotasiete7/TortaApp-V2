
import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketItem } from '../types';

// --- EMBEDDED WORKER CODE ---
// This ensures the worker loads correctly in all environments without 404s or MIME errors.
// We use a string to define the worker logic, which creates a Blob URL at runtime.
const WORKER_CODE = `
/* eslint-disable no-restricted-globals */

// --- HELPER FUNCTIONS (Inlined for Worker Isolation) ---

const normalizePrice = (text) => {
  if (!text) return 0;
  const cleanText = text.toLowerCase().replace(/,/g, '.').trim();

  const regex = /(?:(\\d+(?:\\.\\d+)?)\\s*g)|(?:(\\d+(?:\\.\\d+)?)\\s*s)|(?:(\\d+(?:\\.\\d+)?)\\s*c)|(?:(\\d+(?:\\.\\d+)?)\\s*i)/g;
  
  let totalCopper = 0;
  let match;
  let foundAny = false;

  while ((match = regex.exec(cleanText)) !== null) {
    foundAny = true;
    const gold = match[1] ? parseFloat(match[1]) : 0;
    const silver = match[2] ? parseFloat(match[2]) : 0;
    const copper = match[3] ? parseFloat(match[3]) : 0;
    const iron = match[4] ? parseFloat(match[4]) : 0;

    totalCopper += (gold * 10000);
    totalCopper += (silver * 100);
    totalCopper += copper;
    totalCopper += (iron * 0.01);
  }

  if (foundAny) return parseFloat(totalCopper.toFixed(4));

  const forMatch = cleanText.match(/for\\s+(\\d+(?:\\.\\d+)?)(?:\\s|$)/);
  if (forMatch) {
      const val = parseFloat(forMatch[1]);
      if (!isNaN(val)) {
          if (val < 100 && val % 1 !== 0) return val * 100;
          return val;
      }
  }

  const tokens = cleanText.replace(/[^\\d\\.]/g, ' ').split(/\\s+/);
  const lastNum = tokens[tokens.length - 1];
  
  if (lastNum && !isNaN(parseFloat(lastNum))) {
      const val = parseFloat(lastNum);
      const isJustNumber = /^\\d+(?:\\.\\d+)?$/.test(cleanText);
      if (isJustNumber) {
          return val;
      }
      if (val < 50 && val % 1 !== 0) return val * 100;
      return val;
  }

  return 0;
};

function convertQuantity(qtyStr) {
    const numericPart = qtyStr.replace(/x/i, '');
    if (numericPart.toLowerCase().endsWith('k')) {
        const value = parseFloat(numericPart.slice(0, -1));
        return Math.round(value * 1000);
    }
    return parseFloat(numericPart);
}

function extractNameAndQty(rawName) {
    const regex = /^\\s*([\\d\\.]+(?:k|x)?\\s*)?(.*)/i;
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
        const escQty = rawQtyPart.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
        cleanName = rawNamePart.replace(new RegExp('^' + escQty + '\\\\s*', 'i'), '').trim();
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

const detectOrderType = (line, operation) => {
  if (operation === 'WTB') return 'WTB';
  if (operation === 'WTS') return 'WTS';
  
  const l = line.toUpperCase();
  if (l.includes('WTB') || l.includes('BUYING') || l.includes('BUY')) return 'WTB';
  if (l.includes('WTS') || l.includes('SELLING') || l.includes('SELL')) return 'WTS';
  return 'UNKNOWN';
};

const extractRarity = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('fantastic')) return 'Fantastic';
  if (lowerName.includes('supreme')) return 'Supreme';
  if (lowerName.includes('rare')) return 'Rare';
  return 'Common';
};

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

const isNoise = (text, player) => {
  if (player === 'System') return true;
  if (!text) return true;
  const lower = text.toLowerCase().trim();
  if (NOISE_PHRASES.some(phrase => lower.includes(phrase))) return true;
  return false;
};

const isJunkItem = (itemName) => {
    const lower = itemName.toLowerCase();
    if (['common', 'rare', 'supreme', 'fantastic'].includes(lower)) return true;
    if (JUNK_ITEM_KEYWORDS.some(kw => lower.includes(kw))) return true;
    return false;
};

const parseTradeLine = (line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    try {
        if (trimmedLine.startsWith('{')) {
            const json = JSON.parse(trimmedLine);
            if (isNoise(json.raw_text, json.player)) return null;

            let rawName = json.main_item || "Unknown Item";
            const extraction = extractNameAndQty(rawName);
            
            if (isJunkItem(extraction.cleanName)) return null;

            let totalPrice = normalizePrice(json.price_s);
            if (totalPrice === 0 && json.raw_text) {
                totalPrice = normalizePrice(json.raw_text);
            }

            let finalQty = json.main_qty && json.main_qty > 1 ? json.main_qty : extraction.quantity;
            let unitPrice = totalPrice / finalQty;

            let quality = 0;
            if (json.main_ql) quality = parseFloat(json.main_ql);
            else if (json.items && json.items.length > 0 && json.items[0].ql) quality = parseFloat(json.items[0].ql);

            let itemData = {
                id: 'json-' + index,
                name: extraction.cleanName,
                material: "Unknown", 
                quality: quality || 0,
                rarity: extractRarity(rawName),
                price: unitPrice,
                quantity: finalQty,
                orderType: detectOrderType(json.raw_text, json.operation),
                seller: json.player || "Unknown",
                location: json.server || "Wurm",
                timestamp: json.date || new Date().toISOString().split('T')[0],
                // Placeholder for searchableText, filled below
                searchableText: ''
            };
            
            if (itemData.name !== "Unknown Item" && itemData.seller !== 'System') {
                 itemData.name = itemData.name.replace(/[^\\w\\s-]/g, '').trim();
                 // Generate Searchable Text (Lowercase) for Indexing
                 itemData.searchableText = (itemData.name + " " + itemData.seller + " " + itemData.material + " " + itemData.orderType).toLowerCase();
                 return itemData;
            }
            return null;

        } else {
            if (isNoise(trimmedLine)) return null;

            const orderType = detectOrderType(trimmedLine);
            const totalPrice = normalizePrice(trimmedLine); 
            
            let dirtyName = trimmedLine
                .replace(/\\[.*?\\]/, '') 
                .replace(/<.*?>/, '') 
                .replace(/wtb|wts|buying|selling|for/gi, '') 
                .replace(/(?:(\\d+(?:\\.\\d+)?)\\s*g)|(?:(\\d+(?:\\.\\d+)?)\\s*s)|(?:(\\d+(?:\\.\\d+)?)\\s*c)|(?:(\\d+(?:\\.\\d+)?)\\s*i)/gi, '')
                .trim();
             
             const extraction = extractNameAndQty(dirtyName);
             
             if (extraction.cleanName.length < 3) return null;
             if (isJunkItem(extraction.cleanName)) return null;

             const sellerMatch = trimmedLine.match(/<([^>]+)>/);

             let itemData = {
                id: 'raw-' + index,
                name: extraction.cleanName,
                material: "Unknown",
                quality: 0,
                rarity: extractRarity(dirtyName),
                price: totalPrice / extraction.quantity,
                quantity: extraction.quantity,
                orderType,
                seller: sellerMatch ? sellerMatch[1] : "Unknown",
                location: "Unknown",
                timestamp: new Date().toISOString().split('T')[0],
                searchableText: ''
             };

             if (itemData.name !== "Unknown Item") {
                itemData.name = itemData.name.replace(/[^\\w\\s-]/g, '').trim();
                itemData.searchableText = (itemData.name + " " + itemData.seller + " " + itemData.orderType).toLowerCase();
                return itemData;
             }
             return null;
        }
    } catch (e) {
        return null;
    }
};

// --- MAIN WORKER EXECUTION ---

self.onmessage = async (event) => {
    const file = event.data.file;
    if (!file) {
        self.postMessage({ type: 'error', message: 'No file received' });
        return;
    }

    const totalSize = file.size;
    let processedSize = 0;
    const results = [];
    let lineIndex = 0;

    try {
        console.log('Worker started processing file:', file.name);
        
        const stream = file.stream();
        const textDecoder = new TextDecoderStream();
        const readableStream = stream.pipeThrough(textDecoder);
        const reader = readableStream.getReader();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (value) {
                buffer += value;
                processedSize += value.length; 
                
                const lines = buffer.split(/\\r?\\n/);
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const item = parseTradeLine(line, lineIndex++);
                    if (item) {
                        results.push(item);
                    }
                }
                
                const progress = Math.min(100, Math.floor((processedSize / totalSize) * 100));
                
                if (progress % 2 === 0 || progress === 100) { 
                     self.postMessage({ type: 'progress', progress });
                }
            }

            if (done) break;
        }

        if (buffer.trim()) {
            const item = parseTradeLine(buffer, lineIndex++);
            if (item) results.push(item);
        }
        
        console.log('Worker finished. Records parsed:', results.length);
        self.postMessage({ type: 'success', data: results });

    } catch (error) {
        console.error('Worker Error:', error);
        self.postMessage({ type: 'error', message: error.message || 'Unknown worker error' });
    }
};
`;

export const useFileProcessor = () => {
    const [data, setData] = useState<MarketItem[] | null>(null);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    const processFile = useCallback((file: File) => {
        setIsLoading(true);
        setProgress(0);
        setError(null);
        setData(null);
        
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        console.log("Initializing Embedded Worker for file:", file.name);

        try {
            if (workerRef.current) workerRef.current.terminate();
            
            workerRef.current = new Worker(workerUrl);

            // Timeout safety for hung workers
            const timeout = setTimeout(() => {
                 if (isLoading && progress === 0) {
                     console.warn("Worker timed out or failed to start.");
                 }
            }, 5000);

            workerRef.current.onmessage = (event) => {
                const { type, data: workerData, progress: workerProgress, message } = event.data;

                if (type === 'progress') {
                    setProgress(workerProgress);
                    clearTimeout(timeout);
                } else if (type === 'success') {
                    setData(workerData);
                    setIsLoading(false);
                    setProgress(100);
                    clearTimeout(timeout);
                    URL.revokeObjectURL(workerUrl);
                } else if (type === 'error') {
                    setError(message);
                    setIsLoading(false);
                    clearTimeout(timeout);
                    URL.revokeObjectURL(workerUrl);
                }
            };

            workerRef.current.onerror = (err) => {
                console.error("Worker Error Event:", err);
                const msg = err instanceof ErrorEvent ? err.message : "Worker execution failed (syntax error or blocked)";
                setError(`Worker Error: ${msg}`);
                setIsLoading(false);
                clearTimeout(timeout);
                URL.revokeObjectURL(workerUrl);
            };

            workerRef.current.postMessage({ file });

        } catch (e: any) {
            console.error("Failed to initialize worker:", e);
            setError(`Failed to initialize parser: ${e.message}`);
            setIsLoading(false);
            URL.revokeObjectURL(workerUrl);
        }
    }, [isLoading, progress]);

    return { data, progress, isLoading, error, processFile };
};
