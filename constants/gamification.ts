// Enhanced Gamification Constants
// Optimized for 24/7 Live Monitor farming

export const XP_PER_TRADE = 100; // Increased from 10 to scale better

// 50-Level Progressive System
export const LEVELS = [
    // Beginner Tier (1-10)
    { level: 1, name: 'Novice Trader', minTrades: 0, maxTrades: 100 },
    { level: 2, name: 'Apprentice', minTrades: 100, maxTrades: 250 },
    { level: 3, name: 'Trader', minTrades: 250, maxTrades: 500 },
    { level: 4, name: 'Skilled Trader', minTrades: 500, maxTrades: 1000 },
    { level: 5, name: 'Merchant', minTrades: 1000, maxTrades: 2000 },
    { level: 6, name: 'Dealer', minTrades: 2000, maxTrades: 3500 },
    { level: 7, name: 'Broker', minTrades: 3500, maxTrades: 5000 },
    { level: 8, name: 'Trader Elite', minTrades: 5000, maxTrades: 7500 },
    { level: 9, name: 'Market Expert', minTrades: 7500, maxTrades: 10000 },
    { level: 10, name: 'Trade Master', minTrades: 10000, maxTrades: 15000 },
    
    // Intermediate Tier (11-20)
    { level: 11, name: 'Veteran Trader', minTrades: 15000, maxTrades: 20000 },
    { level: 12, name: 'Market Analyst', minTrades: 20000, maxTrades: 25000 },
    { level: 13, name: 'Trade Specialist', minTrades: 25000, maxTrades: 30000 },
    { level: 14, name: 'Commerce Lord', minTrades: 30000, maxTrades: 40000 },
    { level: 15, name: 'Tycoon', minTrades: 40000, maxTrades: 50000 },
    { level: 16, name: 'Market Mogul', minTrades: 50000, maxTrades: 60000 },
    { level: 17, name: 'Trade Baron', minTrades: 60000, maxTrades: 75000 },
    { level: 18, name: 'Commerce King', minTrades: 75000, maxTrades: 90000 },
    { level: 19, name: 'Market Emperor', minTrades: 90000, maxTrades: 100000 },
    { level: 20, name: 'Trade Legend', minTrades: 100000, maxTrades: 125000 },
    
    // Advanced Tier (21-30)
    { level: 21, name: 'Market Titan', minTrades: 125000, maxTrades: 150000 },
    { level: 22, name: 'Trade Colossus', minTrades: 150000, maxTrades: 175000 },
    { level: 23, name: 'Commerce Deity', minTrades: 175000, maxTrades: 200000 },
    { level: 24, name: 'Market Overlord', minTrades: 200000, maxTrades: 250000 },
    { level: 25, name: 'Trade Immortal', minTrades: 250000, maxTrades: 300000 },
    { level: 26, name: 'Eternal Merchant', minTrades: 300000, maxTrades: 350000 },
    { level: 27, name: 'Cosmic Trader', minTrades: 350000, maxTrades: 400000 },
    { level: 28, name: 'Infinite Broker', minTrades: 400000, maxTrades: 450000 },
    { level: 29, name: 'Transcendent Dealer', minTrades: 450000, maxTrades: 500000 },
    { level: 30, name: 'Omniscient Trader', minTrades: 500000, maxTrades: 600000 },
    
    // Expert Tier (31-40)
    { level: 31, name: 'Market Archon', minTrades: 600000, maxTrades: 700000 },
    { level: 32, name: 'Trade Ascendant', minTrades: 700000, maxTrades: 800000 },
    { level: 33, name: 'Commerce Paragon', minTrades: 800000, maxTrades: 900000 },
    { level: 34, name: 'Market Sovereign', minTrades: 900000, maxTrades: 1000000 },
    { level: 35, name: 'Million Trade Master', minTrades: 1000000, maxTrades: 1200000 },
    { level: 36, name: 'Data Hoarder', minTrades: 1200000, maxTrades: 1400000 },
    { level: 37, name: 'Information Overlord', minTrades: 1400000, maxTrades: 1600000 },
    { level: 38, name: 'Knowledge Keeper', minTrades: 1600000, maxTrades: 1800000 },
    { level: 39, name: 'Wisdom Incarnate', minTrades: 1800000, maxTrades: 2000000 },
    { level: 40, name: 'Two Million Legend', minTrades: 2000000, maxTrades: 2500000 },
    
    // Legendary Tier (41-50)
    { level: 41, name: 'Market Demigod', minTrades: 2500000, maxTrades: 3000000 },
    { level: 42, name: 'Trade Celestial', minTrades: 3000000, maxTrades: 3500000 },
    { level: 43, name: 'Commerce Primordial', minTrades: 3500000, maxTrades: 4000000 },
    { level: 44, name: 'Market Eternal', minTrades: 4000000, maxTrades: 4500000 },
    { level: 45, name: 'Trade Omnipotent', minTrades: 4500000, maxTrades: 5000000 },
    { level: 46, name: 'Five Million Titan', minTrades: 5000000, maxTrades: 6000000 },
    { level: 47, name: 'Data Singularity', minTrades: 6000000, maxTrades: 7000000 },
    { level: 48, name: 'Market Infinity', minTrades: 7000000, maxTrades: 8000000 },
    { level: 49, name: 'Trade Absolute', minTrades: 8000000, maxTrades: 10000000 },
    { level: 50, name: 'Wurm Trade God', minTrades: 10000000, maxTrades: 999999999 }
];

