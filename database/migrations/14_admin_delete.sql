-- 14_admin_delete.sql
-- RPC to PERMANENTLY delete a user and their data (Hard Delete)
-- NOTE: This relies on ON DELETE CASCADE constraints for related tables (profiles, etc.)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID) RETURNS JSONB AS $$
DECLARE current_user_role TEXT;
BEGIN -- Get current user role
SELECT role INTO current_user_role
FROM public.profiles
WHERE id = auth.uid();
-- Security Check
IF current_user_role NOT IN ('admin', 'postgres', 'superuser') THEN RAISE EXCEPTION 'Access denied: User (%s) is not an admin',
current_user_role;
END IF;
-- Prevent self-deletion
IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot delete yourself.';
END IF;
-- Perform Delete
DELETE FROM auth.users
WHERE id = target_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'User deleted successfully'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;