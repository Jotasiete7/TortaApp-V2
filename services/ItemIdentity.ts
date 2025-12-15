/**
 * ItemIdentity.ts
 * 
 * Service responsible for Semantic Normalization of item names.
 * Ensures that "Large Anvil", "large anvil", and "Lg Anvil" are treated as the same entity.
 * 
 * ARCHITECTURAL CHANGE (v2.1):
 * - Separates Identity (ID) from Display Name.
 * - ID is strictly lowercase alphanumeric + underscores.
 * - Display Name is title-cased and pretty.
 * - Semantic rules for items like "Sleep Powder" are explicit.
 */

// 1. Semantic Item Configuration (The "Truth" Table)
const SEMANTIC_ITEMS: Record<string, { collapseMaterials: boolean, displayName: string }> = {
    'sleep_powder': {
        collapseMaterials: true,
        displayName: 'Sleep Powder'
    },
    'healing_cover': {
        collapseMaterials: true,
        displayName: 'Healing Cover'
    }
    // Add more special cases here
};

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

// Words to ignore during normalization (Noise)
const IGNORED_TERMS = new Set([
    'rare', 'supreme', 'fantastic',
    'common', 'unfinished', 'bulk',
    'ql', 'wt', 'dmg', 'ea', 'each', 'x',
    'completed', 'quality'
]);

// Prefixes that should not be part of the ID (Mechanical Cleaning)
const IGNORED_PREFIXES = new Set([
    'impure',
    'shattered',
    'unfinished',
    'corroded',
    'broken',
    'damaged',
    'crumbling',
    'rusty'
]);

// Service terms causing noise
const SERVICE_TERMS = new Set([
    'cleaning',
    'organizing',
    'sorting',
    'bulk',
    'service',
    'recruitment',
    'looking for',
    'hiring',
    'selling',
    'buying',
    'trading'
]);

// Materials to strip ONLY if semantic rule applies
const MATERIALS_REGEX = /\b(wheat|barley|oat|rye|corn|potato|pumpkin|onion|iron|copper|tin|zinc|lead|silver|gold|steel|brass|bronze|maple|birch|oak|pine|willow|cedar|chestnut|walnut|linden)\s+/gi;

interface ItemIdentity {
    id: string;        // The immutable, mechanical ID (e.g., 'sleep_powder')
    displayName: string; // The human-friendly name (e.g., 'Sleep Powder')
}

/**
 * Resolves the true identity of an item from a raw string.
 * This is the SINGLE ENTRY POINT for normalization.
 */
export const resolveItemIdentity = (rawName: string): ItemIdentity => {
    if (!rawName) return { id: 'unknown', displayName: 'Unknown' };

    let cleaned = rawName.toLowerCase().trim();

    // 0. Service Filtering (Fail Fast)
    // If the message is clearly a service, we shouldn't even try to ID it as an item properly.
    const hasServiceTerm = cleaned.split(/\s+/).some(w => SERVICE_TERMS.has(w));
    // We treat service ads as 'unknown' or specific to filter them out?
    // Let's rely on the token filtering below to strip the service words.
    // If result is empty, it becomes 'unknown'.

    // 1. Basic Cleaning
    cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove brackets
    cleaned = cleaned.replace(/\b(ql|dmg|wt)[:\s]*[\d.]+/g, ''); // Remove metrics
    cleaned = cleaned.replace(/\b\d+ql\b/g, ''); // Remove 90ql
    cleaned = cleaned.replace(/\sx\d+/g, ''); // Remove x30

    // 2. Tokenize & Filter
    const words = cleaned.split(/[\s-]+/);
    const filteredWords: string[] = [];

    for (const w of words) {
        if (/^\d+$/.test(w)) continue; // Skip pure numbers
        if (IGNORED_TERMS.has(w)) continue; // Skip noise
        if (IGNORED_PREFIXES.has(w)) continue; // Skip prefixes (Impure, etc.)
        if (SERVICE_TERMS.has(w)) continue; // Skip service words
        filteredWords.push(w);
    }

    let joined = filteredWords.join(' ');
    let trimmed = joined.trim();

    // 3. Alias Resolution
    if (ALIAS_MAP[trimmed]) {
        trimmed = ALIAS_MAP[trimmed];
    }

    // 4. GENERATE TENTATIVE ID for Semantic Check
    // We create a temporary ID to check against our semantic map
    // e.g. "Wheat Sleep Powder" -> "wheat_sleep_powder"
    const tentativeId = trimmed.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // 5. Semantic Rules Check
    // Check if the string ENDS with a known semantic type (heuristic)
    // Or check if the cleaning result matches a semantic key

    // Heuristic: Check if it contains "sleep powder"
    let finalName = trimmed;

    // Hardcoded Semantic Check (Robust)
    // This allows identifying "Wheat Sleep Powder" as "Sleep Powder"
    for (const [key, config] of Object.entries(SEMANTIC_ITEMS)) {
        const readableKey = key.replace(/_/g, ' ');
        if (trimmed.includes(readableKey.replace('sleep powder', 'sleep powder'))) { // Simple containment check
            // Actually, we should check if the NORMALIZED string ends with the key words
            if (trimmed.endsWith(config.displayName.toLowerCase())) {
                if (config.collapseMaterials) {
                    // Strip materials if configured
                    finalName = config.displayName.toLowerCase(); // Force it to the base name
                }
            }
        }
    }

    // Specific fix for Sleep Powder to match user request precisely
    if (trimmed.includes('sleep powder')) {
        finalName = 'sleep powder';
    }

    // 6. Final ID Generation (Strict)
    const id = finalName.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const displayName = toTitleCase(finalName);

    // If empty after cleaning (e.g. "Impure"), return Unknown
    if (!id || id.length === 0) {
        return { id: 'unknown', displayName: 'Unknown' };
    }

    return { id, displayName };
};

/**
 * Legacy Support / Helpers
 */
export const getCanonicalName = (rawName: string): string => {
    return resolveItemIdentity(rawName).displayName;
};

export const getCanonicalId = (rawName: string): string => {
    return resolveItemIdentity(rawName).id;
};

const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/**
 * Infers the category of an item based on its ID.
 */
export const inferCategory = (canonicalId: string): string => {
    // Note: Checking ID is safer than name
    if (canonicalId.includes('lump') || canonicalId.includes('bar')) return 'Metals';
    if (canonicalId.includes('plank') || canonicalId.includes('log')) return 'Wood';
    if (canonicalId.includes('powder') || canonicalId.includes('shred')) return 'Reagents';
    if (canonicalId.includes('anvil') || canonicalId.includes('hammer') || canonicalId.includes('whetstone')) return 'Tools';
    if (canonicalId.includes('helm') || canonicalId.includes('breastplate') || canonicalId.includes('leggings')) return 'Armor';
    if (canonicalId.includes('sword') || canonicalId.includes('axe') || canonicalId.includes('maul')) return 'Weapons';

    return 'Misc';
};
