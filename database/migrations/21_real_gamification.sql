-- 21_real_gamification.sql
-- 1. Add XP and Level columns to profiles
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'xp'
) THEN
ALTER TABLE public.profiles
ADD COLUMN xp BIGINT DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'level'
) THEN
ALTER TABLE public.profiles
ADD COLUMN level INT DEFAULT 1;
END IF;
END $$;
-- 2. Backfill XP/Level based on existing trade history
-- We use the same formula as the Frontend: XP = total_trades * 10
-- Level is calculated based on thresholds:
-- 0-499 XP (0-49 trades) = Level 1
-- 500-1499 XP (50-149 trades) = Level 2
-- 1500-4999 XP (150-499 trades) = Level 3
-- 5000-9999 XP (500-999 trades) = Level 4
-- 10000+ XP (1000+ trades) = Level 5
UPDATE public.profiles
SET xp = total * 10,
    level = CASE
        WHEN total >= 1000 THEN 5 -- Tycoon
        WHEN total >= 500 THEN 4 -- Veteran
        WHEN total >= 150 THEN 3 -- Merchant
        WHEN total >= 50 THEN 2 -- Apprentice
        ELSE 1 -- Novice
    END;
-- 3. Create Function to Add XP
CREATE OR REPLACE FUNCTION add_xp(target_user_id UUID, amount INT) RETURNS VOID AS $$
DECLARE current_xp BIGINT;
new_xp BIGINT;
current_level INT;
new_level INT;
BEGIN -- Get current state
SELECT xp,
    level INTO current_xp,
    current_level
FROM public.profiles
WHERE id = target_user_id;
new_xp := current_xp + amount;
-- Calculate new level based on thresholds
new_level := CASE
    WHEN new_xp >= 10000 THEN 5
    WHEN new_xp >= 5000 THEN 4
    WHEN new_xp >= 1500 THEN 3
    WHEN new_xp >= 500 THEN 2
    ELSE 1
END;
-- Update Profile
UPDATE public.profiles
SET xp = new_xp,
    level = new_level
WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Create Trigger for New Trades (Award 50 XP per trade now!)
-- We are boosting it from 10 to 50 for active trading incentive
CREATE OR REPLACE FUNCTION on_new_trade_award_xp() RETURNS TRIGGER AS $$
DECLARE matcher_id UUID;
BEGIN -- Try to find the user by nickname
SELECT id INTO matcher_id
FROM public.profiles
WHERE lower(nick) = lower(NEW.nick);
IF matcher_id IS NOT NULL THEN -- Award 50 XP
PERFORM add_xp(matcher_id, 50);
-- Also increment total trade count (legacy support)
UPDATE public.profiles
SET total = total + 1
WHERE id = matcher_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Bind the trigger (if not already bound)
DROP TRIGGER IF EXISTS trigger_award_xp_on_trade ON public.trade_logs;
CREATE TRIGGER trigger_award_xp_on_trade
AFTER
INSERT ON public.trade_logs FOR EACH ROW EXECUTE FUNCTION on_new_trade_award_xp();
-- 5. "The Judge" - Auto Award Badges RPC
-- Scans a user's stats and awards eligible badges
CREATE OR REPLACE FUNCTION auto_award_badges(target_user_id UUID) RETURNS JSONB AS $$
DECLARE user_stats public.profiles %ROWTYPE;
badges_awarded TEXT [] := ARRAY []::TEXT [];
badge_id_to_add UUID;
BEGIN
SELECT * INTO user_stats
FROM public.profiles
WHERE id = target_user_id;
-- 5.1 Badge: Trader Novice (10 Trades)
IF user_stats.total >= 10 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'trader_novice';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Trader Novice');
END IF;
END IF;
END IF;
-- 5.2 Badge: Merchant King (1000 Trades)
IF user_stats.total >= 1000 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'merchant_king';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Merchant King');
END IF;
END IF;
END IF;
-- 5.3 Badge: Level 5 Tycoon
IF user_stats.level >= 5 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'tycoon_level_5';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Tycoon');
END IF;
END IF;
END IF;
RETURN jsonb_build_object('success', true, 'awarded', badges_awarded);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Seed the new badges
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'trader_novice',
        'Novice Trader',
        'Completed 10 trades.',
        'ShoppingCart',
        'slate'
    ),
    (
        'merchant_king',
        'Merchant King',
        'A legend with 1000+ trades.',
        'Crown',
        'gold'
    ),
    (
        'tycoon_level_5',
        'Tycoon',
        'Reached Level 5 max level.',
        'TrendingUp',
        'purple'
    ) ON CONFLICT (slug) DO NOTHING;