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
     * Re-calibrated for Strict A+B Logic or Strong Trigger.
     */
    public detectServiceIntents(message: string): { category: ServiceCategory; confidence: number }[] {
        // Step 1: Sanitize Server Tags
        let clean = message.replace(/^\s*\(\w{3}\)\s*/i, '').trim(); 
        const lower = clean.toLowerCase();

        // Step 2: Kill Switches (Fail Fast)
        if (/^(wtb|wtt|pc)\b/.test(lower)) return [];

        // Step 3: Content Sanitization (Item Strip)
        const contentForScanning = lower.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();

        // Step 4: Strict Explicit Intent Gate
        // Logic: (Strong Keyword) OR (Weak Keyword + Context)
        
        // A. Strong Keywords (Inherently imply service)
        const strongRegex = /\b(service|services|serve|doing|offering|making|crafting|imp|imps|imping|improve|improving|casting|haul|hauling|transport|taxi|courier|delivery|wagon|logistics)\b/;
        
        // B. Weak Keywords (Skill names - need context to be a service)
        const weakRegex = /\b(smith|smithing|blacksmith|bs|tailor|tailoring|leatherworking|leatherwork|masonry|shaping|enchant|enchanting)\b/;
        
        // C. Context/Proof Keywords (Combine with Weak)
        // Fixed: Allow "99ql" (digits followed immediately by ql) by separating it from the \b guarded block
        const contextRegex = /(\b(up to|available|capacity|spots|custom|order|pm me|message me|mail me|discord|forum)\b)|(\d+\s*ql)/;

        const hasStrong = strongRegex.test(contentForScanning);
        const hasWeak = weakRegex.test(contentForScanning);
        const hasContext = contextRegex.test(contentForScanning);

        // GATE: Must have Strong OR (Weak AND Context)
        if (!hasStrong && !(hasWeak && hasContext)) {
            return [];
        }

        // --- PHASE 5: Classification ---

        const potentialCategories = new Set<ServiceCategory>();
        let score = 0.5; 

        // Imping (Strong)
        if (/\b(imp|imping|improve|improving)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.IMPING);
            score += 0.2;
        }

        // Smithing (Weak)
        if (/\b(smith|smithing|blacksmith|bs)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.SMITHING);
            score += 0.2;
        }

        // Leatherworking (Weak)
        if (/\b(leatherworking|leatherwork)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LEATHERWORK);
            score += 0.3;
        }

        // Tailoring (Weak)
        if (/\b(tailor|tailoring)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.TAILORING);
            score += 0.2;
        }

        // Enchanting (Weak/Mixed - Casting is Strong)
        if (/\b(enchant|enchanting|cast|casting)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.3;
        }
        if (/\b(coc|woa|fa|botd|aoe)\b/.test(contentForScanning)) {
             // Spells are unique enough to likely be enchanting service if explicit gate passed
            potentialCategories.add(ServiceCategory.ENCHANTING);
            score += 0.1;
        }

        // Logistics (Strong)
        if (/\b(haul|hauling|taxi|transport|courier|delivery|wagon|logistics)\b/.test(contentForScanning)) {
            potentialCategories.add(ServiceCategory.LOGISTICS);
            score += 0.3;
        }

        // Masonry (Weak)
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
            // If explicit gate passed but no specific category found (likely "Services available" generic)
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
        const urlMatch = message.match(/https?:\/\/[^\s]+|discord\.gg\/[^\s]+|forum\.wurmonline\.com\/[^\s]+/i);
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

    public processMessage(message: string, nick: string, server: string, timestamp: number = Date.now()) {
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

        validIntents.forEach(intent => {
            let serviceEntry = profile!.services.find(s => s.category === intent.category);

            if (!serviceEntry) {
                serviceEntry = {
                    category: intent.category,
                    score: 0, 
                    lastSeen: timestamp,
                    evidenceCount: 1,
                    lastEvidence: message 
                };
                profile!.services.push(serviceEntry);
            } else {
                const timeSinceLastEvidence = timestamp - serviceEntry.lastSeen;

                if (timeSinceLastEvidence >= this.EVIDENCE_COOLDOWN_MS) {
                    serviceEntry.evidenceCount++;
                    if (message.length > (serviceEntry.lastEvidence?.length || 0)) {
                        serviceEntry.lastEvidence = message;
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
