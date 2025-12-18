-- 39_check_daily_claim.sql
-- Run this to verify if daily XP was awarded
-- Check your current XP and last claim
SELECT id,
    xp,
    level,
    last_daily_claim,
    created_at
FROM public.profiles
WHERE id = auth.uid();
-- Alternative: Check by your game nick
SELECT p.id,
    un.game_nick,
    p.xp,
    p.level,
    p.last_daily_claim
FROM public.profiles p
    JOIN public.user_nicks un ON un.user_id = p.id
WHERE un.is_verified = true
    AND lower(un.game_nick) = 'jotasiete';
-- Replace with your nick
-- Test the claim function manually
SELECT claim_daily_rewards();