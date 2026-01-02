import { ServiceCategory, ServiceProfile } from '../types';
import localforage from 'localforage';

export class ServiceDirectory {
    private static instance: ServiceDirectory;
    private profiles: Map<string, ServiceProfile> = new Map();
    private readonly MAX_EVIDENCE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
    private store: LocalForage;
    private readonly MIN_CONFIDENCE = 0.4;
    private persistTimer: NodeJS.Timeout | null = null;
    private readonly PERSIST_DEBOUNCE_MS = 3000;
    private readonly EVIDENCE_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes spam prevention

    private constructor() {
        this.store = localforage.createInstance({
            name: "TortaApp_ServiceDirectory"
        });
        this.load();
    }

    public static getInstance(): ServiceDirectory {
        if (!ServiceDirectory.instance) {
            ServiceDirectory.instance = new ServiceDirectory();
        }
        return ServiceDirectory.instance;
    }

    private async load() {
        try {
            const savedProfiles = await this.store.getItem<ServiceProfile[]>('profiles');
            if (savedProfiles) {
                savedProfiles.forEach(p => this.profiles.set(p.nick, p));
            }
        } catch (e) {
            console.error("Failed to load Service Directory profiles", e);
        }
    }

    private persist() {
        if (this.persistTimer) clearTimeout(this.persistTimer);

        this.persistTimer = setTimeout(async () => {
            try {
                await this.store.setItem('profiles', Array.from(this.profiles.values()));
            } catch (e) {
                console.error("Failed to save Service Directory profiles", e);
            }
        }, this.PERSIST_DEBOUNCE_MS);
    }

