
import { MarketItem } from '../types';

export interface SearchResult {
    id: string; // New
    item: string; // Display Name
    score: number;
    avgPrice: number;
    volume: number;
    category: string;
}

const RECENT_SEARCHES_KEY = 'tortaapp_recent_searches_v2'; // Updated key
const MAX_RECENT = 5;

/**
 * Calculate fuzzy match score between query and target
 */
export function fuzzyMatch(query: string, target: string): number {
    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    if (q === t) return 100; // Perfect match
    if (t.includes(q)) return 90; // Substring match
    if (t.startsWith(q)) return 95; // Prefix match (even better)

    // Calculate Levenshtein-based score
    const distance = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - (distance / maxLen);

    // Bonus for word boundary matches
    const words = t.split(/\s+/);
    const wordMatch = words.some(w => w.startsWith(q));
    const wordBonus = wordMatch ? 20 : 0;

    return Math.min(100, Math.round(similarity * 70 + wordBonus));
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Search items with fuzzy matching.
 */
export function searchItems(
    query: string,
    items: { id: string, name: string }[],
    rawData: MarketItem[],
    limit: number = 10
): SearchResult[] {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];

    items.forEach(itemObj => {
        const score = fuzzyMatch(query, itemObj.name); // Match against name
        if (score > 30) {
            // Aggregating metadata requires ID filter now
            const itemData = rawData.filter(d => d.itemId === itemObj.id);
            const avgPrice = itemData.length > 0
                ? itemData.reduce((sum, d) => sum + d.price, 0) / itemData.length
                : 0;
            const volume = itemData.length;
            const category = categorizeItem(itemObj.name); 

            results.push({
                id: itemObj.id,
                item: itemObj.name,
                score,
                avgPrice,
                volume,
                category
            });
        }
    });

    return results
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.volume - a.volume;
        })
        .slice(0, limit);
}

/**
 * Categorize item by name
 */
export function categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    // -- ANIMALS & MOUNTS --
    if (name.includes('horse') || name.includes('foal') || name.includes('mare') || name.includes('stallion')) return 'Animals';
    if (name.includes('cow') || name.includes('bull') || name.includes('sheep') || name.includes('ram')) return 'Animals';
    if (name.includes('dog') || name.includes('cat') || name.includes('spider')) return 'Animals';

    // -- STORAGE --
    if (name.includes('casket') || name.includes('chest') || name.includes('coffer') || name.includes('trunk')) return 'Storage';
    if (name.includes('barrel') || name.includes('bin') || name.includes('crate') || name.includes('rack')) return 'Storage';
    
    // -- SHIPS --
    if (name.includes('ship') || name.includes('boat') || name.includes('knarr') || name.includes('corbita')) return 'Boats';
    if (name.includes('cog') || name.includes('caravel') || name.includes('yacht')) return 'Boats';

    // -- ARMOR --
    if (name.includes('helm') || name.includes('armor') || name.includes('plate') || name.includes('chain')) return 'Armor';
    if (name.includes('shield') || name.includes('gauntlet') || name.includes('boot') || name.includes('greave')) return 'Armor';

    // -- EXISTING --
    if (name.includes('brick')) return 'Bricks';
    if (name.includes('plank') || name.includes('wood') || name.includes('log') || name.includes('shaft')) return 'Wood';
    if (name.includes('iron') || name.includes('steel') || name.includes('metal') || name.includes('copper')) return 'Metals';
    if (name.includes('stone') || name.includes('rock') || name.includes('marble') || name.includes('slate')) return 'Stone';
    if (name.includes('nail') || name.includes('rivet') || name.includes('lock')) return 'Hardware';
    if (name.includes('tool') || name.includes('hammer') || name.includes('saw') || name.includes('pickaxe')) return 'Tools';
    if (name.includes('ore') || name.includes('lump') || name.includes('shard')) return 'Ores';
    if (name.includes('clay') || name.includes('pottery') || name.includes('jar') || name.includes('bowl')) return 'Clay';
    
    // -- TEXTILES --
    if (name.includes('cotton') || name.includes('cloth') || name.includes('rag') || name.includes('sheet')) return 'Textiles';

    return 'Other';
}

export function getCategoryEmoji(category: string): string {
    switch (category) {
        case 'Bricks': return '🧱';
        case 'Wood': return '🪵';
        case 'Metals': return '⚒️';
        case 'Stone': return '🪨';
        case 'Hardware': return '🔩';
        case 'Tools': return '🛠️';
        case 'Ores': return '⛏️';
        case 'Clay': return '🏺';
        case 'Animals': return '🐎';
        case 'Storage': return '🗳️';
        case 'Boats': return '⛵';
        case 'Armor': return '🛡️';
        case 'Textiles': return '🧵';
        default: return '📦';
    }
}

/**
 * Get popular items by volume.
 */
export function getPopularItems(rawData: MarketItem[], limit: number = 10): { id: string, name: string }[] {
    const itemCounts = new Map<string, number>();
    const idNameMap = new Map<string, string>();

    rawData.forEach(item => {
        if (!item.itemId) return;
        itemCounts.set(item.itemId, (itemCounts.get(item.itemId) || 0) + 1);
        if (!idNameMap.has(item.itemId)) idNameMap.set(item.itemId, item.name);
    });

    return Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => ({ id, name: idNameMap.get(id) || 'Unknown' }));
}

/**
 * Get recent searches
 */
export function getRecentSearches(): { id: string, name: string }[] {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save search to recent history
 */
export function saveRecentSearch(item: { id: string, name: string }): void {
    try {
        const recent = getRecentSearches();
        // Remove if ID exists
        const filtered = recent.filter(i => i.id !== item.id);
        const updated = [item, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save recent search:', e);
    }
}

export function clearRecentSearches(): void {
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
        console.error('Failed to clear recent searches:', e);
    }
}
