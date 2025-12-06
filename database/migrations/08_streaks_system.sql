-- 08_streaks_system.sql
-- 1. Create table for user streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    current_streak INT DEFAULT 0 NOT NULL,
    total_logins INT DEFAULT 0 NOT NULL,
    last_claim_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
-- 3. Policies
CREATE POLICY "Users can view own streak" ON public.user_streaks FOR
SELECT USING (auth.uid() = user_id);
-- 4. Seed 30-Day Streak Badge
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'streak_30_days',
        'Dedicated',
        'Achieved a 30-day login streak. Pure Dedication!',
        'Flame',
        'orange'
    ) ON CONFLICT (slug) DO NOTHING;
-- 5. RPC Function to Claim Daily Reward
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
-- If last claim was yesterday (date diff = 1), increment. Else reset to 1.
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
-- Handle 30-Day Milestone
IF new_streak = 30 THEN -- 1. Grant Badge
INSERT INTO public.user_badges (user_id, badge_id, is_displayed)
SELECT curr_user_id,
    id,
    true
FROM public.badges
WHERE slug = 'streak_30_days' ON CONFLICT (user_id, badge_id) DO NOTHING;
IF FOUND THEN earned_badge := true;
END IF;
-- 2. Add Shouts
UPDATE public.user_shout_balance
SET monthly_shouts_remaining = monthly_shouts_remaining + 10
WHERE user_id = curr_user_id;
bonus_shouts := 10;
-- 3. Global Announcement
INSERT INTO public.ticker_messages (text, color, paid, created_by)
SELECT '🏆 ' || COALESCE(
        (
            SELECT raw_user_meta_data->>'nick'
            FROM auth.users
            WHERE id = curr_user_id
        ),
        'Someone'
    ) || ' just hit a 30-day streak! Legend!',
    'gold',
    true,
    curr_user_id;
END IF;
-- Return Success
RETURN jsonb_build_object(
    'success',
    true,
    'new_streak',
    new_streak,
    'xp_gained',
    10,
    'bonus_shouts',
    bonus_shouts,
    'earned_badge',
    earned_badge
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;