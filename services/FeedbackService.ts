import { supabase } from './supabase';

export interface FeedbackData {
    type: 'bug' | 'feature' | 'general' | 'other';
    message: string;
}

export const FeedbackService = {
    /**
     * Submit new feedback.
     */
    async submitFeedback(data: FeedbackData) {
        // Get current user (optional, as RLS handles auth, but good for local check)
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: user?.id || null,
                type: data.type,
                message: data.message,
                status: 'new'
            });

        if (error) throw error;
    },

    /**
     * Update feedback status (Admin only)
     */
    async updateStatus(id: string, status: 'new' | 'in_progress' | 'resolved' | 'closed') {
        const { error } = await supabase
            .from('feedback')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get all feedback with user details (Admin only)
     */
    async getAdminFeedback() {
        const { data, error } = await supabase.rpc('get_admin_feedback');
        if (error) throw error;
        return data as (FeedbackData & { 
            id: string, 
            status: string, 
            created_at: string, 
            reporter_nick: string,
            reporter_email: string 
        })[];
    }
};
