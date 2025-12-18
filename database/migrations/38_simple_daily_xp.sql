-- 38_simple_daily_xp.sql
-- Simplified Daily XP system without requiring user_streaks table
-- Adds last_daily_claim column to profiles and awards 10 XP per day
-- 1. Add last_daily_claim tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_daily_claim DATE;
-- 2. Create simplified claim_daily_rewards function
CREATE OR REPLACE FUNCTION claim_daily_rewards() RETURNS JSONB AS $$
DECLARE curr_user_id UUID;
last_claim DATE;
today DATE := CURRENT_DATE;
daily_xp INT := 10;
current_xp BIGINT;
new_level INT;
BEGIN curr_user_id := auth.uid();
IF curr_user_id IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Not authenticated'
);
END IF;
-- Get last claim date
SELECT last_daily_claim INTO last_claim
FROM public.profiles
WHERE id = curr_user_id;
-- Check if already claimed today
IF last_claim = today THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Already claimed today'
);
END IF;
-- Award XP
UPDATE public.profiles
SET xp = xp + daily_xp,
    last_daily_claim = today
WHERE id = curr_user_id
RETURNING xp INTO current_xp;
-- Recalculate level
new_level := CASE
    WHEN current_xp >= 10000 THEN 5
    WHEN current_xp >= 5000 THEN 4
    WHEN current_xp >= 1500 THEN 3
    WHEN current_xp >= 500 THEN 2
    ELSE 1
END;
UPDATE public.profiles
SET level = new_level
WHERE id = curr_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'xp_awarded',
    daily_xp,
    'total_xp',
    current_xp,
    'level',
    new_level,
    'message',
    'Daily bonus claimed!'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION claim_daily_rewards() TO authenticated;
-- 3. Optional: Create view to see who claimed today
CREATE OR REPLACE VIEW daily_claims_today AS
SELECT p.id,
    un.game_nick,
    p.xp,
    p.level,
    p.last_daily_claim
FROM public.profiles p
    LEFT JOIN public.user_nicks un ON un.user_id = p.id
    AND un.is_verified = true
WHERE p.last_daily_claim = CURRENT_DATE;
GRANT SELECT ON daily_claims_today TO authenticated;