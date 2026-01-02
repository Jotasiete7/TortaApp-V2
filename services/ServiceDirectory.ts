import { ServiceCategory, ServiceProfile } from '../types';
import localforage from 'localforage';

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
     * Detects service intents using a Weighted Signal System.
     * Classifies into: SERVICE_OFFER (Positive), ITEM_TRADE (Ignored), SERVICE_REQUEST (Ignored)
     */
    public detectServiceIntents(message: string): { category: ServiceCategory; confidence: number }[] {
        const lower = message.toLowerCase();

        // --- PHASE 1: Kill Switches (Request / Item specific) ---
        // Explicit requests or strict item trades at start
        if (/^\s*(wtb|wtt|pc)\b/.test(lower)) return [];

        // --- PHASE 2: Signal Accumulation ---
        let score = 0;
        const potentialCategories = new Set<ServiceCategory>();

        // -> Positive Signals (Service Indicators)
        // Explicit Service Terms (+0.3)
        if (/\b(service|services|serve|skiller|doing|offering|making|crafting)\b/.test(lower)) score += 0.3;

        // Recurring/Capacity Terms (+0.3)
        if (/\b(daily|weekly|custom|order|unlimited|capacity|spots)\b/.test(lower)) score += 0.3;

        // Action Gerunds (+0.4) - Stronger than nouns
        if (/\b(imping|casting|smithing|tailoring|hauling)\b/.test(lower)) score += 0.4;

        // High Quality (+0.2) - Often implies skilled service
        if (/\b(9[0-9]ql|9[0-9]\s*ql|max\s*ql)\b/.test(lower)) score += 0.2;

        // Trust/Branding (+0.2)
        if (/forum\.wurmonline\.com|discord\.gg/.test(lower)) score += 0.2;
        if (/\b(pm|message|mail)\s*me\b/.test(lower)) score += 0.1;

        // -> Negative Signals (Item Trade / Request Indicators)
        // Inventory Terms (-0.3)
        if (/\b(bulk|stock|qty|selling|sold)\b/.test(lower)) score -= 0.3;

        // Questions (-0.2) - Less penalizing than before
        if (/\?/.test(lower)) score -= 0.2;

        // Inquiries (-0.3)
        if (/\b(anyone|who|where)\b/.test(lower)) score -= 0.3;

        // --- PHASE 3: Category Mapping (Context Aware) ---

        // Imping
        if (/\b(imp|imping|improve|improving)\b/.test(lower)) {
            potentialCategories.add(ServiceCategory.IMPING);
            score += 0.2;
        }

        // Smithing
        if (/\b(smith|smithing|blacksmith|bs)\b/.test(lower)) {
            potentialCategories.add(ServiceCategory.SMITHING);
            score += 0.2;
        }

        // Leatherworking (Context Safe)
        // "Leather" alone is dangerous (Item Trade). "Leatherworking" or "LW" + Service Verb is safe.
        if (/\b(leatherworking|leatherwork)\b/.test(lower)) {
            potentialCategories.add(ServiceCategory.LEATHERWORK);
            score += 0.3;
        } else if (/\b(lw|leather)\b/.test(lower) && score > 0.3) {
            // Only infer leather service if we already have other service signals
            potentialCategories.add(ServiceCategory.LEATHERWORK);
        }

        // Tailoring
        if (/\b(tailor|tailoring|cloth)\b/.test(lower)) {
            // Check context for "cloth" (could be material)
            if (/\b(tailor|tailoring)\b/.test(lower) || score > 0.3) {
                potentialCategories.add(ServiceCategory.TAILORING);
                score += 0.2;
            }
        }

        // Enchanting
        if (/\b(enchant|enchanting|cast|casting)\b/.test(lower)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.3;
        }
        // Spell acronyms only if some service context exists
        if (/\b(coc|woa|fa|botd|aoe)\b/.test(lower) && score > 0.1) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.2;
        }

        // Logistics
        if (/\b(haul|hauling|taxi|transport|courier|delivery|wagon)\b/.test(lower)) {
            potentialCategories.add(ServiceCategory.LOGISTICS);
            score += 0.3;
        }

        // Masonry
        if (/\b(masonry|stone|bricks)\b/.test(lower)) {
            if (/\b(masonry)\b/.test(lower) || score > 0.3) {
                potentialCategories.add(ServiceCategory.MASONRY);
            }
        }

        // --- PHASE 4: Final Validity Check ---

        // Threshold check (Persistent Level)
        if (score < this.THRESHOLD_PERSIST) return [];

        const intents: { category: ServiceCategory; confidence: number }[] = [];

        if (potentialCategories.size > 0) {
            potentialCategories.forEach(cat => {
                intents.push({ category: cat, confidence: Math.min(score, 1.0) });
            });
        } else if (score >= 0.4) {
            // High confidence generic service
            intents.push({ category: ServiceCategory.OTHER, confidence: Math.min(score, 1.0) });
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

    private extractExternalLink(message: string): string | undefined {
        const urlMatch = message.match(/https?:\/\/[^\s]+|discord\.gg\/[^\s]+|forum\.wurmonline\.com\/[^\s]+/i);
        return urlMatch ? urlMatch[0] : undefined;
    }

    private generateSearchIndex(p: ServiceProfile): string {
        const terms = [
            p.nick,
            p.server,
            ...p.services.map(s => s.category)
        ];
        // Add minimal keywords based on services
        // (Could be expanded later with inference)
        return terms.join(' ').toLowerCase();
    }

    /**
     * Processes a trade message and updates service profiles.
     */
    public processMessage(message: string, nick: string, server: string, timestamp: number = Date.now()) {
        const intents = this.detectServiceIntents(message);
        if (intents.length === 0) return;

        // Uses PERSIST threshold (low bar) to save data
        const validIntents = intents.filter(intent => intent.confidence >= this.THRESHOLD_PERSIST);
        if (validIntents.length === 0) return;

        // CHECK FOR LINK (Trust Indicator)
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
                activityScore: 0 // Will be recalculated on read
            };
            this.profiles.set(nick, profile);
        }

        profile.lastSeenAny = Math.max(profile.lastSeenAny, timestamp);
        // Only update server if strictly known, otherwise keep existing
        if (server !== 'UNKNOWN') {
            profile.server = server;
        }

        // Update Link Status if detected (once verified, stays verified)
        if (hasExternalLink) {
            profile.hasLink = true;
            // Update link if new one found (or if previous was missing)
            profile.externalLink = hasExternalLink;
        }

        // Process each detected intent
        validIntents.forEach(intent => {
            let serviceEntry = profile!.services.find(s => s.category === intent.category);

            if (!serviceEntry) {
                // First time seeing this category for this user
                serviceEntry = {
                    category: intent.category,
                    score: 0, // Will be recalculated on read
                    lastSeen: timestamp,
                    evidenceCount: 1,
                    lastEvidence: message // Capture initial evidence
                };
                profile!.services.push(serviceEntry);
            } else {
                // SPAM PREVENTION: Only increment evidenceCount if cooldown has passed
                const timeSinceLastEvidence = timestamp - serviceEntry.lastSeen;

                if (timeSinceLastEvidence >= this.EVIDENCE_COOLDOWN_MS) {
                    serviceEntry.evidenceCount++;
                    // Only update evidence text if new message is longer (likely more info) or recent
                    // (User Logic: "Se for o primeiro -> salva; Se for mais recente e mais 'forte' -> substitui")
                    // Length is a good proxy for "stronger" evidence in service ads (more details)
                    if (message.length > (serviceEntry.lastEvidence?.length || 0)) {
                        serviceEntry.lastEvidence = message;
                    }
                }

                serviceEntry.lastSeen = Math.max(serviceEntry.lastSeen, timestamp);
            }
        });

        // Regenerate search index on update
        profile.searchIndex = this.generateSearchIndex(profile);

        this.persist(); // Debounced save
    }

    public getProfiles(filter?: { category?: ServiceCategory, server?: string, query?: string }): ServiceProfile[] {
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
        }).filter(p => p.lastSeenAny > cutoff && p.activityScore > 0);

        if (filter?.server) {
            all = all.filter(p => p.server === filter.server);
        }

        // UNIFIED SEARCH FILTER
        if (filter?.query) {
            const q = filter.query.toLowerCase();
            all = all.filter(p => p.searchIndex?.includes(q));
        }

        if (filter?.category) {
            // Only return profiles that have the category AND relevant activity
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
