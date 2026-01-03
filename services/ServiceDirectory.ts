import { ServiceCategory, ServiceProfile } from '../types';
import localforage from 'localforage';

/**
 * ServiceDirectory - Fail-Safe Service Intent Detection
 * 
 * ARCHITECTURE NOTE:
 * If this file grows beyond ~500 lines, consider splitting into:
 * - ServiceIntentDetector (regex, scoring)
 * - ServiceProfileRepository (persistence)
 * - ServiceDirectory (orchestration)
 * 
 * Current size is manageable as a single cohesive unit.
 */
export class ServiceDirectory {
    private static instance: ServiceDirectory;
    private profiles: Map<string, ServiceProfile> = new Map();
    private readonly MAX_EVIDENCE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
    private store: LocalForage;

    // THRESHOLDS (Separation of Storage vs UI)
    private readonly THRESHOLD_PERSIST = 0.1; // Learn almost everything
    private readonly THRESHOLD_DISPLAY = 0.6; // Show only trusted providers

    private persistTimer: NodeJS.Timeout | null = null;
    private readonly PERSIST_DEBOUNCE_MS = 3000;
    private readonly EVIDENCE_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes spam prevention

    // PHASE 1 OPTIMIZATION: Pre-compiled Regex (compiled once, not per message)
    private readonly REGEX_SERVER_TAG = /^\s*\(\w{3}\)\s*/i;
    private readonly REGEX_KILL_SWITCH = /^(wtb|wtt|pc)\b/;
    private readonly REGEX_NEGATIVE = /\b(not|stop|don't|won't|no longer)\b/;
    private readonly REGEX_ITEM_STRIP = /\[.*?\]/g;
    private readonly REGEX_WHITESPACE = /\s+/g;
    private readonly REGEX_STRONG = /\b(service|services|serve|doing|offering|making|crafting|imp|imps|imping|improve|improving|casting|haul|hauling|transport|taxi|courier|delivery|wagon|logistics)\b/;
    private readonly REGEX_WEAK = /\b(smith|smithing|blacksmith|bs|tailor|tailoring|leatherworking|leatherwork|masonry|shaping|enchant|enchanting)\b/;
    private readonly REGEX_CONTEXT = /(\b(up to|available|capacity|spots|custom|order|pm me|message me|mail me|discord|forum)\b)|(\b([7-9]\d|100)\s*ql)/;
    
    // Category-specific regex
    private readonly REGEX_IMPING = /\b(imp|imping|improve|improving)\b/;
    private readonly REGEX_SMITHING = /\b(smith|smithing|blacksmith|bs)\b/;
    private readonly REGEX_LEATHERWORK = /\b(leatherworking|leatherwork)\b/;
    private readonly REGEX_TAILORING = /\b(tailor|tailoring)\b/;
    private readonly REGEX_ENCHANTING = /\b(enchant|enchanting|cast|casting)\b/;
    private readonly REGEX_SPELLS = /\b(coc|woa|fa|botd|aoe)\b/;
    private readonly REGEX_LOGISTICS = /\b(haul|hauling|taxi|transport|courier|delivery|wagon|logistics)\b/;
    private readonly REGEX_MASONRY = /\b(masonry|stone|bricks)\b/;
    private readonly REGEX_URL = /https?:\/\/[^\s]+|discord\.gg\/[^\s]+|forum\.wurmonline\.com\/[^\s]+/i;

    // PHASE 1 OPTIMIZATION: Duplicate detection
    private recentMessageHashes = new Set<string>();
    private readonly MESSAGE_HASH_TTL = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        this.store = localforage.createInstance({
            name: "TortaApp_ServiceDirectory"
        });
        this.load();
        