// Achievement Definitions
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    requirement: {
        type: 'trades' | 'live_trades' | 'monitor_time' | 'db_size' | 'streak';
        value: number;
    };
}

export const ACHIEVEMENTS: Achievement[] = [
    // Live Monitor Achievements
    { id: 'night_owl', name: 'Night Owl', description: 'Monitor live trades for 6+ hours continuously', icon: '🦉', color: 'purple', requirement: { type: 'monitor_time', value: 21600 } },
    { id: 'data_collector', name: 'Data Collector', description: 'Capture 1,000 live trades', icon: '📊', color: 'blue', requirement: { type: 'live_trades', value: 1000 } },
    { id: 'market_watcher', name: 'Market Watcher', description: 'Capture 10,000 live trades', icon: '👁️', color: 'cyan', requirement: { type: 'live_trades', value: 10000 } },
    { id: 'trade_oracle', name: 'Trade Oracle', description: 'Capture 100,000 live trades', icon: '🔮', color: 'purple', requirement: { type: 'live_trades', value: 100000 } },
    
    // Database Achievements
    { id: 'archivist', name: 'Archivist', description: 'Database reaches 10MB', icon: '📚', color: 'amber', requirement: { type: 'db_size', value: 10 } },
    { id: 'historian', name: 'Historian', description: 'Database reaches 100MB', icon: '📜', color: 'gold', requirement: { type: 'db_size', value: 100 } },
    { id: 'chronicler', name: 'Chronicler', description: 'Database reaches 1GB', icon: '💾', color: 'emerald', requirement: { type: 'db_size', value: 1024 } },
    
    // Trade Milestones
    { id: 'first_hundred', name: 'First Hundred', description: 'Record 100 trades', icon: '💯', color: 'blue', requirement: { type: 'trades', value: 100 } },
    { id: 'thousand_club', name: 'Thousand Club', description: 'Record 1,000 trades', icon: '🎯', color: 'cyan', requirement: { type: 'trades', value: 1000 } },
    { id: 'ten_k_master', name: '10K Master', description: 'Record 10,000 trades', icon: '⭐', color: 'amber', requirement: { type: 'trades', value: 10000 } },
    { id: 'hundred_k_legend', name: '100K Legend', description: 'Record 100,000 trades', icon: '👑', color: 'gold', requirement: { type: 'trades', value: 100000 } },
    { id: 'million_god', name: 'Million God', description: 'Record 1,000,000 trades', icon: '💎', color: 'purple', requirement: { type: 'trades', value: 1000000 } }
];
