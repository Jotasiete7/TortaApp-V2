import { supabase } from './supabase';
import { ShoutBalance } from '../types';

export const ShoutService = {
    /**
     * Fetches the user's current shout balance.
     */
    async getShoutBalance(userId: string): Promise<ShoutBalance | null> {
        const { data, error } = await supabase
            .from('user_shout_balance')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // It's possible the row doesn't exist yet if they haven't used a shout
            // In that case, the UI should assume default (3/10) or handle null
            console.warn('Error fetching shout balance (may be empty):', error);
            return null;
        }
        return data;
    },

    /**
     * Uses a free shout.
     * Calls the RPC function 'use_free_shout'.
     * Default color: CYAN
     */
    async useFreeShout(message: string, color: string = 'cyan'): Promise<{ success: boolean; error?: string; remaining_weekly?: number; remaining_monthly?: number }> {
        const { data, error } = await supabase
            .rpc('use_free_shout', {
                message_text: message,
                message_color: color
            });

        if (error) {
            console.error('Error using shout:', error);
            return { success: false, error: error.message };
        }

        // RPC returns JSONB: { success: boolean, error?: string, ... }
        return data;
    },

    /**
     * Fetches the user's past shouts history.
     */
    async getHistory(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase.rpc('get_user_shout_history', {
                target_user_id: userId
            });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Failed to fetch shout history:', error);
            return [];
        }
    }
};
