// TipsService.ts - Rotating tips with JSON backend
// Edit tips in public/data/tips.json

export interface TipTranslations {
    en: string;
    pt: string;
}

export interface Tip {
    id: string;
    text: TipTranslations;
    enabled: boolean;
    order: number;
}

const SETTINGS_KEY = 'torta_tips_settings';

export interface TipsSettings {
    enabled: boolean;
    intervalMinutes: number;
}

class TipsService {
    private static instance: TipsService;
    private tips: Tip[] = [];
    private loaded: boolean = false;

    private constructor() {}

    static getInstance(): TipsService {
        if (!TipsService.instance) TipsService.instance = new TipsService();
        return TipsService.instance;
    }

    async loadTips(): Promise<void> {
        if (this.loaded) return;
        try {
            const response = await fetch('/data/tips.json');
            const data = await response.json();
            this.tips = data.tips || [];
            this.loaded = true;
        } catch (e) {
            console.error('Failed to load tips.json', e);
            this.tips = [];
        }
    }

    getTips(): Tip[] {
        return this.tips;
    }

    getEnabledTips(language: 'en' | 'pt' = 'en'): string[] {
        return this.tips
            .filter(t => t.enabled)
            .sort((a, b) => a.order - b.order)
            .map(t => t.text[language]);
    }

    getSettings(): TipsSettings {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error('Parse error', e); }
        }
        return { enabled: true, intervalMinutes: 10 };
    }

    saveSettings(settings: TipsSettings): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
}

export const tipsService = TipsService.getInstance();
