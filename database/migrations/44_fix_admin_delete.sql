-- 44_fix_admin_delete.sql
-- Updates the admin_delete_user function to manually cleanup tables that might be missing ON DELETE CASCADE
-- Specifically targeting ticker_messages, user_badges, user_streaks, and profiles.
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID) RETURNS JSONB AS $$
DECLARE current_user_role TEXT;
BEGIN -- 1. Get current user role
SELECT role INTO current_user_role
FROM public.profiles
WHERE id = auth.uid();
-- 2. Security Check
IF current_user_role NOT IN ('admin', 'postgres', 'superuser') THEN RAISE EXCEPTION 'Access denied: User (%s) is not an admin',
current_user_role;
END IF;
-- 3. Prevent self-deletion
IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot delete yourself.';
END IF;
-- 4. Manual Cleanup of Dependent Tables
-- (Some of these might have Cascades, but reliable execution is key here)
-- Ticker Messages (Often misses cascade)
DELETE FROM public.ticker_messages
WHERE created_by = target_user_id;
-- Gamification & Stats
DELETE FROM public.user_shout_balance
WHERE user_id = target_user_id;
DELETE FROM public.user_streaks
WHERE user_id = target_user_id;
DELETE FROM public.user_badges
WHERE user_id = target_user_id;
-- Profile
DELETE FROM public.profiles
WHERE id = target_user_id;
-- 5. Perform Hard Delete on Auth User
DELETE FROM auth.users
WHERE id = target_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'User deleted successfully (Manual Cleanup Performed)'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;