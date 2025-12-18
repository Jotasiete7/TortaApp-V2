-- 31_debug_fix_v3.sql
-- "Repair Kit" for Gamification V3
-- 1. Adds missing columns
-- 2. Creates the V3 function
-- 3. Grants permissions
-- 4. Tests the function
-- SECTION 1: Ensure Columns Exist
DO $$ BEGIN BEGIN
ALTER TABLE public.profiles
ADD COLUMN xp BIGINT DEFAULT 0;
RAISE NOTICE 'Added xp column';
EXCEPTION
WHEN duplicate_column THEN RAISE NOTICE 'xp column already exists';
END;
BEGIN
ALTER TABLE public.profiles
ADD COLUMN level INT DEFAULT 1;
RAISE NOTICE 'Added level column';
EXCEPTION
WHEN duplicate_column THEN RAISE NOTICE 'level column already exists';
END;
END $$;
-- SECTION 2: Create V3 Function (Security Definer)
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
BEGIN -- Aggregate Stats
SELECT COUNT(*) FILTER (
        WHERE trade_type = 'WTS'
    ),
    COUNT(*) FILTER (
        WHERE trade_type = 'WTB'
    ),
    COUNT(*) FILTER (
        WHERE trade_type = 'PC'
    ),
    COUNT(*),
    MIN(trade_timestamp_utc),
    MAX(trade_timestamp_utc),
    MODE() WITHIN GROUP (
        ORDER BY server
    ) INTO stat_wts,
    stat_wtb,
    stat_pc,
    stat_total,
    stat_first,
    stat_last,
    stat_server
FROM public.trade_logs
WHERE lower(nick) = lower(target_nick);
-- Return empty if no trades
IF stat_total IS NULL
OR stat_total = 0 THEN RETURN;
END IF;
-- Fetch XP/Level (Try to find linked user)
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
-- Calculate Rank
WITH counts AS (
    SELECT nick,
        COUNT(*) as c
    FROM public.trade_logs
    GROUP BY nick
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
-- SECTION 3: Grant Permissions (Crucial!)
GRANT EXECUTE ON FUNCTION get_player_stats_v3(text) TO anon,
    authenticated,
    service_role;
-- SECTION 4: Test It Immediately
-- This result will show in your SQL Editor output
SELECT *
FROM get_player_stats_v3('Jotasiete');