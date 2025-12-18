-- 09_admin_stats.sql
-- Function to get total database size (public schema) and row counts
CREATE OR REPLACE FUNCTION get_db_usage() RETURNS JSONB AS $$
DECLARE total_size_bytes BIGINT;
trade_logs_count BIGINT;
users_count BIGINT;
BEGIN -- Calculate total size of all tables in public schema
SELECT sum(
        pg_total_relation_size(
            quote_ident(schemaname) || '.' || quote_ident(tablename)
        )
    ) INTO total_size_bytes
FROM pg_tables
WHERE schemaname = 'public';
-- Get specific row counts
SELECT count(*) INTO trade_logs_count
FROM public.trade_logs;
SELECT count(*) INTO users_count
FROM auth.users;
RETURN jsonb_build_object(
    'total_size_bytes',
    COALESCE(total_size_bytes, 0),
    'trade_logs_count',
    trade_logs_count,
    'users_count',
    users_count,
    'limit_bytes',
    524288000 -- 500MB (Free Tier Limit)
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;