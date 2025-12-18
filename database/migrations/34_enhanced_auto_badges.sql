-- 34_enhanced_auto_badges.sql
-- Enhanced Auto-Badge System with comprehensive achievement detection
-- 1. Seed all achievement badges
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'first_trade',
        'First Steps',
        'Completed your first trade!',
        'Star',
        'yellow'
    ),
    (
        'trader_novice',
        'Trader Novice',
        'Completed 10 trades',
        'Award',
        'slate'
    ),
    (
        'active_seller',
        'Active Seller',
        'Posted 50 WTS trades',
        'ShoppingCart',
        'emerald'
    ),
    (
        'bargain_hunter',
        'Bargain Hunter',
        'Posted 50 WTB trades',
        'TrendingUp',
        'blue'
    ),
    (
        'price_expert',
        'Price Expert',
        'Performed 50 price checks',
        'Beaker',
        'purple'
    ),
    (
        'merchant_king',
        'Merchant King',
        'Legendary trader with 1000+ trades',
        'Crown',
        'gold'
    ),
    (
        'tycoon_level_5',
        'Tycoon',
        'Reached maximum level (5)',
        'Trophy',
        'amber'
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;
-- 2. Enhanced Auto-Award Function
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
-- If no verified nick, can't calculate stats
IF user_nick IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'No verified nick found'
);
END IF;
-- Get comprehensive stats from trade_logs
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
-- Get level from profiles
SELECT level INTO user_stats.level
FROM public.profiles
WHERE id = target_user_id;
-- Award badges based on achievements
-- First Trade (1+)
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
-- Trader Novice (10+)
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
-- Active Seller (50+ WTS)
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
-- Bargain Hunter (50+ WTB)
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
-- Price Expert (50+ PC)
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
-- Merchant King (1000+)
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
-- Tycoon (Level 5)
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
RETURN jsonb_build_object(
    'success',
    true,
    'awarded',
    badges_awarded,
    'total_checked',
    7
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION auto_award_badges(uuid) TO authenticated,
    anon;