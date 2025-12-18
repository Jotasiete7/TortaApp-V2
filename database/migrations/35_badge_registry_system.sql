-- 35_badge_registry_system.sql
-- Creates an automated badge catalog that stays in sync with the database
-- 1. Create a view for the badge catalog
CREATE OR REPLACE VIEW badge_catalog AS
SELECT slug,
    name,
    description,
    icon_name,
    color,
    created_at,
    -- Calculate rarity based on how many users have it
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM user_badges
            WHERE badge_id = badges.id
        ) >= 100 THEN 'common'
        WHEN (
            SELECT COUNT(*)
            FROM user_badges
            WHERE badge_id = badges.id
        ) >= 20 THEN 'uncommon'
        WHEN (
            SELECT COUNT(*)
            FROM user_badges
            WHERE badge_id = badges.id
        ) >= 5 THEN 'rare'
        WHEN (
            SELECT COUNT(*)
            FROM user_badges
            WHERE badge_id = badges.id
        ) >= 1 THEN 'epic'
        ELSE 'legendary'
    END as calculated_rarity,
    (
        SELECT COUNT(*)
        FROM user_badges
        WHERE badge_id = badges.id
    ) as holders_count
FROM public.badges
ORDER BY created_at DESC;
-- Grant access to the view
GRANT SELECT ON badge_catalog TO authenticated,
    anon;
-- 2. Create function to get badge statistics
CREATE OR REPLACE FUNCTION get_badge_stats() RETURNS TABLE (
        total_badges INT,
        total_awarded INT,
        most_common_badge TEXT,
        rarest_badge TEXT,
        latest_badge TEXT
    ) AS $$ BEGIN RETURN QUERY WITH stats AS (
        SELECT COUNT(DISTINCT b.id) as badge_count,
            COUNT(ub.id) as award_count
        FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id
    ),
    most_common AS (
        SELECT b.name
        FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
        GROUP BY b.id,
            b.name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ), rarest AS (
        SELECT b.name
        FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id
        GROUP BY b.id,
            b.name
        ORDER BY COUNT(ub.id) ASC
        LIMIT 1
    ), latest AS (
        SELECT name
        FROM badges
        ORDER BY created_at DESC
        LIMIT 1
    )
SELECT s.badge_count::INT,
    s.award_count::INT,
    mc.name,
    r.name,
    l.name
FROM stats s
    CROSS JOIN most_common mc
    CROSS JOIN rarest r
    CROSS JOIN latest l;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_badge_stats() TO authenticated,
    anon;
-- 3. Create a table to log badge creation history
CREATE TABLE IF NOT EXISTS badge_changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_slug TEXT NOT NULL,
    action TEXT NOT NULL,
    -- 'created', 'updated', 'deleted'
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by TEXT,
    notes TEXT
);
-- 4. Create trigger to auto-log badge changes
CREATE OR REPLACE FUNCTION log_badge_changes() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN
INSERT INTO badge_changelog (badge_slug, action, notes)
VALUES (
        NEW.slug,
        'created',
        'Badge: ' || NEW.name || ' - ' || NEW.description
    );
ELSIF TG_OP = 'UPDATE' THEN
INSERT INTO badge_changelog (badge_slug, action, notes)
VALUES (NEW.slug, 'updated', 'Updated: ' || NEW.name);
ELSIF TG_OP = 'DELETE' THEN
INSERT INTO badge_changelog (badge_slug, action, notes)
VALUES (OLD.slug, 'deleted', 'Removed: ' || OLD.name);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS badge_change_logger ON badges;
CREATE TRIGGER badge_change_logger
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON badges FOR EACH ROW EXECUTE FUNCTION log_badge_changes();
-- 5. Function to export badge catalog as JSON
CREATE OR REPLACE FUNCTION export_badge_catalog() RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
SELECT jsonb_agg(
        jsonb_build_object(
            'slug',
            slug,
            'name',
            name,
            'description',
            description,
            'icon',
            icon_name,
            'color',
            color,
            'rarity',
            calculated_rarity,
            'holders',
            holders_count,
            'created',
            created_at
        )
        ORDER BY created_at DESC
    ) INTO result
FROM badge_catalog;
RETURN jsonb_build_object(
    'last_updated',
    now(),
    'total_badges',
    (
        SELECT COUNT(*)
        FROM badges
    ),
    'badges',
    result
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION export_badge_catalog() TO authenticated,
    anon;
-- 6. Query to generate markdown documentation
-- Run this manually when you want to update the docs
-- SELECT * FROM generate_badge_docs();
CREATE OR REPLACE FUNCTION generate_badge_docs() RETURNS TEXT AS $$
DECLARE doc TEXT := '';
badge RECORD;
BEGIN doc := E'# Badge Registry\n\n';
doc := doc || E'**Last Updated:** ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS') || E'\n\n';
doc := doc || E'## Available Badges\n\n';
doc := doc || E'| Icon | Name | Description | Rarity | Holders |\n';
doc := doc || E'|------|------|-------------|--------|----------|\n';
FOR badge IN
SELECT *
FROM badge_catalog LOOP doc := doc || '| ' || badge.icon_name || ' | **' || badge.name || '** | ' || badge.description || ' | ' || badge.calculated_rarity || ' | ' || badge.holders_count || E' |\n';
END LOOP;
doc := doc || E'\n## Statistics\n\n';
doc := doc || E'```sql\n';
doc := doc || E'SELECT * FROM get_badge_stats();\n';
doc := doc || E'```\n';
RETURN doc;
END;
$$ LANGUAGE plpgsql;
-- Initial run to populate changelog for existing badges
INSERT INTO badge_changelog (badge_slug, action, notes)
SELECT slug,
    'migrated',
    'Existing badge: ' || name || ' - ' || description
FROM badges ON CONFLICT DO NOTHING;