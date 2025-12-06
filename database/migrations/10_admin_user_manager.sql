-- 10_admin_user_manager.sql
-- 1. RPC to get all users directly from auth.users (Admin Only)
-- Returns rich object with email, role, and verified nick
CREATE OR REPLACE FUNCTION admin_get_users() RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN -- Security Check: Verify if caller is 'admin'
IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
        AND role = 'admin'
) THEN RAISE EXCEPTION 'Access denied: User is not an admin';
END IF;
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
                SELECT game_nick
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
RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. RPC to perform administrative actions on users
CREATE OR REPLACE FUNCTION admin_manage_user(
        target_user_id UUID,
        action_type TEXT,
        payload JSONB DEFAULT '{}'::jsonb
    ) RETURNS JSONB AS $$ BEGIN -- Security Check
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    ) THEN RAISE EXCEPTION 'Access denied: User is not an admin';
END IF;
-- ACTION: BAN / UNBAN
IF action_type = 'ban' THEN -- payload: { "until": "infinity" } or { "until": null }
UPDATE auth.users
SET banned_until = (payload->>'until')::timestamptz
WHERE id = target_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'User ban status updated'
);
-- ACTION: SET ROLE
ELSIF action_type = 'set_role' THEN -- payload: { "role": "admin" }
UPDATE public.profiles
SET role = payload->>'role'
WHERE id = target_user_id;
RETURN jsonb_build_object('success', true, 'message', 'User role updated');
-- ACTION: GIFT SHOUTS
ELSIF action_type = 'gift_shouts' THEN -- payload: { "amount": 5 }
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
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Shouts gifted successfully'
);
END IF;
RAISE EXCEPTION 'Invalid action identifier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;