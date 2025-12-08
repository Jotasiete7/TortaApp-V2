-- 43_fix_realtime_final.sql
-- Fixes "cannot change return type" error by dropping the function first.
begin;
-- 1. Enable Realtime for 'profiles' table (where XP lives)
-- (Safe to run multiple times, or ignore if already on)
alter publication supabase_realtime
add table public.profiles;
-- 2. DROP the function first because we are changing its return signature
DROP FUNCTION IF EXISTS get_player_stats_v3(text);
-- 3. Re-create the function with the new user_id column
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
        level INT,
        user_id UUID -- Novo campo
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
target_uid UUID;
BEGIN
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
IF stat_total IS NULL
OR stat_total = 0 THEN RETURN;
END IF;
SELECT p.xp,
    p.level,
    p.id INTO user_xp,
    user_level,
    target_uid
FROM public.user_nicks un
    JOIN public.profiles p ON un.user_id = p.id
WHERE lower(un.game_nick) = lower(target_nick)
LIMIT 1;
IF user_xp IS NULL
OR user_xp = 0 THEN user_xp := stat_total * 10;
user_level := CASE
    WHEN stat_total >= 1000 THEN 5
    WHEN stat_total >= 500 THEN 4
    WHEN stat_total >= 150 THEN 3
    WHEN stat_total >= 50 THEN 2
    ELSE 1
END;
END IF;
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
    user_level,
    target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_player_stats_v3(text) TO anon,
    authenticated,
    service_role;
commit;