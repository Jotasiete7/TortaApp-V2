
import { MarketSnapshot, MarketItem } from '../types';
import { MarketPhaseId, MarketMoodId } from './MarketStoryEngine';

const STORAGE_KEY = 'torta_market_memory_v1';

export const MarketMemoryService = {

    // Save a snapshot for an item (limit 1 per day)
    saveSnapshot: (item: { id: string, name: string }, story: { phase: any, mood: any }, price: number, volume: number) => {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const snapshot: MarketSnapshot = {
                itemId: item.id,
                date: today,
                phase: story.phase.id,
                mood: story.mood.id,
                avgPrice: price,
                volume: volume,
                timestamp: now.getTime()
            };

            const memory = MarketMemoryService.loadMemory();

            // Check if snapshot already acts for today (update it) or create new
            const existingIndex = memory.findIndex(s => s.itemId === item.id && s.date === today);

            if (existingIndex >= 0) {
                memory[existingIndex] = snapshot;
            } else {
                memory.push(snapshot);
            }

            // Prune old snapshots (> 90 days) to keep localStorage light
            const cutoff = now.getTime() - (90 * 24 * 60 * 60 * 1000);
            const pruned = memory.filter(s => s.timestamp > cutoff);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        } catch (e) {
            console.warn('Failed to save market snapshot', e);
        }
    },

    loadMemory: (): MarketSnapshot[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    getTimeline: (itemId: string): MarketSnapshot[] => {
        const memory = MarketMemoryService.loadMemory();
        return memory
            .filter(s => s.itemId === itemId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    // Debug: export entire memory
    exportMemory: () => {
        return localStorage.getItem(STORAGE_KEY);
    },

    // Debug: clear
    clearMemory: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
