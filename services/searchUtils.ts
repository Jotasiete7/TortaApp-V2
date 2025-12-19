
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
 * Categorize item by name. 
 * ORDER MATTERS! Specific types first, then materials, then broad categories.
 */
export function categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    // 1. Vehicles & Infrastructure
    if (name.includes('ship') || name.includes('boat') || name.includes('knarr') || name.includes('corbita') || name.includes('cog') || name.includes('caravel') || name.includes('yacht')) return 'Boats';
    if (name.includes('cart') || name.includes('wagon') || name.includes('chariot')) return 'Vehicles';

    // 2. Storage (Specific items often made of wood/metal, so check first)
    if (name.includes('casket') || name.includes('chest') || name.includes('coffer') || name.includes('trunk')) return 'Storage';
    if (name.includes('barrel') || name.includes('bin') || name.includes('crate') || name.includes('rack') || name.includes('silo')) return 'Storage';

    // 3. Equipment (Armor, Weapons, Tools)
    if (name.includes('helm') || name.includes('armor') || name.includes('plate') || name.includes('chain') || name.includes('shield') || name.includes('gauntlet') || name.includes('boot') || name.includes('greave')) return 'Armor';
    if (name.includes('sword') || name.includes('axe') || name.includes('maul') || name.includes('blade') || name.includes('knife') || name.includes('dagger')) return 'Weapons';
    if (name.includes('tool') || name.includes('hammer') || name.includes('saw') || name.includes('pickaxe') || name.includes('shovel') || name.includes('rake')) return 'Tools';
    if (name.includes('rod') || name.includes('net') || name.includes('pole')) return 'Tools';

    // 4. Hardware (Small metal parts, locks)
    if (name.includes('nail') || name.includes('rivet') || name.includes('lock') || name.includes('hinge') || name.includes('horse shoe') || name.includes('horseshoe')) return 'Hardware';

    // 5. Materials (Processed)
    if (name.includes('brick') || name.includes('slab')) return 'Bricks';
    if (name.includes('plank') || name.includes('log') || name.includes('wood') || name.includes('shaft') || name.includes('handle')) return 'Wood';
    if (name.includes('cotton') || name.includes('cloth') || name.includes('rag') || name.includes('sheet') || name.includes('rug') || name.includes('carpet') || name.includes('yarn') || name.includes('string') || name.includes('rope')) return 'Textiles';
    if (name.includes('pottery') || name.includes('bowl') || name.includes('jar') || name.includes('flask') || name.includes('planter') || name.includes('amphora')) return 'Clay';

    // 6. Raw Materials (Ores, Lumps, Shards)
    if (name.includes('ore') || name.includes('lump') || name.includes('shard') || name.includes('rock') || name.includes('bar')) {
        if (name.includes('clay')) return 'Clay';
        return 'Raw Materials'; 
    }
    
    // 7. Metals (Generic metal items not caught above)
    if (name.includes('iron') || name.includes('steel') || name.includes('metal') || name.includes('copper') || name.includes('silver') || name.includes('gold')) return 'Metals';
    if (name.includes('stone') || name.includes('marble') || name.includes('slate')) return 'Stone'; // Stone items

    // 8. Living Things
    if (name.includes('horse') || name.includes('foal') || name.includes('mare') || name.includes('stallion') || name.includes('steed')) return 'Animals';
    if (name.includes('cow') || name.includes('bull') || name.includes('sheep') || name.includes('ram') || name.includes('lamb')) return 'Animals';
    if (name.includes('dog') || name.includes('cat') || name.includes('spider') || name.includes('bear') || name.includes('wolf')) return 'Animals';
    
    // 9. Consumables
    if (name.includes('meal') || name.includes('stew') || name.includes('soup') || name.includes('casserole') || name.includes('fillet') || name.includes('meat')) return 'Food';

    return 'Other';
}

export function getCategoryEmoji(category: string): string {
    switch (category) {
        case 'Bricks': return '🧱'; // Should work, but if failed, could use 🏗️
        case 'Wood': return '🌲'; // Safer than 🪵
        case 'Metals': return '⚙️';
        case 'Stone': return '⛰️'; // Safer than 🪨
        case 'Hardware': return '🔩';
        case 'Tools': return '🔨';
        case 'Weapons': return '⚔️';
        case 'Raw Materials': return '💎';
        case 'Clay': return '🏺';
        case 'Animals': return '🐾'; // Safer than 🐎
        case 'Storage': return '📦'; // Safer than 🗳️
        case 'Boats': return '⛵';
        case 'Vehicles': return '🚜'; 
        case 'Armor': return '🛡️';
        case 'Textiles': return '👕';
        case 'Food': return '🍖';
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
