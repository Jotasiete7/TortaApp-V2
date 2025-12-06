-- 20_check_xp_schema.sql
-- Check if xp and level columns exist in profiles
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN ('xp', 'level');