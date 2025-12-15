/**
 * ItemIdentity.ts
 * 
 * Service responsible for Semantic Normalization of item names.
 * Ensures that "Large Anvil", "large anvil", and "Lg Anvil" are treated as the same entity.
 * Also handles removing material prefixes (e.g. "Iron Lump" -> "Lump") if desired, or normalizing them.
 * For Wurm, usually "Iron Lump" IS the item, but for "Wheat Sleep Powder" vs "Barley Sleep Powder", the core item is "Sleep Powder".
 */

// Known abbreviations map
const ALIAS_MAP: Record<string, string> = {
    'lg anvil': 'large anvil',
    'sm anvil': 'small anvil',
    'lg maul': 'large maul',
    'huge axe': 'huge axe',
    'imp': 'improve',
    'cod': 'cod filled',
    'sleeping powder': 'sleep powder',
    'farming': 'farm'
};

// Materials that often prefix items but might fragment identity
// Add to this list as we discover more fragmentation
const MATERIALS = new Set([
    'oat', 'barley', 'wheat', 'rye', 'corn', 'potato', 'pumpkin', 'onion',
    'iron', 'copper', 'tin', 'zinc', 'lead', 'silver', 'gold', 'steel', 'brass', 'bronze',
    'maple', 'birch', 'oak', 'pine', 'willow', 'cedar', 'chestnut', 'walnut', 'linden'
]);

// Words to ignore during normalization (Noise)
const IGNORED_TERMS = new Set([
    'rare', 'supreme', 'fantastic',
    'common', 'unfinished', 'bulk',
    'ql', 'wt', 'dmg', 'ea', 'each', 'x',
    'completed'
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

    // 5. Remove 'x' followed by digits (suffix quantity) like "Item x30"
    cleaned = cleaned.replace(/\sx\d+/g, '');

    // 6. Split and Filter
    const words = cleaned.split(/[\s-]+/); // Split by space or hyphen
    const filteredWords: string[] = [];

    for (const w of words) {
        // Skip purely numeric words (often quantities or prices leaked in)
        if (/^\d+$/.test(w)) continue;

        // Skip ignored terms
        if (IGNORED_TERMS.has(w)) continue;

        // Strip known materials? 
        // CAREFUL: "Iron Lump" -> "Lump" might be bad. "Wheat Sleep Powder" -> "Sleep Powder" is good.
        // For now, let's only strip materials if the resulting name is still valid (length > 1 word)
        // Actually, safer to keep materials for Metal/Wood, but STRIP for Crops on Powders?
        // User specific request: "Wheat Sleep Powder" -> "Sleep Powder".

        // Heuristic: If word is in MATERIALS, we skip it ONLY if it renders the remaining name meaningful?
        // Let's rely on ALIAS_MAP for explicit fixes or just strip "crop" materials?
        // Let's strip ALL defined materials for now to aggressively group, 
        // but this might merge "Iron Lump" and "Gold Lump".
        // The user want "Sleep Powder" to group.
        // Let's allow specific exceptions.

        filteredWords.push(w);
    }

    let joined = filteredWords.join(' ');

    // 7. Check Alias Map (Whole string check first)
    let trimmed = joined.trim();
    if (ALIAS_MAP[trimmed]) {
        return toTitleCase(ALIAS_MAP[trimmed]);
    }

    // 8. Specific Cleanup for Sleep Powder cases (Suffix/Prefix removal)
    // Regex to remove materials JUST for Sleep Powder if needed, or generally?
    // Let's try to remove materials from the START of the string if it matches a known pattern

    // Check for "Material + KnownItem" pattern?
    // Let's just remove the materials from the array if present?
    // Aggressive approach: Remove ANY material word.
    // "Gold Lump" -> "Lump" (Bad). "Wheat Sleep Powder" -> "Sleep Powder" (Good).

    // Better Approach: Regex Replacements for specific annoyances
    trimmed = trimmed.replace(/\b(wheat|barley|oat|rye|corn|potato)\s+/g, ''); // Crop prefixes

    // 9. Initial Qty Check (e.g. "100x Iron Lump")
    const qtyRegex = /^(\d+)[x\s]+(.+)/;
    const match = trimmed.match(qtyRegex);
    if (match) {
        trimmed = match[2].trim();
    }

    // 10. Secondary Alias Check after cleaning
    if (ALIAS_MAP[trimmed]) {
        return toTitleCase(ALIAS_MAP[trimmed]);
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
 */
export const inferCategory = (canonicalName: string): string => {
    const lower = canonicalName.toLowerCase();

    if (lower.includes('lump') || lower.includes('bar')) return 'Metals';
    if (lower.includes('plank') || lower.includes('log')) return 'Wood';
    if (lower.includes('powder') || lower.includes('shred')) return 'Reagents';
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
