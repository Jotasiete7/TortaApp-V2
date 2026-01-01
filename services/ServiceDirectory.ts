import { ServiceCategory, ServiceProfile } from '../types';
import localforage from 'localforage';

export class ServiceDirectory {
    private static instance: ServiceDirectory;
    private profiles: Map<string, ServiceProfile> = new Map();
    private readonly MAX_EVIDENCE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
    private store: LocalForage;
    private readonly MIN_CONFIDENCE = 0.4;

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

    private async persist() {
        try {
            await this.store.setItem('profiles', Array.from(this.profiles.values()));
        } catch (e) {
            console.error("Failed to save Service Directory profiles", e);
        }
    }

    public detectServiceIntent(message: string): { category: ServiceCategory; confidence: number } | null {
        const lower = message.toLowerCase();
        
        if (/\bwtb\b/.test(lower)) return null;

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
                activityScore: 0
            };
            this.profiles.set(nick, profile);
        }

        profile.lastSeenAny = Math.max(profile.lastSeenAny, timestamp);
        profile.server = server;

        let serviceEntry = profile.services.find(s => s.category === intent.category);
        if (!serviceEntry) {
            serviceEntry = {
                category: intent.category,
                score: 0,
                lastSeen: timestamp,
                evidenceCount: 0
            };
            profile.services.push(serviceEntry);
        }

        serviceEntry.lastSeen = Math.max(serviceEntry.lastSeen, timestamp);
        serviceEntry.evidenceCount++;
        
        const ageHours = (Date.now() - serviceEntry.lastSeen) / (1000 * 60 * 60);
        const recency = Math.max(0, 1 - (ageHours / 24));
        const frequency = Math.min(serviceEntry.evidenceCount, 10) / 10;
        serviceEntry.score = (recency * 0.7) + (frequency * 0.3);

        profile.activityScore = profile.services.reduce((max, s) => Math.max(max, s.score), 0);
        this.persist();
    }

    public getProfiles(filter?: { category?: ServiceCategory, server?: string }): ServiceProfile[] {
        let all = Array.from(this.profiles.values());
        
        const cutoff = Date.now() - this.MAX_EVIDENCE_AGE;
        all = all.filter(p => p.lastSeenAny > cutoff);

        if (filter?.server) {
            all = all.filter(p => p.server === filter.server);
        }

        if (filter?.category) {
            all = all.filter(p => p.services.some(s => s.category === filter.category && s.score > 0.1));
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
