-- ============================================
-- Phase 2: Database Optimization (CORRECTED)
-- ============================================
-- Step 1: Add price_copper column
-- This allows storing normalized prices (1g = 10,000c, 1s = 100c)
ALTER TABLE trade_logs
ADD COLUMN IF NOT EXISTS price_copper BIGINT;
-- Step 1b: Add item column (for advanced parser)
ALTER TABLE trade_logs
ADD COLUMN IF NOT EXISTS item TEXT;
-- Step 1c: Add quality column (for advanced parser)
ALTER TABLE trade_logs
ADD COLUMN IF NOT EXISTS quality SMALLINT;
-- Step 1d: Add rarity column (for advanced parser)
ALTER TABLE trade_logs
ADD COLUMN IF NOT EXISTS rarity TEXT;
-- Step 2: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_price_copper ON trade_logs(price_copper)
WHERE price_copper IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_item ON trade_logs(item)
WHERE item IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quality ON trade_logs(quality)
WHERE quality IS NOT NULL;
-- Step 3: Materialized View - Average Price by Trade Type
-- Pre-calculates average prices to reduce query load
-- Note: Using 'message' column since 'item' doesn't exist
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_avg_price_by_type AS
SELECT trade_type,
    item_category,
    AVG(price_copper) as avg_price_copper,
    STDDEV(price_copper) as price_volatility,
    COUNT(*) as trade_count,
    MAX(trade_timestamp_utc) as last_trade,
    MIN(trade_timestamp_utc) as first_trade
FROM trade_logs
WHERE price_copper IS NOT NULL
    AND trade_type IS NOT NULL
GROUP BY trade_type,
    item_category;
-- Step 4: Materialized View - Average Price by Item
-- This will be populated when parser extracts item names
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_avg_price_by_item AS
SELECT item,
    AVG(price_copper) as avg_price_copper,
    AVG(quality) as avg_quality,
    STDDEV(price_copper) as price_volatility,
    COUNT(*) as trade_count,
    MAX(trade_timestamp_utc) as last_trade
FROM trade_logs
WHERE price_copper IS NOT NULL
    AND item IS NOT NULL
GROUP BY item;
-- Step 5: Index on Materialized Views
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_avg_price_type ON mv_avg_price_by_type(trade_type, item_category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_avg_price_item ON mv_avg_price_by_item(item);
-- Step 6: Materialized View - Price Trends (Last 7 Days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_price_trends_7d AS
SELECT trade_type,
    item_category,
    DATE_TRUNC('day', trade_timestamp_utc) as trade_day,
    AVG(price_copper) as avg_price,
    MIN(price_copper) as min_price,
    MAX(price_copper) as max_price,
    COUNT(*) as trade_count
FROM trade_logs
WHERE price_copper IS NOT NULL
    AND trade_type IS NOT NULL
    AND trade_timestamp_utc > NOW() - INTERVAL '7 days'
GROUP BY trade_type,
    item_category,
    trade_day
ORDER BY trade_type,
    item_category,
    trade_day DESC;
-- Step 6: Materialized View - Top Traders by Volume
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_traders AS
SELECT nick,
    server,
    COUNT(*) as total_trades,
    COUNT(DISTINCT DATE_TRUNC('day', trade_timestamp_utc)) as active_days,
    MAX(trade_timestamp_utc) as last_trade
FROM trade_logs
WHERE verification_status = 'VERIFIED'
GROUP BY nick,
    server
HAVING COUNT(*) > 5
ORDER BY total_trades DESC
LIMIT 100;
-- Step 7: Function to refresh views
CREATE OR REPLACE FUNCTION refresh_price_views() RETURNS void AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY mv_avg_price_by_type;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_avg_price_by_item;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_price_trends_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_traders;
END;
$$ LANGUAGE plpgsql;
-- Step 8: Schedule automatic refresh (requires pg_cron extension)
-- Run this manually if pg_cron is available:
-- SELECT cron.schedule(
--   'refresh-price-views',
--   '0 * * * *',  -- Every hour
--   'SELECT refresh_price_views();'
-- );
-- ============================================
-- Verification Queries
-- ============================================
-- Check if column was added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'trade_logs' AND column_name = 'price_copper';
-- Check materialized views
-- SELECT schemaname, matviewname, matviewowner 
-- FROM pg_matviews 
-- WHERE matviewname LIKE 'mv_%';
-- Test query performance
-- EXPLAIN ANALYZE 
-- SELECT * FROM mv_avg_price_by_type WHERE trade_type = 'WTS';