/**
 * ItemIdentity.ts
 * 
 * Service responsible for Semantic Normalization of item names.
 * Ensures that "Large Anvil", "large anvil", and "Lg Anvil" are treated as the same entity.
 * 
 * PATCH APPLIED:
 * - Added (Server) tag stripping (e.g. (Cad), (Har))
 * - Added WTB/WTS/WTT to ignored terms
 * - Improved cleaning logic
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
// ADDED: wtb, wts, wtt
const IGNORED_TERMS = new Set([
    'rare', 'supreme', 'fantastic',
    'common', 'unfinished', 'bulk',
    'ql', 'wt', 'dmg', 'ea', 'each', 'x',
    'completed', 'quality',
    'wtb', 'wts', 'wtt', 'wtt>', 'wts>', 'wtb>'
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
    'trading' // 'trading' might be risky if "Trading Post" exists? But standard items don't start with Trading.
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

    // --- GAP REMEDIATION: STRICT FILTERING ---
    // Filter out chat shouts starting with @ (e.g., "@ Arcadia")
    if (cleaned.startsWith('@') || cleaned.startsWith('!')) {
        return { id: 'unknown', displayName: 'Unknown' };
    }
    // Filter out system messages that might have leaked
    if (cleaned.includes('joined the channel') || cleaned.includes('left the channel')) {
        return { id: 'unknown', displayName: 'Unknown' };
    }
    // Filter out URLs
    if (cleaned.includes('http') || cleaned.includes('www.')) {
        return { id: 'unknown', displayName: 'Unknown' };
    }

    // 0. Service Filtering (Fail Fast)
    const hasServiceTerm = cleaned.split(/\s+/).some(w => SERVICE_TERMS.has(w));
    if (hasServiceTerm) {
        // return { id: 'unknown', displayName: 'Unknown' };
    }

    // 1. Basic Cleaning
    // REMOVE (Server) Tags like (Cad), (Har), (Pvp)
    cleaned = cleaned.replace(/^\([a-z0-9]+\)\s*/i, '');
    // Remove brackets
    cleaned = cleaned.replace(/\[.*?\]/g, '');
    // Remove metrics
    cleaned = cleaned.replace(/\b(ql|dmg|wt)[:\s]*[\d.]+/g, '');
    cleaned = cleaned.replace(/\b\d+ql\b/g, '');
    cleaned = cleaned.replace(/\sx\d+/g, '');

    // Explicitly remove WTB/WTS if they are at start (redundant with IGNORED_TERMS but safer)
    cleaned = cleaned.replace(/^(wtb|wts|wtt)\s+/i, '');

    // 2. Tokenize & Filter
    const words = cleaned.split(/[\s-]+/);
    const filteredWords: string[] = [];

    for (const w of words) {
        if (/^\d+$/.test(w)) continue; // Skip pure numbers
        if (/^\d+[kgms]$/.test(w)) continue; // Skip quantities like 2k, 500g, 10m
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
    let finalName = trimmed;

    // Hardcoded Semantic Check (Robust)
    for (const [key, config] of Object.entries(SEMANTIC_ITEMS)) {
        const readableKey = key.replace(/_/g, ' ');
        if (trimmed.includes(readableKey.replace('sleep powder', 'sleep powder'))) {
            if (trimmed.endsWith(config.displayName.toLowerCase())) {
                if (config.collapseMaterials) {
                    finalName = config.displayName.toLowerCase();
                }
            }
        }
    }

    // Specific fix for Sleep Powder
    if (trimmed.includes('sleep powder')) {
        finalName = 'sleep powder';
    }

    // 6. Final ID Generation (Strict)
    const id = finalName.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    let displayName = toTitleCase(finalName);

    // If empty after cleaning (e.g. "Impure"), return Unknown
    if (!id || id.length === 0) {
        return { id: 'unknown', displayName: 'Unknown' };
    }

    // Final Sanity Check: If ID is just 1 or 2 chars (rubbish), ignore
    if (id.length < 3) {
        return { id: 'unknown', displayName: 'Unknown' };
    }

    // Auto-fix title case for Known acronyms if needed
    if (id === 'cod_filled') displayName = 'CoD Filled';

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
    if (canonicalId.includes('anvil') || canonicalId.includes('hammer') || canonicalId.includes('whetstone') || canonicalId.includes('rope')) return 'Tools';
    if (canonicalId.includes('helm') || canonicalId.includes('breastplate') || canonicalId.includes('leggings') || canonicalId.includes('sleeve') || canonicalId.includes('glove') || canonicalId.includes('boot')) return 'Armor';
    if (canonicalId.includes('sword') || canonicalId.includes('axe') || canonicalId.includes('maul') || canonicalId.includes('blade') || canonicalId.includes('knife')) return 'Weapons';

    return 'Misc';
};
