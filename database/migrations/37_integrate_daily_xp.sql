-- 37_integrate_daily_xp.sql
-- Integrates Daily Check-in with XP/Level system
-- Updates claim_daily_rewards to award XP to profiles table
CREATE OR REPLACE FUNCTION claim_daily_rewards() RETURNS JSONB AS $$
DECLARE curr_user_id UUID;
streak_row public.user_streaks %ROWTYPE;
now_utc TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
last_claim_date DATE;
current_date_utc DATE := (now() AT TIME ZONE 'utc')::DATE;
new_streak INT;
reward_message TEXT := 'Daily Login Bonus';
bonus_shouts INT := 0;
earned_badge BOOLEAN := false;
daily_xp INT := 10;
-- XP reward for daily login
current_xp BIGINT;
new_level INT;
BEGIN curr_user_id := auth.uid();
-- Get or Initialize Streak Row
SELECT * INTO streak_row
FROM public.user_streaks
WHERE user_id = curr_user_id;
IF NOT FOUND THEN
INSERT INTO public.user_streaks (user_id)
VALUES (curr_user_id)
RETURNING * INTO streak_row;
END IF;
-- Check if already claimed today
IF streak_row.last_claim_at IS NOT NULL THEN last_claim_date := (streak_row.last_claim_at AT TIME ZONE 'utc')::DATE;
IF last_claim_date = current_date_utc THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Already claimed today',
    'streak',
    streak_row.current_streak
);
END IF;
END IF;
-- Calculate Streak
IF streak_row.last_claim_at IS NOT NULL
AND (
    current_date_utc - (
        (streak_row.last_claim_at AT TIME ZONE 'utc')::DATE
    )
) = 1 THEN new_streak := streak_row.current_streak + 1;
ELSE new_streak := 1;
END IF;
-- Update Streak Table
UPDATE public.user_streaks
SET current_streak = new_streak,
    total_logins = total_logins + 1,
    last_claim_at = now_utc
WHERE user_id = curr_user_id;
-- === NEW: Award XP to profiles ===
UPDATE public.profiles
SET xp = xp + daily_xp
WHERE id = curr_user_id
RETURNING xp INTO current_xp;
-- Recalculate level based on new XP
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
-- Handle 30-Day Milestone
IF new_streak = 30 THEN
INSERT INTO public.user_badges (user_id, badge_id, is_displayed)
SELECT curr_user_id,
    id,
    true
FROM public.badges
WHERE slug = 'streak_30_days' ON CONFLICT (user_id, badge_id) DO NOTHING;
earned_badge := true;
reward_message := '30-Day Streak Unlocked!';
bonus_shouts := 100;
UPDATE public.user_shout_balance
SET balance = balance + bonus_shouts
WHERE user_id = curr_user_id;
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'streak',
    new_streak,
    'message',
    reward_message,
    'bonus_shouts',
    bonus_shouts,
    'earned_badge',
    earned_badge,
    'xp_awarded',
    daily_xp,
    'total_xp',
    current_xp,
    'level',
    new_level
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION claim_daily_rewards() TO authenticated;