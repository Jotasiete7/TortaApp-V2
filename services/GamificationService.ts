import { supabase } from './supabase';
import { UserStreak, DailyClaimResult } from '../types';

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
    }
};

