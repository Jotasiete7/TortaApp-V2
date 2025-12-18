# Gamification System - Developer & AI Guide

## Overview
This document serves as a technical reference for understanding and extending the TortaApp gamification system. It's designed to help AI assistants and developers add new badges, modify XP formulas, and maintain the system.

---

## System Architecture

### Database Schema

#### Tables
```sql
-- User Profiles (stores XP and Level)
public.profiles
├── id (uuid, PK)
├── role (text)
├── xp (bigint, default 0)
├── level (int, default 1)
└── created_at (timestamptz)

-- Badge Definitions
public.badges
├── id (uuid, PK)
├── slug (text, unique) -- e.g., 'trader_novice'
├── name (text)         -- e.g., 'Trader Novice'
├── description (text)  -- e.g., 'Completed 10 trades'
├── icon_name (text)    -- Lucide icon name
├── color (text)        -- TailwindCSS color
└── created_at (timestamptz)

-- User Badge Awards
public.user_badges
├── id (uuid, PK)
├── user_id (uuid, FK -> profiles.id)
├── badge_id (uuid, FK -> badges.id)
├── earned_at (timestamptz, default now())
├── is_displayed (boolean, default false)
└── UNIQUE(user_id, badge_id) -- Prevents duplicates
```

---

## XP & Level System

### Current Formula
```typescript
XP = Total Trades × 10

Level Thresholds:
- Level 1: 0-49 trades (0-490 XP)
- Level 2: 50-149 trades (500-1490 XP)
- Level 3: 150-499 trades (1500-4990 XP)
- Level 4: 500-999 trades (5000-9990 XP)
- Level 5: 1000+ trades (10000+ XP)
```

### How to Modify XP Formula

**Location:** `33_refine_v3_logic.sql` or create new migration

**Example: Change to 20 XP per trade**
```sql
-- In get_player_stats_v3 function
IF user_xp IS NULL OR user_xp = 0 THEN
    user_xp := stat_total * 20; -- Changed from 10 to 20
    -- Update level thresholds accordingly
END IF;
```

**Example: Add bonus XP for specific trade types**
```sql
-- Award more XP for WTS trades
user_xp := (stat_wts * 15) + (stat_wtb * 10) + (stat_pc * 5);
```

---

## Badge System

### Current Badges (as of Phase 4)

| Slug | Name | Criteria | Icon | Color |
|------|------|----------|------|-------|
| `first_trade` | First Steps | 1 trade | Star | yellow |
| `trader_novice` | Trader Novice | 10 trades | Award | slate |
| `active_seller` | Active Seller | 50 WTS | ShoppingCart | emerald |
| `bargain_hunter` | Bargain Hunter | 50 WTB | TrendingUp | blue |
| `price_expert` | Price Expert | 50 PC | Beaker | purple |
| `merchant_king` | Merchant King | 1000 trades | Crown | gold |
| `tycoon_level_5` | Tycoon | Level 5 | Trophy | amber |

### Available Colors
```
yellow, amber, gold, emerald, blue, cyan, purple, pink, 
red, orange, slate
```

### Available Icons (Lucide React)
```
Star, Award, Trophy, Crown, Shield, Heart, Gift, Beaker,
TrendingUp, ShoppingCart, Flame, Zap, Diamond, Swords,
Scroll, Map, Compass, Anchor, Hammer, Axe, Pickaxe
```

---

## How to Add a New Badge

### Step 1: Design the Badge

**Decide on:**
1. **Slug:** Unique identifier (lowercase, underscores) - e.g., `streak_master`
2. **Name:** Display name - e.g., "Streak Master"
3. **Description:** What it's for - e.g., "Logged in 7 days in a row"
4. **Icon:** Lucide icon name - e.g., `Flame`
5. **Color:** TailwindCSS color - e.g., `orange`
6. **Criteria:** How to earn it - e.g., `user_streak >= 7`

### Step 2: Seed the Badge

**Create SQL migration:** `35_add_new_badge.sql`

```sql
-- Example: Adding "Streak Master" badge
INSERT INTO public.badges (slug, name, description, icon_name, color) 
VALUES (
    'streak_master',
    'Streak Master',
    'Logged in 7 days in a row',
    'Flame',
    'orange'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;
```

### Step 3: Add Detection Logic

**Update:** `auto_award_badges` function in `34_enhanced_auto_badges.sql`

```sql
-- Add this block to the auto_award_badges function
-- (after existing badge checks, before final RETURN)

-- Streak Master (7-day streak)
IF user_stats.current_streak >= 7 THEN
    SELECT id INTO badge_id_to_add 
    FROM public.badges 
    WHERE slug = 'streak_master';
    
    IF badge_id_to_add IS NOT NULL THEN
        INSERT INTO public.user_badges (user_id, badge_id) 
        VALUES (target_user_id, badge_id_to_add)
        ON CONFLICT DO NOTHING;
        
        IF FOUND THEN 
            badges_awarded := array_append(badges_awarded, 'Streak Master'); 
        END IF;
    END IF;
END IF;
```