    /**
     * Detects service intents from a trade message.
     * Returns array to support multi-service providers (e.g., "imping and smithing").
     * 
     * Key improvements:
     * - Sanitizes [item] brackets to prevent enchantment false positives
     * - Excludes item lists (high density of slashes/quantities without service verbs)
     * - Adds credibility bonus for forum/discord links
     * - More restrictive Enchanting detection (requires verb + spell)
     * - Expanded Logistics to include market/delivery services
     */
    public detectServiceIntents(message: string): { category: ServiceCategory; confidence: number }[] {
        const lower = message.toLowerCase();

        // 1. HARD EXCLUSIONS (False Positives)
        if (/\b(wtb|pc|wtt)\b/.test(lower)) return [];
        if (/[@?]/.test(lower)) return []; // Exclude questions and mentions
        if (/\b(anyone|any1|where|who)\b/.test(lower)) return []; // Exclude inquiries

        // 2. SANITIZATION: Remove [Item Name] brackets to prevent false positives from enchantments
        const cleanMessage = lower.replace(/\[.*?\]/g, '');
        if (cleanMessage.trim().length < 4) return [];

        // 3. ITEM LIST DETECTION: Exclude messages that are primarily item inventories
        // High density of slashes, brackets, or quantities without service verbs = item list
        const slashCount = (cleanMessage.match(/\//g) || []).length;
        const numberCount = (cleanMessage.match(/\d+x|x\d+|\d+\s*c|\d+\s*s/g) || []).length;
        const hasServiceVerb = /\b(imp|improve|cast|enchant|deliver|haul|repair|service|doing|offering)\b/.test(cleanMessage);

        // If message has many items/quantities but no service verbs, it's likely a sale list
        if ((slashCount > 2 || numberCount > 3) && !hasServiceVerb) {
            return []; // Exclude item lists (e.g., "WTS 43x Sleep Powder // 12x Bricks")
        }

        const intents: { category: ServiceCategory; confidence: number }[] = [];

        // 4. BASE CONFIDENCE CALCULATION
        let baseConf = 0.5;

        const serviceIndicators = [
            'service', 'free', 'tips', 'donations', 'casting', 'imping',
            'improving', 'making', 'crafting', 'hiring', 'rent', 'taxi', 'doing', 'offering'
        ];

        if (serviceIndicators.some(i => cleanMessage.includes(i))) baseConf += 0.2;
        if (/\bwts\b/.test(cleanMessage)) baseConf += 0.1;

        // 5. CREDIBILITY BONUS: Forum/Discord links indicate structured services
        if (/forum\.wurmonline\.com|discord\.gg/.test(cleanMessage)) {
            baseConf += 0.2;
        }

        // 6. MULTI-CATEGORY DETECTION
        // Imping
        if (/\b(imp|improve|improving|max\s*ql)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.IMPING, confidence: baseConf });
        }

        // Smithing
        if (/\b(bs|blacksmith|smithing|metal)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.SMITHING, confidence: baseConf });
        }

        // Leatherwork (Enhanced to capture "leatherwork")
        if (/\b(lw|leather|leatherworking|leatherwork)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.LEATHERWORK, confidence: baseConf });
        }

        // Tailoring
        if (/\b(cloth|tailor|tailoring)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.TAILORING, confidence: baseConf });
        }

        // Masonry - Only if service context, not just materials
        // This prevents "WTS bricks" from being classified as Masonry service
        if (/\b(masonry)\b/.test(cleanMessage) ||
            (hasServiceVerb && /\b(stone|bricks)\b/.test(cleanMessage))) {
            intents.push({ category: ServiceCategory.MASONRY, confidence: baseConf });
        }

        // Enchanting (Restrictive: requires action verb + spell keyword)
        // This prevents "[WOA 104] pickaxe" from being classified as Enchanting service
        if (/\b(cast|enchant|service)\b/.test(cleanMessage) &&
            /\b(coc|woa|fa|botd|aoe)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.ENCHANTING, confidence: baseConf + 0.1 });
        }

        // Logistics (includes delivery, market services, supply)
        // Expanded to capture market/delivery services like Arcadia
        if (/\b(haul|hauling|cart|wagon|boat|ship|transport|taxi|delivery|deliver|market|self-serve)\b/.test(cleanMessage)) {
            intents.push({ category: ServiceCategory.LOGISTICS, confidence: baseConf });
        }

        // Fallback: Generic service mention
        if (intents.length === 0 && cleanMessage.includes('service')) {
            intents.push({ category: ServiceCategory.OTHER, confidence: 0.4 });
        }

        return intents;
    }

    // NOTE: activityScore is NOT persisted.
    // It is derived at read-time to allow natural decay over time.
    private calculateActivityScore(lastSeen: number, evidenceCount: number): number {
        const now = Date.now();
        const ageHours = (now - lastSeen) / (1000 * 60 * 60);

        // Step Decay Model
        let decay = 0;
        if (ageHours <= 12) {
            decay = 1.0;
        } else if (ageHours <= 48) {
            decay = 0.5;
        } else if (ageHours <= 168) { // 7 days
            decay = 0.1;
        } else {
            decay = 0.0;
        }

        // Frequency Bonus (Caps at 10 messages = 1.0)
        const frequency = Math.min(evidenceCount, 10) / 10;

        return (decay * 0.8) + (frequency * 0.2);
    }

    /**
     * Processes a trade message and updates service profiles.
     * 
     * Key improvements:
     * - Handles multiple intents per message (multi-service providers)
     * - Implements 15-minute cooldown to prevent spam score inflation
     */
    public processMessage(message: string, nick: string, server: string, timestamp: number = Date.now()) {
        const intents = this.detectServiceIntents(message);
        if (intents.length === 0) return;

        // Filter by confidence
        const validIntents = intents.filter(intent => intent.confidence >= this.MIN_CONFIDENCE);
        if (validIntents.length === 0) return;

        let profile = this.profiles.get(nick);
        if (!profile) {
            profile = {
                nick,
                server,
                services: [],
                lastSeenAny: timestamp,
                activityScore: 0 // Will be recalculated on read
            };
            this.profiles.set(nick, profile);
        }

        profile.lastSeenAny = Math.max(profile.lastSeenAny, timestamp);
        profile.server = server;

        // Process each detected intent
        validIntents.forEach(intent => {
            let serviceEntry = profile.services.find(s => s.category === intent.category);

            if (!serviceEntry) {
                // First time seeing this category for this user
                serviceEntry = {
                    category: intent.category,
                    score: 0, // Will be recalculated on read
                    lastSeen: timestamp,
                    evidenceCount: 1
                };
                profile.services.push(serviceEntry);
            } else {
                // SPAM PREVENTION: Only increment evidenceCount if cooldown has passed
                const timeSinceLastEvidence = timestamp - serviceEntry.lastSeen;

                if (timeSinceLastEvidence >= this.EVIDENCE_COOLDOWN_MS) {
                    serviceEntry.evidenceCount++;
                }

                serviceEntry.lastSeen = Math.max(serviceEntry.lastSeen, timestamp);
            }
        });

        this.persist(); // Debounced save
    }

    public getProfiles(filter?: { category?: ServiceCategory, server?: string }): ServiceProfile[] {
        let all = Array.from(this.profiles.values());

        // 1. Recalculate Scores Dynamically
        const cutoff = Date.now() - this.MAX_EVIDENCE_AGE;

        all = all.map(p => {
            // Calculate max score among all services for the profile
            p.activityScore = 0;
            p.services.forEach(s => {
                s.score = this.calculateActivityScore(s.lastSeen, s.evidenceCount);
                p.activityScore = Math.max(p.activityScore, s.score);
            });
            return p;
        }).filter(p => p.lastSeenAny > cutoff && p.activityScore > 0); // Hide 0 score profiles (older than 7 days)

        if (filter?.server) {
            all = all.filter(p => p.server === filter.server);
        }

        if (filter?.category) {
            all = all.filter(p => p.services.some(s => s.category === filter.category && s.score > 0));
            all.sort((a, b) => {
                const scoreA = a.services.find(s => s.category === filter.category)?.score || 0;
                const scoreB = b.services.find(s => s.category === filter.category)?.score || 0;
                return scoreB - scoreA;
            });
        } else {
            all.sort((a, b) => b.activityScore - a.activityScore);
        }

        return all;
    }
}

export const serviceDirectory = ServiceDirectory.getInstance();
