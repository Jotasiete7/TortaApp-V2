-- 40_check_jotasiete_xp.sql
-- Direct check without auth.uid()
-- Check Jotasiete's current XP and last claim
SELECT p.xp,
    p.level,
    p.last_daily_claim,
    un.game_nick
FROM public.profiles p
    JOIN public.user_nicks un ON un.user_id = p.id
WHERE lower(un.game_nick) = 'jotasiete'
    AND un.is_verified = true;
-- Expected result:
-- If daily claim worked:
--   xp: 2950 (2940 + 10)
--   level: 3
--   last_daily_claim: 2025-12-06