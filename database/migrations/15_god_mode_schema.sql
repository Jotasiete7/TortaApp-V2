-- 15_god_mode_schema.sql
-- 1. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
-- 2. Seed Initial Settings (if not exist)
INSERT INTO public.app_settings (key, value, description)
VALUES (
        'xp_multiplier',
        '1.0',
        'Global XP multiplier for all actions'
    ),
    (
        'shout_limit_weekly',
        '5',
        'Default weekly shouts per user'
    ),
    (
        'maintenance_mode',
        'false',
        'If true, blocks non-admin access'
    ),
    (
        'motd',
        '"Welcome to TortaApp!"',
        'Message of the day displayed in dashboard'
    ) ON CONFLICT (key) DO NOTHING;
-- 3. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- 4. RLS Policies
-- Everyone can READ settings (for the app to work)
CREATE POLICY "Everyone can read settings" ON public.app_settings FOR
SELECT TO authenticated,
    anon USING (true);
-- Only Admins can UPDATE settings
CREATE POLICY "Admins can update settings" ON public.app_settings FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'superuser')
        )
    );
-- 5. RPC: Update Setting (Secure Wrapper)
CREATE OR REPLACE FUNCTION admin_update_setting(setting_key TEXT, new_value JSONB) RETURNS JSONB AS $$
DECLARE current_uid UUID;
current_role TEXT;
BEGIN current_uid := auth.uid();
-- Get role
SELECT role INTO current_role
FROM public.profiles
WHERE id = current_uid;
-- Security Check: STRICTLY Admin/Superuser only
-- This differentiates from Moderators who might perform other tasks but can't touch system config
IF current_role NOT IN ('admin', 'superuser', 'postgres') THEN RAISE EXCEPTION 'Access denied: God Mode requires Admin privileges.';
END IF;
-- Update
UPDATE public.app_settings
SET value = new_value,
    updated_at = NOW(),
    updated_by = current_uid
WHERE key = setting_key;
RETURN jsonb_build_object(
    'success',
    true,
    'key',
    setting_key,
    'value',
    new_value
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 6. RPC: Fetch All Settings (Admin View)
-- Returns extra metadata like who updated it last
CREATE OR REPLACE FUNCTION admin_get_settings() RETURNS JSONB AS $$ BEGIN -- Security Check
    IF (
        SELECT role
        FROM public.profiles
        WHERE id = auth.uid()
    ) NOT IN ('admin', 'superuser', 'postgres') THEN RAISE EXCEPTION 'Access denied.';
END IF;
RETURN (
    SELECT jsonb_agg(
            jsonb_build_object(
                'key',
                s.key,
                'value',
                s.value,
                'description',
                s.description,
                'updated_at',
                s.updated_at,
                'updated_by_email',
                (
                    SELECT email
                    FROM auth.users
                    WHERE id = s.updated_by
                )
            )
        )
    FROM public.app_settings s
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;