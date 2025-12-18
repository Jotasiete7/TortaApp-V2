-- 27_check_profiles_schema.sql
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles';