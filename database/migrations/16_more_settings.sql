-- 16_more_settings.sql
-- Insert new settings if they don't exist
INSERT INTO public.app_settings (key, value, description)
VALUES (
        'registration_open',
        'true',
        'Allow new users to sign up'
    ),
    (
        'upload_enabled',
        'true',
        'Allow users to upload trade logs'
    ),
    (
        'shout_cost_xp',
        '0',
        'XP cost to send a shout (0 = free)'
    ),
    (
        'max_badges_slots',
        '5',
        'Number of badge slots visible on profile'
    ) ON CONFLICT (key) DO NOTHING;