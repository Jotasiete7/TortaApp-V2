-- Function: get_player_activity_chart_v2
-- Reason: Renamed to v2 to bypass a sticky PostgREST schema cache issue (PGRST202)
-- Description: Returns a daily count of trades for a specific player over the last 30 days.
DROP FUNCTION IF EXISTS get_player_activity_chart_v2(text);
CREATE OR REPLACE FUNCTION get_player_activity_chart_v2(target_nick TEXT) RETURNS TABLE (
        activity_date TEXT,
        trade_count BIGINT
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT to_char(
        date_trunc('day', trade_timestamp_utc),
        'YYYY-MM-DD'
    ) as activity_date,
    count(*) as trade_count
FROM trade_logs
WHERE nick ILIKE target_nick
    AND trade_timestamp_utc > (now() - interval '90 days')
GROUP BY 1
ORDER BY 1 ASC;
END;
$$;
-- Grant access to API roles
GRANT EXECUTE ON FUNCTION get_player_activity_chart_v2(text) TO anon;
GRANT EXECUTE ON FUNCTION get_player_activity_chart_v2(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_activity_chart_v2(text) TO service_role;
-- Force reload just in case
NOTIFY pgrst,
'reload config';