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
                // console.log('[ServiceDirectory] Persisting profiles...');
                await this.store.setItem('profiles', Array.from(this.profiles.values()));
            } catch (e) {
                console.error("Failed to save Service Directory profiles", e);
            }
        }, this.PERSIST_DEBOUNCE_MS);
    }

    public detectServiceIntent(message: string): { category: ServiceCategory; confidence: number } | null {
        const lower = message.toLowerCase();
        
        // 1. HARD EXCLUSIONS (False Positives)
        if (/\bwtb\b/.test(lower)) return null;
        if (/\?/.test(lower)) return null; // Exclude questions
        if (/\b(anyone|any1|where|who)\b/.test(lower)) return null; // Exclude inquiries

        const serviceIndicators = [
            'service', 'free', 'tips', 'donations', 'casting', 'imping', 
            'improving', 'making', 'crafting', 'hiring', 'rent', 'taxi'
        ];
        
        let confidence = 0.5;
        if (serviceIndicators.some(i => lower.includes(i))) confidence += 0.2;
        if (/\bwts\b/.test(lower)) confidence += 0.1;

        if (/\b(imp|improve|improving|max\s*ql)\b/.test(lower)) {
            return { category: ServiceCategory.IMPING, confidence };
        }
        if (/\b(bs|blacksmith|smithing|metal)\b/.test(lower)) {
            return { category: ServiceCategory.SMITHING, confidence };
        }
        if (/\b(lw|leather|leatherworking)\b/.test(lower)) {
            return { category: ServiceCategory.LEATHERWORK, confidence };
        }
        if (/\b(cloth|tailor|tailoring)\b/.test(lower)) {
            return { category: ServiceCategory.TAILORING, confidence };
        }
        if (/\b(masonry|stone|bricks)\b/.test(lower)) {
             return { category: ServiceCategory.MASONRY, confidence };
        }
        if (/\b(cast|casts|enchant|enchanting|coc|woa|fa|botd)\b/.test(lower)) {
            return { category: ServiceCategory.ENCHANTING, confidence };
        }
        if (/\b(haul|hauling|cart|wagon|boat|ship|transport|taxi)\b/.test(lower)) {
            return { category: ServiceCategory.LOGISTICS, confidence };
        }
        
        if (lower.includes('service')) {
            return { category: ServiceCategory.OTHER, confidence: 0.4 };
        }

        return null;
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

    public processMessage(message: string, nick: string, server: string, timestamp: number = Date.now()) {
        const intent = this.detectServiceIntent(message);
        if (!intent || intent.confidence < this.MIN_CONFIDENCE) return;

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

        let serviceEntry = profile.services.find(s => s.category === intent.category);
        if (!serviceEntry) {
            serviceEntry = {
                category: intent.category,
                score: 0, // Will be recalculated on read
                lastSeen: timestamp,
                evidenceCount: 0
            };
            profile.services.push(serviceEntry);
        }

        serviceEntry.lastSeen = Math.max(serviceEntry.lastSeen, timestamp);
        serviceEntry.evidenceCount++;
        
        // We do NOT calculate scores here anymore.
        // We just mark the data as updated and let the UI pull the fresh score.
        
        this.persist(); // Debounced save
    }

    public getProfiles(filter?: { category?: ServiceCategory, server?: string }): ServiceProfile[] {
        let all = Array.from(this.profiles.values());
        
        // 1. Recalculate Scores Dynamicallly
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