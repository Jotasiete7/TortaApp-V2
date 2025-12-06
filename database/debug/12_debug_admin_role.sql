-- 12_debug_admin_role.sql
-- RPC to check who the DB thinks you are
CREATE OR REPLACE FUNCTION debug_admin_access() RETURNS JSONB AS $$
DECLARE current_uid UUID;
current_role TEXT;
has_profile BOOLEAN;
BEGIN current_uid := auth.uid();
SELECT role INTO current_role
FROM public.profiles
WHERE id = current_uid;
RETURN jsonb_build_object(
    'auth_uid',
    current_uid,
    'profile_role',
    COALESCE(current_role, 'NULL'),
    'is_admin',
    (COALESCE(current_role, '') = 'admin')
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;