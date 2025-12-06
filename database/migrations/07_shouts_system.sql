-- 07_shouts_system.sql
-- 1. Create Shout Balance Table
CREATE TABLE IF NOT EXISTS public.user_shout_balance (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    weekly_shouts_remaining INT DEFAULT 3 NOT NULL,
    monthly_shouts_remaining INT DEFAULT 10 NOT NULL,
    last_weekly_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Enable RLS
ALTER TABLE public.user_shout_balance ENABLE ROW LEVEL SECURITY;
-- 3. Policies
-- Users can view their own balance
CREATE POLICY "Users can view own shout balance" ON public.user_shout_balance FOR
SELECT USING (auth.uid() = user_id);
-- Only system (via functions) can update balance - NO DIRECT UPDATE POLICY FOR USERS
-- 4. RPC Function to Use a Shout
CREATE OR REPLACE FUNCTION use_free_shout(
        message_text TEXT,
        message_color TEXT DEFAULT 'green'
    ) RETURNS JSONB AS $$
DECLARE curr_user_id UUID;
balance_row public.user_shout_balance %ROWTYPE;
now_utc TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
is_weekly_reset_due BOOLEAN;
is_monthly_reset_due BOOLEAN;
BEGIN curr_user_id := auth.uid();
-- 1. Get or Create Balance Row (Lazy Initialization)
SELECT * INTO balance_row
FROM public.user_shout_balance
WHERE user_id = curr_user_id;
IF NOT FOUND THEN
INSERT INTO public.user_shout_balance (user_id)
VALUES (curr_user_id)
RETURNING * INTO balance_row;
END IF;
-- 2. Check Resets
-- Weekly: 7 days
is_weekly_reset_due := balance_row.last_weekly_reset < (now_utc - INTERVAL '7 days');
-- Monthly: 30 days
is_monthly_reset_due := balance_row.last_monthly_reset < (now_utc - INTERVAL '30 days');
IF is_weekly_reset_due THEN balance_row.weekly_shouts_remaining := 3;
balance_row.last_weekly_reset := now_utc;
END IF;
IF is_monthly_reset_due THEN balance_row.monthly_shouts_remaining := 10;
balance_row.last_monthly_reset := now_utc;
END IF;
-- Update resets if changed
IF is_weekly_reset_due
OR is_monthly_reset_due THEN
UPDATE public.user_shout_balance
SET weekly_shouts_remaining = balance_row.weekly_shouts_remaining,
    monthly_shouts_remaining = balance_row.monthly_shouts_remaining,
    last_weekly_reset = balance_row.last_weekly_reset,
    last_monthly_reset = balance_row.last_monthly_reset
WHERE user_id = curr_user_id;
END IF;
-- 3. Check Availability
IF balance_row.weekly_shouts_remaining <= 0 THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'No weekly shouts remaining.'
);
END IF;
IF balance_row.monthly_shouts_remaining <= 0 THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'No monthly shouts remaining.'
);
END IF;
-- 4. Deduct Shout
UPDATE public.user_shout_balance
SET weekly_shouts_remaining = weekly_shouts_remaining - 1,
    monthly_shouts_remaining = monthly_shouts_remaining - 1
WHERE user_id = curr_user_id;
-- 5. Insert Ticker Message
-- We mark 'paid' as true so it shows up in the ticker
INSERT INTO public.ticker_messages (text, color, paid, created_by)
VALUES (message_text, message_color, true, curr_user_id);
RETURN jsonb_build_object(
    'success',
    true,
    'remaining_weekly',
    balance_row.weekly_shouts_remaining - 1,
    'remaining_monthly',
    balance_row.monthly_shouts_remaining - 1
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;