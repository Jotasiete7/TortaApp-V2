-- 45_new_badges_and_logic.sql
-- 1. Insert New Badge Definitions
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES -- Seller Path
    (
        'seller_peddler',
        'Peddler',
        'Completed 1 WTS trade',
        'Tag',
        'slate'
    ),
    (
        'seller_shopkeeper',
        'Shopkeeper',
        'Completed 10 WTS trades',
        'Store',
        'blue'
    ),
    (
        'seller_merchant',
        'Merchant',
        'Completed 50 WTS trades',
        'Briefcase',
        'amber'
    ),
    (
        'seller_wholesaler',
        'Wholesaler',
        'Completed 100 WTS trades',
        'Container',
        'purple'
    ),
    (
        'seller_tycoon',
        'Monopoly Tycoon',
        'Completed 500 WTS trades',
        'Building',
        'gold'
    ),
    -- Buyer Path
    (
        'buyer_scavenger',
        'Scavenger',
        'Completed 1 WTB trade',
        'Search',
        'slate'
    ),
    (
        'buyer_seeker',
        'Seeker',
        'Completed 10 WTB trades',
        'Binoculars',
        'blue'
    ),
    (
        'buyer_collector',
        'Collector',
        'Completed 50 WTB trades',
        'Library',
        'amber'
    ),
    (
        'buyer_investor',
        'Investor',
        'Completed 100 WTB trades',
        'TrendingUp',
        'purple'
    ),
    (
        'buyer_shark',
        'Market Shark',
        'Completed 500 WTB trades',
        'Gem',
        'gold'
    ),
    -- Treasure Specialist (Movie Themed)
    (
        'treasure_goonie',
        'The Goonie',
        'Traded a Dirty Casket (Hey you guys!)',
        'Skull',
        'amber'
    ),
    (
        'treasure_pirate',
        'Pearl Captain',
        'Traded a Sealed Bottle',
        'Ship',
        'cyan'
    ),
    (
        'treasure_raider',
        'Tomb Raider',
        'Traded a Treasure Map',
        'Map',
        'emerald'
    ),
    (
        'treasure_hunter',
        'Fortune Hunter',
        'Traded 10 Treasure Items',
        'Compass',
        'purple'
    ),
    (
        'treasure_ark',
        'Ark Architect',
        'Traded 50 Treasure Items',
        'Archive',
        'gold'
    ),
    -- Special / Unique
    (
        'pioneer_founder',
        'Founding Pioneer',
        'One of the first 50 verified users',
        'Flag',
        'rose'
    ),
    (
        'verdant_vicar',
        'Verdant Vicar',
        'Unique badge for the First User. Fé, Aço e Worgs.',
        'Sprout',
        'emerald'
    ) -- Using Sprout as close proxy for now, will override icon rendering in frontend if needed
    ON CONFLICT (slug) DO NOTHING;
-- 2. Create Cumulative Badge Check Function
-- This function checks ALL criteria for a user and awards MISSING badges.
-- It is idempotent (safe to run multiple times).
CREATE OR REPLACE FUNCTION check_and_award_all_badges(target_user_id UUID) RETURNS JSONB AS $$
DECLARE stats_row RECORD;
wts_count INT := 0;
wtb_count INT := 0;
treasure_count INT := 0;
is_verified BOOLEAN := false;
new_badges TEXT [] := ARRAY []::TEXT [];
b_slug TEXT;
BEGIN -- Get Stats
SELECT * INTO stats_row
FROM public.player_stats
WHERE user_id = target_user_id;
-- If no stats, try to calc from logs (fallback) or 0
IF stats_row IS NOT NULL THEN wts_count := stats_row.total_wts;
wtb_count := stats_row.total_wtb;
END IF;
-- Check Validation
SELECT (email_confirmed_at IS NOT NULL) INTO is_verified
FROM auth.users
WHERE id = target_user_id;
-- === SELLER LOGIC ===
IF wts_count >= 1 THEN PERFORM award_badge_if_missing(target_user_id, 'seller_peddler');
END IF;
IF wts_count >= 10 THEN PERFORM award_badge_if_missing(target_user_id, 'seller_shopkeeper');
END IF;
IF wts_count >= 50 THEN PERFORM award_badge_if_missing(target_user_id, 'seller_merchant');
END IF;
IF wts_count >= 100 THEN PERFORM award_badge_if_missing(target_user_id, 'seller_wholesaler');
END IF;
IF wts_count >= 500 THEN PERFORM award_badge_if_missing(target_user_id, 'seller_tycoon');
END IF;
-- === BUYER LOGIC ===
IF wtb_count >= 1 THEN PERFORM award_badge_if_missing(target_user_id, 'buyer_scavenger');
END IF;
IF wtb_count >= 10 THEN PERFORM award_badge_if_missing(target_user_id, 'buyer_seeker');
END IF;
IF wtb_count >= 50 THEN PERFORM award_badge_if_missing(target_user_id, 'buyer_collector');
END IF;
IF wtb_count >= 100 THEN PERFORM award_badge_if_missing(target_user_id, 'buyer_investor');
END IF;
IF wtb_count >= 500 THEN PERFORM award_badge_if_missing(target_user_id, 'buyer_shark');
END IF;
-- === PIONEER LOGIC (First 50 Verified) ===
-- Only award if verified AND ID is in the global top 50 by creation date
IF is_verified THEN IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = target_user_id
        AND id IN (
            SELECT id
            FROM auth.users
            ORDER BY created_at ASC
            LIMIT 50
        )
) THEN PERFORM award_badge_if_missing(target_user_id, 'pioneer_founder');
END IF;
END IF;
RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Helper to award safely
CREATE OR REPLACE FUNCTION award_badge_if_missing(t_user_id UUID, t_slug TEXT) RETURNS VOID AS $$
DECLARE b_id UUID;
BEGIN
SELECT id INTO b_id
FROM public.badges
WHERE slug = t_slug;
IF b_id IS NOT NULL THEN
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (t_user_id, b_id) ON CONFLICT (user_id, badge_id) DO NOTHING;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Trigger on Stats Update
-- Whenever player_stats is updated (e.g. after upload), run the badge check
CREATE OR REPLACE FUNCTION trigger_check_badges() RETURNS TRIGGER AS $$ BEGIN PERFORM check_and_award_all_badges(NEW.user_id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_stats_update_check_badges ON public.player_stats;
CREATE TRIGGER on_stats_update_check_badges
AFTER
UPDATE ON public.player_stats FOR EACH ROW EXECUTE FUNCTION trigger_check_badges();
-- 5. Manual Assignment for Padre
DO $$
DECLARE padre_id UUID;
BEGIN
SELECT id INTO padre_id
FROM auth.users
WHERE raw_user_meta_data->>'nick' = 'padrejarbas'
LIMIT 1;
IF padre_id IS NOT NULL THEN PERFORM award_badge_if_missing(padre_id, 'verdant_vicar');
END IF;
END $$;