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
     * Detects service intents using a Strict "Fail-Safe Pipeline".
     * 1. Parse Server (handled upstream or stripped here)
     * 2. Normalize
     * 3. Kill Switches (Fail Fast)
     * 4. Content Sanitization (Item Strip)
     * 5. Explicit Intent Gate (Positive Confirmation only)
     */
    public detectServiceIntents(message: string): { category: ServiceCategory; confidence: number }[] {
        // Step 1: Sanitize Server Tags (Strip them for analysis)
        // We assume valid server is passed to processMessage, here we just want clean text
        let clean = message.replace(/^\s*\(\w{3}\)\s*/i, '').trim(); 
        const lower = clean.toLowerCase();

        // Step 2: Kill Switches (Fail Fast)
        // If it looks like a Buy Request, Trade, or Price Check -> ABORT
        if (/^(wtb|wtt|pc)\b/.test(lower)) return [];

        // Step 3: Content Sanitization (Create contentForScanning)
        // Remove [Item Links] to prevent false positives from item names (e.g. "Oil of Blacksmith")
        // We replace with empty string to avoid accidental concatenation of words
        const contentForScanning = lower.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();

        // Step 4: Explicit Intent Gate (Mandatory)
        // The sanitized content MUST contain explicit service signals.
        const hasExplicitIntent = 
            /\b(service|services|serve|doing|offering|making|crafting)\b/.test(contentForScanning) ||
            /\b(imp|imps|imping|improve|improving)\b/.test(contentForScanning) ||
            /\b(smith|smithing|blacksmith|bs)\b/.test(contentForScanning) ||
            /\b(tailor|tailoring)\b/.test(contentForScanning) || // "cloth" removed as too risky
            /\b(leatherworking|leatherwork)\b/.test(contentForScanning) || // "leather" removed
            /\b(enchant|enchanting|cast|casting)\b/.test(contentForScanning) ||
            /\b(haul|hauling|taxi|transport|courier|delivery|wagon)\b/.test(contentForScanning) ||
            /\b(masonry|bricks)\b/.test(contentForScanning) ||
            // Capability / Availability
            /\b(up to\s*\d+ql)\b/.test(contentForScanning) ||
            /\b(available|capacity|spots|custom order)\b/.test(contentForScanning) ||
            // CTA
            /\b(pm me|message me|mail me)\b/.test(contentForScanning) ||
            /forum\.wurmonline\.com|discord\.gg/.test(contentForScanning);

        if (!hasExplicitIntent) return [];

        // --- PHASE 5: Classification (Only if Gate Passed) ---
        // Note: We use contentForScanning for keyword detection to ensure safety.

        const potentialCategories = new Set<ServiceCategory>();
        let score = 0.5; // Base score for passing the gate

        // Imping
        if (/\b(imp|imping|improve|improving)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.IMPING);
            score += 0.2;
        }

        // Smithing
        if (/\b(smith|smithing|blacksmith|bs)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.SMITHING);
            score += 0.2;
        }

        // Leatherworking
        if (/\b(leatherworking|leatherwork)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LEATHERWORK);
            score += 0.3;
        }

        // Tailoring
        if (/\b(tailor|tailoring)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.TAILORING);
            score += 0.2;
        }

        // Enchanting
        if (/\b(enchant|enchanting|cast|casting)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.3;
        }
        // Spell acronyms are safe-ish if gate passed, but still check scanning content
        if (/\b(coc|woa|fa|botd|aoe)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.1;
        }

        // Logistics
        if (/\b(haul|hauling|taxi|transport|courier|delivery|wagon)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LOGISTICS);
            score += 0.3;
        }

        // Masonry
        if (/\b(masonry|stone|bricks)\b/.test(contentForScanning)) {
            if (/\b(masonry)\b/.test(contentForScanning) || score > 0.3) {
                 potentialCategories.add(ServiceCategory.MASONRY);
            }
        }

        const intents: { category: ServiceCategory; confidence: number }[] = [];

        if (potentialCategories.size > 0) {
            potentialCategories.forEach(cat => {
                intents.push({ category: cat, confidence: Math.min(score, 1.0) });
            });
        } else {
            // If explicit gate passed but no specific category found, it's Generic
            intents.push({ category: ServiceCategory.OTHER, confidence: 0.5 });
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
