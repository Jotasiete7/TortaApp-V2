-- 18_debug_rankings_analysis.sql
-- 1. Check Trade Type Distribution
-- We expect to see 'PC', 'WTS', 'WTB' etc.
SELECT trade_type,
    count(*)
FROM public.trade_logs
GROUP BY trade_type;
-- 2. Inspect the definition of the problematic function
-- This will return the source code of the function
SELECT prosrc
FROM pg_proc
WHERE proname = 'get_top_price_checkers';
-- 3. Try to manually run a similar query to see if it works
-- This simulates what the function *should* do
SELECT nick,
    COUNT(*) as pc_count
FROM public.trade_logs
WHERE trade_type = 'PC'
    AND created_at > (NOW() - INTERVAL '7 days')
GROUP BY nick
ORDER BY pc_count DESC
LIMIT 5;