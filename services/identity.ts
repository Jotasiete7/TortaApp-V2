import { supabase } from './supabase';

export interface UserNick {
    id: string;
    game_nick: string;
    is_verified: boolean;
    verification_token?: string;
    token_expires_at?: string;
}

export const IdentityService = {
    /**
     * Generates a verification token for a specific game nick.
     */
    generateToken: async (nick: string): Promise<string | null> => {
        const { data, error } = await supabase
            .rpc('generate_verification_token', { target_nick: nick });

        if (error) {
            console.error('Error generating token:', error);
            return null;
        }

        return data;
    },

    /**
     * Fetches all nicks associated with the current user.
     */
    getMyNicks: async (): Promise<UserNick[]> => {
        const { data, error } = await supabase
            .from('user_nicks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user nicks:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Checks if a specific nick is verified (useful for UI updates).
     */
    checkVerificationStatus: async (nick: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from('user_nicks')
            .select('is_verified')
            .eq('game_nick', nick)
            .single();

        if (error) return false;
        return data?.is_verified || false;
    }
};
