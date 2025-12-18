-- 19_fix_rankings_rpc.sql
-- Drop the old function just in case signature changed
DROP FUNCTION IF EXISTS get_top_price_checkers(INT, DATE);
DROP FUNCTION IF EXISTS get_top_price_checkers(INT, TEXT);
-- Re-create the function with simplified logic
CREATE OR REPLACE FUNCTION get_top_price_checkers(
        limit_count INT,
        week_start TEXT -- Expecting 'YYYY-MM-DD'
    ) RETURNS TABLE (
        rank BIGINT,
        nick TEXT,
        pc_count BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT ROW_NUMBER() OVER (
        ORDER BY COUNT(*) DESC
    ) as rank,
    t.nick,
    COUNT(*) as pc_count
FROM public.trade_logs t
WHERE t.trade_type = 'PC'
    AND t.created_at >= week_start::TIMESTAMPTZ
GROUP BY t.nick
ORDER BY pc_count DESC
LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;