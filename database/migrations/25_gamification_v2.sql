-- 25_gamification_v2.sql
-- Creating a V2 function to bypass Supabase Schema Cache issues
-- This function is identical to get_player_stats_advanced but with a new name
CREATE OR REPLACE FUNCTION get_player_stats_v2(target_nick TEXT) RETURNS TABLE (
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
    ) AS $$ BEGIN RETURN QUERY WITH player_data AS (
        SELECT p.nick,
            p.wts_count,
            p.wtb_count,
            p.pc_count,
            p.total,
            p.first_seen,
            p.last_seen,
            p.fav_server,
            p.id,
            p.xp,
            p.level
        FROM public.profiles p
        WHERE lower(p.nick) = lower(target_nick)
    ),
    ranking AS (
        SELECT id,
            RANK() OVER (
                ORDER BY total DESC
            ) as rnk
        FROM public.profiles
    )
SELECT pd.nick,
    pd.wts_count,
    pd.wtb_count,
    pd.pc_count,
    pd.total,
    pd.first_seen,
    pd.last_seen,
    pd.fav_server,
    r.rnk,
    COALESCE(pd.xp, 0) as xp,
    -- Ensure valid return
    COALESCE(pd.level, 1) as level -- Ensure valid return
FROM player_data pd
    LEFT JOIN ranking r ON pd.id = r.id;
END;
$$ LANGUAGE plpgsql;