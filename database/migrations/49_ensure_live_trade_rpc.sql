-- 49_ensure_live_trade_rpc.sql
CREATE OR REPLACE FUNCTION submit_live_trade(
    p_trade_hash TEXT,
    p_nick TEXT,
    p_trade_type TEXT,
    p_message TEXT,
    p_timestamp TIMESTAMPTZ,
    p_server TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.trade_logs (log_hash, nick, trade_type, message, trade_timestamp_utc, server, user_id, verification_status, created_at)
    VALUES (p_trade_hash, p_nick, p_trade_type, p_message, p_timestamp, p_server, p_user_id, 'PENDING', NOW())
    RETURNING id INTO new_id;
    RETURN jsonb_build_object('success', true, 'trade_id', new_id);
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Already exists');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION submit_live_trade TO authenticated;
GRANT EXECUTE ON FUNCTION submit_live_trade TO service_role;
GRANT EXECUTE ON FUNCTION submit_live_trade TO anon;
