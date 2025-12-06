-- 11_fix_admin_users.sql
-- Drop functions first to ensure clean recreation
DROP FUNCTION IF EXISTS admin_get_users();
DROP FUNCTION IF EXISTS admin_manage_user(UUID, TEXT, JSONB);
-- 1. RPC: Get Users (Re-implemented with simpler logic)
CREATE OR REPLACE FUNCTION admin_get_users() RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN -- Simplified Security Check (Checks if the caller has 'admin' in profiles)
IF (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
) <> 'admin' THEN RAISE EXCEPTION 'Access denied: User is not an admin';
END IF;
-- Using explicit conversion and simpler join
SELECT jsonb_agg(
        jsonb_build_object(
            'id',
            u.id,
            'email',
            u.email,
            'created_at',
            u.created_at,
            'last_sign_in_at',
            u.last_sign_in_at,
            'banned_until',
            u.banned_until,
            'role',
            COALESCE(p.role, 'guest'),
            'game_nick',
            (
                SELECT n.game_nick
                FROM public.user_nicks n
                WHERE n.user_id = u.id
                    AND n.is_verified = true
                LIMIT 1
            )
        )
    ) INTO result
FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
-- Handle empty result case
RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. RPC: Manage User (Explicit params)
CREATE OR REPLACE FUNCTION admin_manage_user(
        target_user_id UUID,
        action_type TEXT,
        payload JSONB DEFAULT '{}'::jsonb
    ) RETURNS JSONB AS $$ BEGIN -- Security Check
    IF (
        SELECT role
        FROM public.profiles
        WHERE id = auth.uid()
    ) <> 'admin' THEN RAISE EXCEPTION 'Access denied: User is not an admin';
END IF;
-- ACTION: BAN / UNBAN
IF action_type = 'ban' THEN
UPDATE auth.users
SET banned_until = (payload->>'until')::timestamptz
WHERE id = target_user_id;
RETURN jsonb_build_object('success', true);
-- ACTION: SET ROLE
ELSIF action_type = 'set_role' THEN
UPDATE public.profiles
SET role = payload->>'role'
WHERE id = target_user_id;
RETURN jsonb_build_object('success', true);
-- ACTION: GIFT SHOUTS
ELSIF action_type = 'gift_shouts' THEN
INSERT INTO public.user_shout_balance (
        user_id,
        weekly_shouts_remaining,
        monthly_shouts_remaining
    )
VALUES (
        target_user_id,
        (payload->>'amount')::int,
        (payload->>'amount')::int
    ) ON CONFLICT (user_id) DO
UPDATE
SET weekly_shouts_remaining = user_shout_balance.weekly_shouts_remaining + (payload->>'amount')::int,
    monthly_shouts_remaining = user_shout_balance.monthly_shouts_remaining + (payload->>'amount')::int;
RETURN jsonb_build_object('success', true);
END IF;
RAISE EXCEPTION 'Invalid action';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;