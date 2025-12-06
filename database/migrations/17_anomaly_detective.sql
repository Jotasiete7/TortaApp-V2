-- 17_anomaly_detective.sql
-- RPC: Detect Anomalies
-- Scans trade_logs for suspicious data
CREATE OR REPLACE FUNCTION admin_detect_anomalies() RETURNS TABLE (
        log_id BIGINT,
        seller_name TEXT,
        buyer_name TEXT,
        item_name TEXT,
        price_gold FLOAT,
        quantity INT,
        created_at TIMESTAMPTZ,
        anomaly_type TEXT,
        anomaly_score INT -- 1 to 10 severity
    ) AS $$
DECLARE avg_price FLOAT;
BEGIN -- Security Check
IF (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
) NOT IN ('admin', 'superuser', 'postgres') THEN RAISE EXCEPTION 'Access denied.';
END IF;
RETURN QUERY -- 1. Date Anomalies (Future Dates)
SELECT tl.id as log_id,
    tl.seller_name,
    tl.buyer_name,
    tl.item_name,
    CAST(tl.price_gold AS FLOAT),
    tl.quantity,
    tl.created_at,
    'FUTURE_DATE'::TEXT as anomaly_type,
    10 as anomaly_score
FROM public.trade_logs tl
WHERE tl.created_at > NOW()
UNION ALL
-- 2. Negative Prices or Quantities
SELECT tl.id,
    tl.seller_name,
    tl.buyer_name,
    tl.item_name,
    CAST(tl.price_gold AS FLOAT),
    tl.quantity,
    tl.created_at,
    'INVALID_VALUE'::TEXT,
    10
FROM public.trade_logs tl
WHERE tl.price_gold < 0
    OR tl.quantity <= 0
UNION ALL
-- 3. Extreme Price Outliers (Absurdly High)
-- Assuming 10,000,000 is a "safe" insanity cap for now. 
-- In a real scenario we'd compare against average item price.
SELECT tl.id,
    tl.seller_name,
    tl.buyer_name,
    tl.item_name,
    CAST(tl.price_gold AS FLOAT),
    tl.quantity,
    tl.created_at,
    'EXTREME_PRICE'::TEXT,
    8
FROM public.trade_logs tl
WHERE tl.price_gold > 10000000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- RPC: Clean/Resolve Anomalies
-- Allows deleting specific logs found by the detective
CREATE OR REPLACE FUNCTION admin_clean_anomalies(target_log_ids BIGINT []) RETURNS JSONB AS $$
DECLARE deleted_count INT;
BEGIN -- Security Check
IF (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
) NOT IN ('admin', 'superuser', 'postgres') THEN RAISE EXCEPTION 'Access denied.';
END IF;
DELETE FROM public.trade_logs
WHERE id = ANY(target_log_ids);
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN jsonb_build_object(
    'success',
    true,
    'deleted_count',
    deleted_count
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;