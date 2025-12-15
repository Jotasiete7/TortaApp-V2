/**
 * ItemIdentity.ts
 * 
 * Service responsible for Semantic Normalization of item names.
 * Ensures that "Large Anvil", "large anvil", and "Lg Anvil" are treated as the same entity.
 */

// Known abbreviations map
// Can be expanded over time or loaded from a config file
const ALIAS_MAP: Record<string, string> = {
    'lg anvil': 'large anvil',
    'sm anvil': 'small anvil',
    'lg maul': 'large maul',
    'huge axe': 'huge axe', // Example
    'imp': 'improve',
    'cod': 'cod filled',
};

// Words to ignore during normalization (Noise)
const IGNORED_TERMS = new Set([
    'rare', 'supreme', 'fantastic',
    'common', 'unfinished', 'bulk',
    'ql', 'wt', 'dmg'
]);

/**
 * Returns the canonical version of an item name.
 * @param rawName The raw string from trade log (e.g. "Rare Large Anvil [90ql]")
 */
export const getCanonicalName = (rawName: string): string => {
    if (!rawName) return "Unknown";

    // 1. Lowercase and Basic Cleanup
    let cleaned = rawName.toLowerCase();

    // 2. Remove Bracketed Info [10s], [90ql]
    cleaned = cleaned.replace(/\[.*?\]/g, '');

    // 3. Remove specific metrics (QL:90, DMG:10)
    cleaned = cleaned.replace(/\b(ql|dmg|wt)[:\s]*[\d.]+/g, '');

    // 4. Remove QL numbers like "90ql"
    cleaned = cleaned.replace(/\b\d+ql\b/g, '');

    // 5. Remove known noise words
    // We split by space to check whole words
    cleaned = cleaned.split(/\s+/).filter(word => !IGNORED_TERMS.has(word)).join(' ');

    // 6. Check Alias Map (Whole string check first)
    const trimmed = cleaned.trim();
    if (ALIAS_MAP[trimmed]) {
        return toTitleCase(ALIAS_MAP[trimmed]);
    }

    // 7. Check for starting quantity (e.g. "100x Iron Lump")
    // This is already handled in dataUtils somewhat, but good to harmonize
    const qtyRegex = /^(\d+)[x\s]+(.+)/;
    const match = trimmed.match(qtyRegex);
    if (match) {
        return toTitleCase(match[2].trim());
    }

    return toTitleCase(trimmed);
};

const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/**
 * Infers the category of an item based on its name.
 * Useful for future filtering/clustering.
 */
export const inferCategory = (canonicalName: string): string => {
    const lower = canonicalName.toLowerCase();

    if (lower.includes('lump') || lower.includes('bar')) return 'Resources';
    if (lower.includes('anvil') || lower.includes('hammer') || lower.includes('whetstone')) return 'Tools';
    if (lower.includes('helm') || lower.includes('breastplate') || lower.includes('leggings')) return 'Armor';
    if (lower.includes('sword') || lower.includes('axe') || lower.includes('maul')) return 'Weapons';

    return 'Misc';
};

/**
 * Generates a stable canonical ID for database storage.
 * e.g. "Large Anvil" -> "large_anvil"
 */
export const getCanonicalId = (rawName: string): string => {
    const canonicalName = getCanonicalName(rawName);
    return canonicalName.toLowerCase().replace(/\s+/g, '_');
};
