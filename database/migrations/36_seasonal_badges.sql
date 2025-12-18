-- 36_seasonal_badges.sql
-- Implements time-based and seasonal achievement badges
-- Run this when you want to activate seasonal badges
-- 1. Seed Time-Based Badges
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'night_owl',
        'Night Owl',
        'Posted a trade after midnight',
        'Moon',
        'purple'
    ),
    (
        'early_bird',
        'Early Bird',
        'Posted a trade before 6 AM',
        'Sunrise',
        'yellow'
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;
-- 2. Seed Seasonal Badges
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'christmas_trader',
        'Christmas Trader',
        'Posted a trade during December',
        'Gift',
        'red'
    ),
    (
        'new_year_boom',
        'New Year Boom',
        'Posted a trade on New Year''s Day',
        'Sparkles',
        'gold'
    ),
    (
        'spooky_merchant',
        'Spooky Merchant',
        'Posted a trade during October',
        'Ghost',
        'orange'
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;
-- 3. Add Seasonal Badge Detection to auto_award_badges
-- This extends the existing auto_award_badges function
CREATE OR REPLACE FUNCTION auto_award_badges(target_user_id UUID) RETURNS JSONB AS $$
DECLARE user_stats RECORD;
badges_awarded TEXT [] := ARRAY []::TEXT [];
badge_id_to_add UUID;
user_nick TEXT;
BEGIN -- Get user's game nick
SELECT game_nick INTO user_nick
FROM public.user_nicks
WHERE user_id = target_user_id
    AND is_verified = true
LIMIT 1;
IF user_nick IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'No verified nick found'
);
END IF;
-- Get comprehensive stats
SELECT COUNT(*) as total,
    COUNT(*) FILTER (
        WHERE trade_type = 'WTS'
    ) as wts_count,
    COUNT(*) FILTER (
        WHERE trade_type = 'WTB'
    ) as wtb_count,
    COUNT(*) FILTER (
        WHERE trade_type = 'PC'
    ) as pc_count INTO user_stats
FROM public.trade_logs
WHERE lower(nick) = lower(user_nick);
SELECT level INTO user_stats.level
FROM public.profiles
WHERE id = target_user_id;
-- === EXISTING BADGES (from 34_enhanced_auto_badges.sql) ===
-- First Trade
IF user_stats.total >= 1 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'first_trade';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'First Steps');
END IF;
END IF;
END IF;
-- Trader Novice
IF user_stats.total >= 10 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'trader_novice';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Trader Novice');
END IF;
END IF;
END IF;
-- Active Seller
IF user_stats.wts_count >= 50 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'active_seller';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Active Seller');
END IF;
END IF;
END IF;
-- Bargain Hunter
IF user_stats.wtb_count >= 50 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'bargain_hunter';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Bargain Hunter');
END IF;
END IF;
END IF;
-- Price Expert
IF user_stats.pc_count >= 50 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'price_expert';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Price Expert');
END IF;
END IF;
END IF;
-- Merchant King
IF user_stats.total >= 1000 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'merchant_king';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Merchant King');
END IF;
END IF;
END IF;
-- Tycoon
IF user_stats.level >= 5 THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'tycoon_level_5';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Tycoon');
END IF;
END IF;
END IF;
-- === NEW: TIME-BASED BADGES ===
-- Night Owl (trade after midnight, before 6 AM)
IF EXISTS (
    SELECT 1
    FROM trade_logs
    WHERE lower(nick) = lower(user_nick)
        AND EXTRACT(
            HOUR
            FROM trade_timestamp_utc
        ) >= 0
        AND EXTRACT(
            HOUR
            FROM trade_timestamp_utc
        ) < 6
) THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'night_owl';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Night Owl');
END IF;
END IF;
END IF;
-- Early Bird (trade between 6 AM and 7 AM)
IF EXISTS (
    SELECT 1
    FROM trade_logs
    WHERE lower(nick) = lower(user_nick)
        AND EXTRACT(
            HOUR
            FROM trade_timestamp_utc
        ) = 6
) THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'early_bird';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Early Bird');
END IF;
END IF;
END IF;
-- === NEW: SEASONAL BADGES ===
-- Christmas Trader (trade in December)
IF EXISTS (
    SELECT 1
    FROM trade_logs
    WHERE lower(nick) = lower(user_nick)
        AND EXTRACT(
            MONTH
            FROM trade_timestamp_utc
        ) = 12
) THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'christmas_trader';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Christmas Trader');
END IF;
END IF;
END IF;
-- New Year Boom (trade on January 1st)
IF EXISTS (
    SELECT 1
    FROM trade_logs
    WHERE lower(nick) = lower(user_nick)
        AND EXTRACT(
            MONTH
            FROM trade_timestamp_utc
        ) = 1
        AND EXTRACT(
            DAY
            FROM trade_timestamp_utc
        ) = 1
) THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'new_year_boom';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'New Year Boom');
END IF;
END IF;
END IF;
-- Spooky Merchant (trade in October)
IF EXISTS (
    SELECT 1
    FROM trade_logs
    WHERE lower(nick) = lower(user_nick)
        AND EXTRACT(
            MONTH
            FROM trade_timestamp_utc
        ) = 10
) THEN
SELECT id INTO badge_id_to_add
FROM public.badges
WHERE slug = 'spooky_merchant';
IF badge_id_to_add IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_id_to_add) ON CONFLICT DO NOTHING;
IF FOUND THEN badges_awarded := array_append(badges_awarded, 'Spooky Merchant');
END IF;
END IF;
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'awarded',
    badges_awarded,
    'total_checked',
    12 -- Updated from 7 to 12 (7 original + 5 new)
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION auto_award_badges(uuid) TO authenticated,
    anon;
-- 4. Add icon mappings to BADGE_TO_EMOJI (for frontend reference)
-- Add these to PlayerProfile.tsx BADGE_TO_EMOJI map:
-- 'Moon': '🌙',
-- 'Sunrise': '🌅',
-- 'Ghost': '👻',
-- 'Sparkles': '✨',
-- (Gift already exists as '🎁')