import { supabase } from './supabase';
import { UserStreak, DailyClaimResult } from '../types';
import { ACHIEVEMENTS, Achievement } from '../constants/gamification';

export const GamificationService = {
    /**
     * Fetches the current user's streak information.
     */
    async getStreak(userId: string): Promise<UserStreak | null> {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found is okay, just means no streak yet
            }
            console.error('Error fetching streak:', error);
            return null;
        }
        return data;
    },

    /**
     * Claims the daily login reward via RPC.
     */
    async claimDailyReward(): Promise<DailyClaimResult> {
        const { data, error } = await supabase
            .rpc('claim_daily_rewards');

        if (error) {
            console.error('Error claiming daily reward:', error);
            throw error;
        }
        return data as DailyClaimResult;
    },

    /**
     * Check user's progress towards achievements
     */
    async checkAchievements(userId: string): Promise<Achievement[]> {
        try {
            // Get user stats
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('total_trades')
                .eq('user_id', userId)
                .single();

            const { count: totalTrades } = await supabase
                .from('trade_logs')
                .select('*', { count: 'exact', head: true });

            const databaseSizeMB = ((totalTrades || 0) * 250) / (1024 * 1024);

            // Check which achievements are unlocked
            const unlockedAchievements: Achievement[] = [];

            for (const achievement of ACHIEVEMENTS) {
                let isUnlocked = false;

                switch (achievement.requirement.type) {
                    case 'trades':
                        isUnlocked = (profile?.total_trades || 0) >= achievement.requirement.value;
                        break;
                    case 'db_size':
                        isUnlocked = databaseSizeMB >= achievement.requirement.value;
                        break;
                    // Add more types as needed
                }

                if (isUnlocked) {
                    unlockedAchievements.push(achievement);
                }
            }

            return unlockedAchievements;
        } catch (error) {
            console.error('Error checking achievements:', error);
            return [];
        }
    },

    /**
     * Get user's unlocked achievements from database
     */
    async getUserAchievements(userId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId);

            if (error) throw error;
            return data?.map(a => a.achievement_id) || [];
        } catch (error) {
            console.error('Error fetching user achievements:', error);
            return [];
        }
    },

    /**
     * Unlock an achievement for a user
     */
    async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('user_achievements')
                .insert({ user_id: userId, achievement_id: achievementId });

            if (error) {
                if (error.code === '23505') {
                    // Already unlocked
                    return false;
                }
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return false;
        }
    },

    /**
     * Checks for and returns only NEWLY unlocked achievements
     */
    async getNewAchievements(userId: string): Promise<Achievement[]> {
        const potential = await this.checkAchievements(userId);
        const existingIds = await this.getUserAchievements(userId);
        
        return potential.filter(a => !existingIds.includes(a.id));
    },

    /**
     * Process new achievements: unlock in DB and return list of actually unlocked ones
     */
    async processNewAchievements(userId: string): Promise<Achievement[]> {
        const newAchievements = await this.getNewAchievements(userId);
        const unlocked: Achievement[] = [];

        for (const achievement of newAchievements) {
            const success = await this.unlockAchievement(userId, achievement.id);
            if (success) {
                unlocked.push(achievement);
            }
        }

        return unlocked;
    }
};
