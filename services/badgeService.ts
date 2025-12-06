import { supabase } from './supabase';
import { Badge, UserBadge } from '../types';

export const BadgeService = {
    /**
     * Fetches all available badges from the system.
     */
    async getAllBadges(): Promise<Badge[]> {
        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .order('name');
        
        if (error) {
            console.error('Error fetching badges:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Fetches badges earned by a specific user.
     * Includes the badge definition details.
     */
    async getUserBadges(userId: string): Promise<UserBadge[]> {
        const { data, error } = await supabase
            .from('user_badges')
            .select(`
                *,
                badge:badges(*)
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user badges:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Updates the list of badges displayed on the user's profile.
     * Calls the RPC function 'update_displayed_badges'.
     */
    async setDisplayBadges(badgeIds: string[]): Promise<boolean> {
        const { error } = await supabase
            .rpc('update_displayed_badges', { badge_ids: badgeIds });

        if (error) {
            console.error('Error updating displayed badges:', error);
            return false;
        }
        return true;
    }
};
