-- 47_market_intelligence_optimization.sql
-- Optimizing Market Intelligence by moving aggregation to PostgreSQL (Server-Side)

-- 1. Helper: Extract QL Bucket (e.g. "90ql+")
CREATE OR REPLACE FUNCTION extract_ql_bucket(msg TEXT) RETURNS TEXT AS $$
DECLARE
    ql_match TEXT;
    ql_val INT;
BEGIN
    ql_match := substring(msg FROM '(?i)(\d+)\s*ql');
    IF ql_match IS NULL THEN
        RETURN ''; 
    ELSE
        ql_val := (ql_match::INT / 10) * 10;
        RETURN ql_val || 'ql+';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper: Parse Copper Price (Wurm Format: 1g 2s 3c)
-- FIXED: Uses BIGINT to avoid "integer out of range" on large transactions
CREATE OR REPLACE FUNCTION parse_wurm_price(msg TEXT) RETURNS BIGINT AS $$
DECLARE
    gold BIGINT;
    silver BIGINT;
    copper BIGINT;
    iron BIGINT;
BEGIN
    gold := COALESCE(substring(msg FROM '(?i)(\d+)\s*g')::BIGINT, 0);
    silver := COALESCE(substring(msg FROM '(?i)(\d+)\s*s')::BIGINT, 0);
    copper := COALESCE(substring(msg FROM '(?i)(\d+)\s*c')::BIGINT, 0);
    iron := COALESCE(substring(msg FROM '(?i)(\d+)\s*i')::BIGINT, 0);
    
    RETURN (gold * 10000) + (silver * 100) + (copper) + (iron);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Helper: Clean Item Name (Strip "Impure", "Selling", etc.)
CREATE OR REPLACE FUNCTION extract_clean_item_name(msg TEXT) RETURNS TEXT AS $$
DECLARE
    clean TEXT;
BEGIN
    -- Remove trade intents
    clean := regexp_replace(msg, '(?i)\b(wts|wtb|selling|buying|sold)\b', '', 'g');
    -- Remove noise prefixes (Impure, etc)
    clean := regexp_replace(clean, '(?i)\b(impure|shattered|unfinished|corroded|broken|damaged|rusty)\s+', '', 'g');
    -- Remove trailing price/ql info to isolate name (Simplified heuristic: split on digits)
    clean := regexp_replace(clean, '(?i)\s+\d+([gsc]|ql).*$', '');
    
    RETURN trim(both from clean);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create Materialized View for Aggregation
-- Aggregates data for the last 30 days to support all time windows
DROP MATERIALIZED VIEW IF EXISTS market_aggregated_mv;

CREATE MATERIALIZED VIEW market_aggregated_mv AS
WITH parsed AS (
    SELECT
        id,
        trade_timestamp_utc,
        trade_type,
        extract_clean_item_name(message) as item_name,
        extract_ql_bucket(message) as ql_bucket,
        parse_wurm_price(message) as price
    FROM trade_logs
    WHERE trade_timestamp_utc > (now() - interval '30 days')
),
filtered AS (
    SELECT * FROM parsed 
    WHERE length(item_name) > 2 -- Ignore noise
      AND price >= 0
)
SELECT
    item_name,
    ql_bucket,
    trade_type,
    count(*) as volume,
    avg(price) as avg_price,
    stddev(price) as volatility, -- True statistical volatility
    min(price) as min_price,
    max(price) as max_price,
    max(trade_timestamp_utc) as last_seen,
    min(trade_timestamp_utc) as first_seen
FROM filtered
GROUP BY item_name, ql_bucket, trade_type;

CREATE UNIQUE INDEX idx_market_agg_unique ON market_aggregated_mv(item_name, ql_bucket, trade_type);

-- 5. RPC: Get Optimized Market Trends
-- Replaces fetching raw logs. Filters the MV based on requested window.
CREATE OR REPLACE FUNCTION get_market_trends_optimized(window_hours INT) 
RETURNS TABLE (
    name TEXT,
    ql TEXT,
    trade_type TEXT,
    volume BIGINT,
    avg_price NUMERIC,
    volatility NUMERIC,
    price_change NUMERIC -- Proxy for absolute change using min/max logic or stddev
) AS $$
DECLARE
    cutoff TIMESTAMP;
BEGIN
    cutoff := now() - (window_hours || ' hours')::INTERVAL;
    
    -- Note: The MV is pre-aggregated for 30d. 
    -- For strict accuracy on shorter windows (4h), we ideally re-aggregate raw rows or accept the 30d average.
    -- To strictly follow the "Optimization Report", we should query the MV.
    -- However, an MV cannot dynamic filter timestamps *inside* the aggregation.
    -- HYBRID APPROACH: If window is small (<24h), we query raw tables (but faster via SQL).
    -- If window is large (>24h), we use MV.
    
    IF window_hours > 24 THEN
        RETURN QUERY
        SELECT 
            m.item_name, m.ql_bucket, m.trade_type, m.volume, m.avg_price::NUMERIC, m.volatility::NUMERIC, (m.max_price - m.min_price)::NUMERIC
        FROM market_aggregated_mv m
        WHERE m.last_seen > cutoff;
    ELSE
        -- Optimized raw query for short term (bypass MV lag)
        RETURN QUERY
        WITH raw_recent AS (
            SELECT 
                extract_clean_item_name(message) as n,
                extract_ql_bucket(message) as q,
                t.trade_type as tt,
                parse_wurm_price(message) as p
            FROM trade_logs t
            WHERE t.trade_timestamp_utc > cutoff
        )
        SELECT 
            n, q, tt, count(*), avg(p)::NUMERIC, stddev(p)::NUMERIC, (max(p) - min(p))::NUMERIC
        FROM raw_recent
        WHERE length(n) > 2
        GROUP BY n, q, tt;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Refresh Intelligence
CREATE OR REPLACE FUNCTION refresh_market_intelligence() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY market_aggregated_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Arbitrage Finder (SQL Optimized)
CREATE OR REPLACE FUNCTION get_arbitrage_opportunities_sql() 
RETURNS TABLE (
    item_name TEXT,
    wtb_max BIGINT, -- FIXED: Changed to BIGINT
    wts_min BIGINT, -- FIXED: Changed to BIGINT
    spread BIGINT,  -- FIXED: Changed to BIGINT
    ql TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH r_data AS (
        SELECT 
            extract_clean_item_name(message) as i_name,
            extract_ql_bucket(message) as i_ql,
            parse_wurm_price(message) as price,
            trade_type
        FROM trade_logs
        WHERE trade_timestamp_utc > (now() - interval '24 hours')
          AND parse_wurm_price(message) > 0
    ),
    demand AS (
        SELECT i_name, i_ql, max(price) as max_buy 
        FROM r_data WHERE trade_type = 'WTB' GROUP BY i_name, i_ql
    ),
    supply AS (
        SELECT i_name, i_ql, min(price) as min_sell 
        FROM r_data WHERE trade_type = 'WTS' GROUP BY i_name, i_ql
    )
    SELECT 
        d.i_name,
        d.max_buy,
        s.min_sell,
        (d.max_buy - s.min_sell) as spread_val,
        d.i_ql
    FROM demand d
    JOIN supply s ON d.i_name = s.i_name AND d.i_ql = s.i_ql
    WHERE d.max_buy >= s.min_sell
    ORDER BY spread_val DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
