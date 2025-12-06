-- 26_diagnose_schema.sql
-- Run this to check the health of the gamification system
-- 1. Check if columns exist
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('xp', 'level');
-- 2. Check if V2 function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_player_stats_v2';
-- 3. Try to run the function for a known user (Replace with your nick if needed)
-- NOTE: If this part fails with an error, it means the function code is broken (likely missing columns)
SELECT *
FROM get_player_stats_v2('Jotasiete');