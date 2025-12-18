-- 32_fix_ambiguous_nick.sql
-- Fixes the "ambiguous column reference" error by aliasing the table.
CREATE OR REPLACE FUNCTION get_player_stats_v3(target_nick TEXT) RETURNS TABLE (
        nick TEXT,
        wts_count INT,
        wtb_count INT,
        pc_count INT,
        total INT,
        first_seen TIMESTAMPTZ,
        last_seen TIMESTAMPTZ,
        fav_server TEXT,
        rank_position BIGINT,
        xp BIGINT,
        level INT
    ) AS $$
DECLARE stat_wts INT := 0;
stat_wtb INT := 0;
stat_pc INT := 0;
stat_total INT := 0;
stat_first TIMESTAMPTZ;
stat_last TIMESTAMPTZ;
stat_server TEXT;
stat_rank BIGINT := 0;
user_xp BIGINT := 0;
user_level INT := 1;
BEGIN -- Aggregate Stats (Aliased trade_logs as tl to avoid ambiguity)
SELECT COUNT(*) FILTER (
        WHERE tl.trade_type = 'WTS'
    ),
    COUNT(*) FILTER (
        WHERE tl.trade_type = 'WTB'
    ),
    COUNT(*) FILTER (
        WHERE tl.trade_type = 'PC'
    ),
    COUNT(*),
    MIN(tl.trade_timestamp_utc),
    MAX(tl.trade_timestamp_utc),
    MODE() WITHIN GROUP (
        ORDER BY tl.server
    ) INTO stat_wts,
    stat_wtb,
    stat_pc,
    stat_total,
    stat_first,
    stat_last,
    stat_server
FROM public.trade_logs tl
WHERE lower(tl.nick) = lower(target_nick);
-- Return empty if no trades
IF stat_total IS NULL
OR stat_total = 0 THEN RETURN;
END IF;
-- Fetch XP/Level
SELECT p.xp,
    p.level INTO user_xp,
    user_level
FROM public.user_nicks un
    JOIN public.profiles p ON un.user_id = p.id
WHERE lower(un.game_nick) = lower(target_nick)
LIMIT 1;
-- Fallback for unverified users
IF user_xp IS NULL THEN user_xp := stat_total * 10;
user_level := CASE
    WHEN stat_total >= 1000 THEN 5
    WHEN stat_total >= 500 THEN 4
    WHEN stat_total >= 150 THEN 3
    WHEN stat_total >= 50 THEN 2
    ELSE 1
END;
END IF;
-- Calculate Rank (Aliased here too just in case)
WITH counts AS (
    SELECT tl2.nick,
        COUNT(*) as c
    FROM public.trade_logs tl2
    GROUP BY tl2.nick
)
SELECT COUNT(*) + 1 INTO stat_rank
FROM counts
WHERE c > stat_total;
RETURN QUERY
SELECT target_nick::TEXT,
    COALESCE(stat_wts, 0),
    COALESCE(stat_wtb, 0),
    COALESCE(stat_pc, 0),
    COALESCE(stat_total, 0),
    stat_first,
    stat_last,
    COALESCE(stat_server, 'Unknown'),
    stat_rank,
    user_xp,
    user_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_player_stats_v3(text) TO anon,
    authenticated,
    service_role;
-- Test it immediately
SELECT *
FROM get_player_stats_v3('Jotasiete');