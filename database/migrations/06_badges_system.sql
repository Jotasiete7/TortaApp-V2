-- 06_badges_system.sql
-- 1. Create Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    -- e.g., 'admin', 'patreon_tier1', 'top_seller_2025'
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT NOT NULL,
    -- e.g., 'Shield', 'Award', 'Star' (Lucide names)
    color TEXT DEFAULT 'amber',
    -- e.g., 'amber', 'purple', 'emerald'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Create User Badges Table (Link Table)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_displayed BOOLEAN DEFAULT false,
    -- User selects which ones to show (max 5)
    UNIQUE(user_id, badge_id)
);
-- 3. Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
-- 4. Policies
-- Everyone can see badge definitions
CREATE POLICY "Public badges access" ON public.badges FOR
SELECT USING (true);
-- Everyone can see who has what badge
CREATE POLICY "Public user_badges access" ON public.user_badges FOR
SELECT USING (true);
-- Users can update their own badge display status
CREATE POLICY "Users can update own badge display" ON public.user_badges FOR
UPDATE USING (auth.uid() = user_id);
-- 5. Seed Initial Badges
INSERT INTO public.badges (slug, name, description, icon_name, color)
VALUES (
        'admin',
        'Administrator',
        'System Administrator',
        'Shield',
        'red'
    ),
    (
        'patreon_supporter',
        'Patreon Supporter',
        'Supports the project on Patreon',
        'Heart',
        'pink'
    ),
    (
        'market_mogul',
        'Market Mogul',
        'Top 1% Trader',
        'TrendingUp',
        'emerald'
    ),
    (
        'xmas_2025',
        'Christmas 2025',
        'Uploaded trade data during Xmas 2025',
        'Gift',
        'red'
    ),
    (
        'beta_tester',
        'Beta Tester',
        'Participated in the Torta App Beta',
        'Beaker',
        'blue'
    ) ON CONFLICT (slug) DO NOTHING;
-- 6. Helper Function to set displayed badges (handles the "max 5" logic safely)
CREATE OR REPLACE FUNCTION update_displayed_badges(badge_ids UUID []) RETURNS VOID AS $$
DECLARE curr_user_id UUID;
BEGIN curr_user_id := auth.uid();
-- 1. Reset all to false for this user
UPDATE public.user_badges
SET is_displayed = false
WHERE user_id = curr_user_id;
-- 2. Set true for the selected ones (limit to 5 just in case)
UPDATE public.user_badges
SET is_displayed = true
WHERE user_id = curr_user_id
    AND badge_id = ANY(badge_ids)
    AND id IN (
        SELECT id
        FROM public.user_badges
        WHERE user_id = curr_user_id
            AND badge_id = ANY(badge_ids)
        LIMIT 5
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;