### Step 4: Update Badge Count

**Don't forget to increment `total_checked` in the RETURN statement:**

```sql
RETURN jsonb_build_object(
    'success', true, 
    'awarded', badges_awarded,
    'total_checked', 8  -- Changed from 7 to 8
);
```

### Step 5: Test

```sql
-- Run in Supabase SQL Editor
SELECT auto_award_badges('YOUR_USER_ID');

-- Verify badge was awarded
SELECT b.name, ub.earned_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
WHERE ub.user_id = 'YOUR_USER_ID'
ORDER BY ub.earned_at DESC;
```

---

## Advanced Badge Patterns

### Time-Based Badges
```sql
-- Example: "Early Bird" - First trade before 6 AM
IF EXISTS (
    SELECT 1 FROM trade_logs 
    WHERE lower(nick) = lower(user_nick)
    AND EXTRACT(HOUR FROM trade_timestamp_utc) < 6
) THEN
    -- Award badge
END IF;
```

### Combo Badges
```sql
-- Example: "Jack of All Trades" - 10+ of each type
IF user_stats.wts_count >= 10 
   AND user_stats.wtb_count >= 10 
   AND user_stats.pc_count >= 10 THEN
    -- Award badge
END IF;
```

### Rarity Tiers
```sql
-- Add rarity column to badges table
ALTER TABLE badges ADD COLUMN rarity TEXT DEFAULT 'common';

-- Update existing badges
UPDATE badges SET rarity = 'legendary' WHERE slug = 'merchant_king';
UPDATE badges SET rarity = 'epic' WHERE slug = 'tycoon_level_5';
UPDATE badges SET rarity = 'rare' WHERE slug IN ('active_seller', 'bargain_hunter');
```

---

## Frontend Integration

### Displaying New Badges

Badges automatically appear in `PlayerProfile.tsx` if:
1. User has earned them (`user_badges` table)
2. `is_displayed = true` (set via Badge Selector)

### Adding Badge to Emoji Map

**Location:** `components/PlayerProfile.tsx`

```typescript
const BADGE_TO_EMOJI: Record<string, string> = {
    // ... existing badges
    'Flame': '🔥',  // Add new icon mapping
};
```

---

## Common Pitfalls

### ❌ Duplicate Badges
**Problem:** User gets same badge multiple times
**Solution:** Always use `ON CONFLICT DO NOTHING`

### ❌ Missing Stats
**Problem:** Badge criteria uses data not in `user_stats`
**Solution:** Add to SELECT query in `auto_award_badges`:
```sql
SELECT 
    COUNT(*) as total,
    -- Add new stat here
    MAX(created_at) as last_trade_date
INTO user_stats
FROM trade_logs...
```

### ❌ Badge Not Appearing
**Checklist:**
1. Badge seeded in `badges` table?
2. Detection logic added to `auto_award_badges`?
3. RPC has correct permissions (`GRANT EXECUTE`)?
4. User meets criteria?
5. Frontend calling `auto_award_badges` on profile view?

---

## Future Enhancements

### Planned Features
- [ ] Seasonal/event badges (Christmas, Anniversary)
- [ ] Hidden/secret badges (discovered by exploration)
- [ ] Badge progression (Bronze → Silver → Gold)
- [ ] Badge showcase (display up to 5 on profile)
- [ ] Badge notifications (toast when earned)

### Performance Optimization
If `auto_award_badges` becomes slow (>1s):
1. Cache user stats in `profiles` table
2. Use database triggers instead of lazy evaluation
3. Add indexes on `trade_logs(nick, trade_type)`

---

## Quick Reference: Adding a Badge

```bash
# 1. Create SQL file
touch 35_add_my_badge.sql

# 2. Add badge seed + detection logic
# 3. Run in Supabase
# 4. Test with: SELECT auto_award_badges('user_id');
# 5. Verify in app
```

**Template:**
```sql
-- Seed
INSERT INTO badges (slug, name, description, icon_name, color) 
VALUES ('my_badge', 'My Badge', 'Description', 'Icon', 'color');

-- Detection (add to auto_award_badges)
IF [CRITERIA] THEN
    SELECT id INTO badge_id_to_add FROM badges WHERE slug = 'my_badge';
    INSERT INTO user_badges (user_id, badge_id) 
    VALUES (target_user_id, badge_id_to_add)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN badges_awarded := array_append(badges_awarded, 'My Badge'); END IF;
END IF;
```

---

## Contact & Maintenance

**Last Updated:** 2025-12-06
**System Version:** Phase 4 (Advanced Gamification)
**Maintainer:** AI Assistant (Antigravity)

For questions or issues, refer to:
- `phase4_walkthrough.md` - Implementation details
- `34_enhanced_auto_badges.sql` - Current badge logic
- `technical_specs_gamification.md` - Original specifications
