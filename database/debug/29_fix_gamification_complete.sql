-- 29_fix_gamification_complete.sql
-- 1. Force Add XP and Level to profiles (if missing)
-- We use a safe block to avoid errors if they exist, but we ensure they are added.
DO $$ BEGIN BEGIN
ALTER TABLE public.profiles
ADD COLUMN xp BIGINT DEFAULT 0;
EXCEPTION
WHEN duplicate_column THEN -- Column exists, ignore
RAISE NOTICE 'Column xp already exists in profiles.';
END;
BEGIN
ALTER TABLE public.profiles
ADD COLUMN level INT DEFAULT 1;
EXCEPTION
WHEN duplicate_column THEN -- Column exists, ignore
RAISE NOTICE 'Column level already exists in profiles.';
END;
END $$;
-- 2. Create V3 RPC that Aggregates Stats + Fetches XP
-- This replaces the broken v2 function.
-- It works by:
-- A. Calculating stats from trade_logs (WTS, WTB, Total, etc)
-- B. Fetching XP/Level from profiles (via user_nicks mapping)
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
DECLARE -- Variables to hold aggregated data
    stat_wts INT := 0;
stat_wtb INT := 0;
stat_pc INT := 0;
stat_total INT := 0;
stat_first TIMESTAMPTZ;
stat_last TIMESTAMPTZ;
stat_server TEXT;
stat_rank BIGINT := 0;
-- Variables for Gamification
user_xp BIGINT := 0;
user_level INT := 1;
BEGIN -- A. Aggregate Stats from trade_logs for this nickname (Case Insensitive)
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
-- If no logs found, return empty (effectively "Player Not Found" logic in frontend)
IF stat_total IS NULL
OR stat_total = 0 THEN RETURN;
END IF;
-- B. Fetch XP/Level from Profiles (if User is Verified)
-- We join user_nicks to find the user_id, then profiles to get xp/level
SELECT p.xp,
    p.level INTO user_xp,
    user_level
FROM public.user_nicks un
    JOIN public.profiles p ON un.user_id = p.id
WHERE lower(un.game_nick) = lower(target_nick)
LIMIT 1;
-- Default to calculated Legacy XP if user is not verified/has no DB XP yet
IF user_xp IS NULL THEN user_xp := stat_total * 10;
-- Legacy Formula
-- Legacy Level Calc
user_level := CASE
    WHEN stat_total >= 1000 THEN 5
    WHEN stat_total >= 500 THEN 4
    WHEN stat_total >= 150 THEN 3
    WHEN stat_total >= 50 THEN 2
    ELSE 1
END;
END IF;
-- C. Calculate Rank Position (Approximation based on Total Trades)
-- This counts how many players have MORE trades than this player
WITH counts AS (
    SELECT nick,
        COUNT(*) as c
    FROM public.trade_logs
    GROUP BY nick
)
SELECT COUNT(*) + 1 INTO stat_rank
FROM counts
WHERE c > stat_total;
-- D. Return the Combined Row
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