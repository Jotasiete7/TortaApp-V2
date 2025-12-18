import { MarketItem } from '../types';

export interface SearchResult {
    item: string;
    score: number;
    avgPrice: number;
    volume: number;
    category: string;
}

const RECENT_SEARCHES_KEY = 'tortaapp_recent_searches';
const MAX_RECENT = 5;

/**
 * Calculate fuzzy match score between query and target
 * @param query Search query
 * @param target Item name to match against
 * @returns Score 0-100 (higher is better match)
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

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Search items with fuzzy matching
 * @param query Search query
 * @param items Available items
 * @param rawData Market data for metadata
 * @param limit Max results
 * @returns Sorted search results
 */
export function searchItems(
    query: string,
    items: string[],
    rawData: MarketItem[],
    limit: number = 10
): SearchResult[] {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];

    items.forEach(item => {
        const score = fuzzyMatch(query, item);
        if (score > 30) { // Minimum threshold
            const itemData = rawData.filter(d => d.name === item);
            const avgPrice = itemData.length > 0
                ? itemData.reduce((sum, d) => sum + d.price, 0) / itemData.length
                : 0;
            const volume = itemData.length;
            const category = categorizeItem(item);

            results.push({ item, score, avgPrice, volume, category });
        }
    });

    // Sort by score (desc), then volume (desc)
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

    if (name.includes('brick')) return 'Bricks';
    if (name.includes('plank') || name.includes('wood')) return 'Wood';
    if (name.includes('iron') || name.includes('steel') || name.includes('metal')) return 'Metals';
    if (name.includes('stone') || name.includes('rock')) return 'Stone';
    if (name.includes('nail') || name.includes('rivet')) return 'Hardware';
    if (name.includes('tool') || name.includes('hammer') || name.includes('saw')) return 'Tools';
    if (name.includes('ore') || name.includes('lump')) return 'Ores';
    if (name.includes('clay') || name.includes('pottery')) return 'Clay';

    return 'Other';
}

/**
 * Get category emoji
 */
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
        default: return '📦';
    }
}

/**
 * Get popular items by volume
 */
export function getPopularItems(rawData: MarketItem[], limit: number = 10): string[] {
    const itemCounts = new Map<string, number>();

    rawData.forEach(item => {
        itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + 1);
    });

    return Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name]) => name);
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
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
export function saveRecentSearch(item: string): void {
    try {
        const recent = getRecentSearches();

        // Remove if already exists
        const filtered = recent.filter(i => i !== item);

        // Add to front
        const updated = [item, ...filtered].slice(0, MAX_RECENT);

        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save recent search:', e);
    }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
        console.error('Failed to clear recent searches:', e);
    }
}
