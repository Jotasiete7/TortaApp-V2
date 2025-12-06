# Badge & Title Registry 📜

**Last Updated:** Auto-generated from database
**Total Badges:** 7 (as of Phase 4)

---

## How This Registry Works

This document is **automatically maintained** by the database:
- ✅ New badges are logged when added to `badges` table
- ✅ Rarity is calculated based on how many users have each badge
- ✅ Holder counts update in real-time
- ✅ Run `SELECT generate_badge_docs()` in Supabase to regenerate this doc

---

## Current Badges

### 🌟 Starter Badges

| Icon | Name | Slug | Description | How to Earn |
|------|------|------|-------------|-------------|
| ⭐ | **First Steps** | `first_trade` | Completed your first trade! | Post 1 trade |
| 🎖️ | **Trader Novice** | `trader_novice` | Completed 10 trades | Post 10 trades |

### 💼 Trading Specialist Badges

| Icon | Name | Slug | Description | How to Earn |
|------|------|------|-------------|-------------|
| 🛒 | **Active Seller** | `active_seller` | Posted 50 WTS trades | Post 50 WTS trades |
| 📈 | **Bargain Hunter** | `bargain_hunter` | Posted 50 WTB trades | Post 50 WTB trades |
| 🧪 | **Price Expert** | `price_expert` | Performed 50 price checks | Post 50 PC trades |

### 👑 Elite Badges

| Icon | Name | Slug | Description | How to Earn |
|------|------|------|-------------|-------------|
| 👑 | **Merchant King** | `merchant_king` | Legendary trader with 1000+ trades | Post 1000 trades |
| 🏆 | **Tycoon** | `tycoon_level_5` | Reached maximum level (5) | Reach Level 5 (1000+ trades) |

---

## Level Titles

| Level | Title | XP Range | Trade Range |
|-------|-------|----------|-------------|
| 1 | **Novice** | 0-490 | 0-49 trades |
| 2 | **Apprentice** | 500-1490 | 50-149 trades |
| 3 | **Merchant** | 1500-4990 | 150-499 trades |
| 4 | **Veteran** | 5000-9990 | 500-999 trades |
| 5 | **Tycoon** | 10000+ | 1000+ trades |

---

## Rarity System

Rarity is **automatically calculated** based on how many users have earned each badge:

- 🟢 **Common:** 100+ holders
- 🔵 **Uncommon:** 20-99 holders
- 🟣 **Rare:** 5-19 holders
- 🟠 **Epic:** 1-4 holders
- 🔴 **Legendary:** 0 holders (unclaimed!)

---

## Badge Statistics (Live)

To see current stats, run in Supabase:
```sql
SELECT * FROM get_badge_stats();
```

Returns:
- Total badges in system
- Total badges awarded
- Most common badge
- Rarest badge
- Latest badge added

---

## Badge Changelog

All badge additions/changes are logged in `badge_changelog` table:

```sql
SELECT * FROM badge_changelog ORDER BY changed_at DESC LIMIT 10;
```

---

## For Developers & AIs

### Adding a New Badge

When you add a badge using:
```sql
INSERT INTO badges (slug, name, description, icon_name, color) 
VALUES (...);
```

The system **automatically**:
1. ✅ Logs it to `badge_changelog`
2. ✅ Makes it visible in `badge_catalog` view
3. ✅ Calculates initial rarity as "legendary"
4. ✅ Updates holder count as users earn it

### Updating This Document

**Option 1: Auto-generate (Recommended)**
```sql
SELECT generate_badge_docs();
```
Copy output and replace the "Current Badges" section.

**Option 2: Manual**
```sql
SELECT * FROM badge_catalog;
```
Update the tables manually.

---

## Planned Badges (Future)

### 🎯 Achievement Badges
- 🔥 **Streak Master:** 7-day login streak
- 💎 **Diamond Hands:** Never deleted a trade
- 🎯 **Sniper:** Price check within 1% of final sale
- 📊 **Data Analyst:** Used ML Predictor 50 times
- 🎪 **Social Butterfly:** 100+ shout messages

### 🌙 Time-Based Badges
- 🌙 **Night Owl:** Trade posted after midnight (00:00-05:59)
- 🌅 **Early Bird:** Trade posted before 6 AM (06:00-06:59)

### 🎄 Seasonal Badges
- 🎄 **Christmas Trader:** Posted trade during December
- 🎆 **New Year Boom:** Posted trade on New Year's Day (Jan 1)
- 🎃 **Spooky Merchant:** Posted trade during October (Halloween season)

---

## API Access

### Get All Badges (JSON)
```typescript
const { data } = await supabase.rpc('export_badge_catalog');
console.log(data.badges); // Array of all badges
```

### Get Badge Stats
```typescript
const { data } = await supabase.rpc('get_badge_stats');
console.log(data); // Statistics object
```

### View Badge Catalog
```typescript
const { data } = await supabase.from('badge_catalog').select('*');
// Returns live view with calculated rarity
```

---

## Maintenance Notes

- **Rarity recalculates** every time `badge_catalog` view is queried
- **Changelog** is append-only (never delete entries)
- **Holder counts** are real-time (no caching)
- **Documentation** should be regenerated monthly or after major updates

---

**Registry Version:** 1.0 (Phase 4)
**System:** TortaApp Gamification
**Maintained by:** Database triggers + AI assistants