        // Emergency persistence on beforeunload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                try {
                    const data = JSON.stringify(Array.from(this.profiles.values()));
                    localStorage.setItem('sd_profiles_emergency', data);
                } catch (e) {
                    console.error("Emergency save failed", e);
                }
            });
        }

        // Periodic cleanup (once per day)
        setInterval(() => {
            const deleted = this.cleanupOldProfiles();
            if (deleted > 0) {
                this.persistSync();
            }
        }, 24 * 60 * 60 * 1000);
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
            } else {
                // Try backup sources
                const backup = localStorage.getItem('sd_profiles_backup') || localStorage.getItem('sd_profiles_emergency');
                if (backup) {
                    const profiles = JSON.parse(backup) as ServiceProfile[];
                    profiles.forEach(p => this.profiles.set(p.nick, p));
                    console.log("?? ServiceDirectory: Restored from localStorage backup");
                }
            }
            // Clean up immediately after loading
            this.cleanupOldProfiles();
        } catch (e) {
            console.error("Failed to load Service Directory profiles", e);
        }
    }

    // PHASE 1 OPTIMIZATION: Cleanup old profiles
    private cleanupOldProfiles(): number {
        const cutoff = Date.now() - this.MAX_EVIDENCE_AGE;
        let deletedCount = 0;
        
        for (const [nick, profile] of this.profiles.entries()) {
            if (profile.lastSeenAny < cutoff) {
                this.profiles.delete(nick);
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            console.log(`?? ServiceDirectory: Cleaned up ${deletedCount} old profiles`);
        }
        
        return deletedCount;
    }

    private persist() {
        if (this.persistTimer) clearTimeout(this.persistTimer);

        this.persistTimer = setTimeout(async () => {
            // Clean before persisting (don't save garbage)
            this.cleanupOldProfiles();
            await this.persistSync();
        }, this.PERSIST_DEBOUNCE_MS);
    }

    // PHASE 1 OPTIMIZATION: Fallback persistence
    private async persistSync(): Promise<boolean> {
        try {
            await this.store.setItem('profiles', Array.from(this.profiles.values()));
            return true;
        } catch (e) {
            console.error("Failed to save to IndexedDB", e);
            
            // FALLBACK: localStorage
            try {
                const data = JSON.stringify(Array.from(this.profiles.values()));
                localStorage.setItem('sd_profiles_backup', data);
                console.warn("?? ServiceDirectory: Saved to localStorage backup");
                return true;
            } catch (fallbackError) {
                console.error("? All persistence methods failed", fallbackError);
                return false;
            }
        }
    }

    /**
     * Detects service intents using a Strict "Fail-Safe Pipeline".
     * Re-calibrated for Strict A+B Logic or Strong Trigger.
     */
    public detectServiceIntents(message: string): { category: ServiceCategory; confidence: number }[] {
        // Step 1: Sanitize Server Tags
        let clean = message.replace(this.REGEX_SERVER_TAG, '').trim(); 
        const lower = clean.toLowerCase();

        // Step 2: Kill Switches (Fail Fast)
        if (this.REGEX_KILL_SWITCH.test(lower)) return [];

        // Step 3: Negative Indicators Gate
        if (this.REGEX_NEGATIVE.test(lower)) {
             return [];
        }

        // Step 4: Content Sanitization (Item Strip)
        const contentForScanning = lower.replace(this.REGEX_ITEM_STRIP, ' ').replace(this.REGEX_WHITESPACE, ' ').trim();

        // Step 5: Strict Explicit Intent Gate
        const hasStrong = this.REGEX_STRONG.test(contentForScanning);
        const hasWeak = this.REGEX_WEAK.test(contentForScanning);
        const hasContext = this.REGEX_CONTEXT.test(contentForScanning);

        // GATE: Must have Strong OR (Weak AND Context)
        if (!hasStrong && !(hasWeak && hasContext)) {
            return [];
        }

        // --- PHASE 6: Classification ---

        const potentialCategories = new Set<ServiceCategory>();
        let score = 0.5; 

        // Imping (Strong)
        if (this.REGEX_IMPING.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.IMPING);
            score += 0.2;
        }

        // Smithing (Weak)
        if (this.REGEX_SMITHING.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.SMITHING);
            score += 0.2;
        }

        // Leatherworking (Weak)
        if (this.REGEX_LEATHERWORK.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LEATHERWORK);
            score += 0.3;
        }

        // Tailoring (Weak)
        if (this.REGEX_TAILORING.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.TAILORING);
            score += 0.2;
        }

        // Enchanting (Weak/Mixed - Casting is Strong)
        if (this.REGEX_ENCHANTING.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.3;
        }
        if (this.REGEX_SPELLS.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.1;
        }

        // Logistics (Strong)
        if (this.REGEX_LOGISTICS.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LOGISTICS);
            score += 0.3;
        }

        // Masonry (Weak)
        if (this.REGEX_MASONRY.test(contentForScanning)) {
             potentialCategories.add(ServiceCategory.MASONRY);
        }

        const intents: { category: ServiceCategory; confidence: number }[] = [];

        if (potentialCategories.size > 0) {
            potentialCategories.forEach(cat => {
                intents.push({ category: cat, confidence: Math.min(score, 1.0) });
            });
        } else {
            intents.push({ category: ServiceCategory.OTHER, confidence: 0.5 });
        }

        return intents;
    }

    private calculateActivityScore(lastSeen: number, evidenceCount: number): number {
        const now = Date.now();
        const ageHours = (now - lastSeen) / (1000 * 60 * 60);

        let decay = 0;
        if (ageHours <= 12) {
            decay = 1.0;
        } else if (ageHours <= 48) {
            decay = 0.5;
        } else if (ageHours <= 168) { 
            decay = 0.1;
        } else {
            decay = 0.0;
        }
        const frequency = Math.min(evidenceCount, 10) / 10;
        return (decay * 0.8) + (frequency * 0.2);
    }

    private extractExternalLink(message: string): string | undefined {
        const urlMatch = message.match(this.REGEX_URL);
        return urlMatch ? urlMatch[0] : undefined;
    }

    private generateSearchIndex(p: ServiceProfile): string {
        const terms = [
            p.nick,
            p.server,
            ...p.services.map(s => s.category)
        ];
        return terms.join(' ').toLowerCase();
    }

    // PHASE 1 OPTIMIZATION: Simple hash for duplicate detection
    private hashMessage(message: string, nick: string, timestamp: number): string {
        const minuteBucket = Math.floor(timestamp / 60000);
        return `${nick}:${message.length}:${minuteBucket}`;
    }

    public processMessage(message: string, nick: string, server: string, timestamp: number = Date.now()) {
        // PHASE 1 OPTIMIZATION: Duplicate detection
        const hash = this.hashMessage(message, nick, timestamp);
        if (this.recentMessageHashes.has(hash)) {
            console.warn("?? ServiceDirectory: Duplicate message detected, skipping");
            return;
        }
        
        this.recentMessageHashes.add(hash);
        setTimeout(() => this.recentMessageHashes.delete(hash), this.MESSAGE_HASH_TTL);

        const intents = this.detectServiceIntents(message);
        if (intents.length === 0) return;

        const validIntents = intents.filter(intent => intent.confidence >= this.THRESHOLD_PERSIST);
        if (validIntents.length === 0) return;

        const hasExternalLink = this.extractExternalLink(message);

        let profile = this.profiles.get(nick);
        if (!profile) {
            profile = {
                nick,
                server,
                hasLink: !!hasExternalLink,
                externalLink: hasExternalLink,
                services: [],
                lastSeenAny: timestamp,
                activityScore: 0 
            };
            this.profiles.set(nick, profile);
        }

        profile.lastSeenAny = Math.max(profile.lastSeenAny, timestamp);
        if (server !== 'UNKNOWN') {
            profile.server = server;
        }
        if (hasExternalLink) {
            profile.hasLink = true;
            profile.externalLink = hasExternalLink;
        }

        const cleanEvidence = message.replace(this.REGEX_WHITESPACE, ' ').trim();

        validIntents.forEach(intent => {
            let serviceEntry = profile!.services.find(s => s.category === intent.category);

            if (!serviceEntry) {
                serviceEntry = {
                    category: intent.category,
                    score: 0, 
                    lastSeen: timestamp,
                    evidenceCount: 1,
                    lastEvidence: cleanEvidence 
                };
                profile!.services.push(serviceEntry);
            } else {
                const timeSinceLastEvidence = timestamp - serviceEntry.lastSeen;

                if (timeSinceLastEvidence >= this.EVIDENCE_COOLDOWN_MS) {
                    serviceEntry.evidenceCount++;
                    if (cleanEvidence.length > (serviceEntry.lastEvidence?.length || 0)) {
                        serviceEntry.lastEvidence = cleanEvidence;
                    }
                }
                serviceEntry.lastSeen = Math.max(serviceEntry.lastSeen, timestamp);
            }
        });

        profile.searchIndex = this.generateSearchIndex(profile);
        this.persist(); 
    }

    public getProfiles(filter?: { category?: ServiceCategory, server?: string, query?: string }): ServiceProfile[] {
        let all = Array.from(this.profiles.values());

        const cutoff = Date.now() - this.MAX_EVIDENCE_AGE;

        all = all.map(p => {
            p.activityScore = 0;
            p.services.forEach(s => {
                s.score = this.calculateActivityScore(s.lastSeen, s.evidenceCount);
                p.activityScore = Math.max(p.activityScore, s.score);
            });
            return p;
        }).filter(p => p.lastSeenAny > cutoff && p.activityScore > 0);

        if (filter?.server) {
            all = all.filter(p => p.server === filter.server);
        }

        if (filter?.query) {
            const q = filter.query.toLowerCase();
            all = all.filter(p => p.searchIndex?.includes(q));
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
