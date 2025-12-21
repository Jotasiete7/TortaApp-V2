# Custom Badge Assets - Implementation Guide

## 🎨 Overview

This guide explains how to replace emoji badges with custom AI-generated embroidered badge images in TortaApp.

---

## 📐 Technical Specifications

### Image Requirements

**Format:** PNG with transparency (alpha channel)
**Dimensions:** 128x128 pixels (will be scaled down in UI)
**File Size:** < 50KB per badge (optimize with TinyPNG or similar)
**Color Mode:** RGB + Alpha
**Background:** Transparent
**DPI:** 72 (web standard)

**Why 128x128?**
- High enough quality for 2x/3x displays (Retina)
- Small enough for fast loading
- Standard size for icon assets
- Easy to scale down without quality loss

### Naming Convention

```
{badge_slug}.png
```

**Examples:**
- `first_trade.png`
- `trader_novice.png`
- `merchant_king.png`
- `christmas_trader.png`

**Rules:**
- Use exact slug from database `badges` table
- Lowercase only
- Underscores for spaces
- No special characters

---

## 📁 Folder Structure

```
TortaApp-V2/
├── public/
│   └── badges/               # ← Create this folder
│       ├── first_trade.png
│       ├── trader_novice.png
│       ├── merchant_king.png
│       ├── active_seller.png
│       ├── bargain_hunter.png
│       ├── price_expert.png
│       ├── tycoon_level_5.png
│       ├── night_owl.png
│       ├── early_bird.png
│       ├── christmas_trader.png
│       ├── new_year_boom.png
│       ├── spooky_merchant.png
│       ├── seller_peddler.png
│       ├── seller_shopkeeper.png
│       ├── seller_merchant.png
│       ├── seller_wholesaler.png
│       ├── seller_tycoon.png
│       ├── buyer_scavenger.png
│       ├── buyer_seeker.png
│       ├── buyer_collector.png
│       ├── buyer_investor.png
│       ├── buyer_shark.png
│       ├── pioneer_founder.png
│       ├── verdant_vicar.png
│       └── fallback.png      # Default badge if image missing
```

**Why `public/badges/`?**
- Vite automatically serves files from `public/` folder
- No import needed, just reference by path
- Easy to add/remove badges without rebuilding
- Can be updated independently

---

## 🎯 Display Sizes in UI

### Current Usage Locations

| Location | Display Size | CSS Class | Notes |
|----------|-------------|-----------|-------|
| PlayerProfile (main) | 32x32px | `w-8 h-8` | Next to player name |
| PlayerProfile (tooltip) | 48x48px | `w-12 h-12` | In hover tooltip |
| BadgeSelector | 40x40px | `w-10 h-10` | Selection grid |
| GamificationRules | 40x40px | `w-10 h-10` | Badge list |
| Leaderboard | 24x24px | `w-6 h-6` | Compact view |

**Recommendation:** Design at 128x128, let CSS scale down automatically.

---

## 💻 Implementation Code

### Step 1: Create Badge Image Component

**File:** `components/gamification/BadgeImage.tsx`

```typescript
import React from 'react';

interface BadgeImageProps {
    slug: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    alt?: string;
}

const SIZE_CLASSES = {
    sm: 'w-6 h-6',      // 24px - Leaderboard
    md: 'w-8 h-8',      // 32px - PlayerProfile
    lg: 'w-10 h-10',    // 40px - BadgeSelector
    xl: 'w-12 h-12'     // 48px - Tooltips
};

export const BadgeImage: React.FC<BadgeImageProps> = ({ 
    slug, 
    size = 'md', 
    className = '',
    alt 
}) => {
    const [imageError, setImageError] = React.useState(false);
    
    const imagePath = `/badges/${slug}.png`;
    const fallbackPath = '/badges/fallback.png';
    
    return (
        <img
            src={imageError ? fallbackPath : imagePath}
            alt={alt || slug}
            className={`${SIZE_CLASSES[size]} ${className} object-contain select-none`}
            onError={() => setImageError(true)}
            loading="lazy"
        />
    );
};
```

### Step 2: Update PlayerProfile.tsx

**File:** `components/PlayerProfile.tsx`

**Find this section (around line 181-195):**

```typescript
const renderBadgeIcon = (iconName: string) => {
    // First try native/mapped emoji (Most reliable/beautiful)
    const emojiChar = BADGE_TO_EMOJI[iconName];
    if (emojiChar) {
        return (
            <span className="text-2xl filter drop-shadow-md select-none transform transition-transform group-hover:scale-110 inline-block">
                {emojiChar}
            </span>
        );
    }
    
    // Fallback to Lucide (Least preferred but safe)
    const LucideIcon = BadgeIconMap[iconName] || Star;
    return <LucideIcon className="w-5 h-5" />;
};
```

**Replace with:**

```typescript
import { BadgeImage } from './gamification/BadgeImage';

const renderBadgeIcon = (badgeSlug: string, iconName: string) => {
    // Try custom badge image first
    return <BadgeImage slug={badgeSlug} size="md" />;
    
    // OLD CODE (keep as fallback if needed):
    // const emojiChar = BADGE_TO_EMOJI[iconName];
    // if (emojiChar) { ... }
};
```

**Update the usage (around line 264):**

```typescript
// OLD:
{renderBadgeIcon(iconName)}

// NEW:
{renderBadgeIcon(ub.badge?.slug || '', iconName)}
```

### Step 3: Update BadgeSelector.tsx

**File:** `components/gamification/BadgeSelector.tsx`

**Find badge rendering (search for badge icon display):**

```typescript
// Replace emoji/icon rendering with:
<BadgeImage slug={badge.slug} size="lg" />
```

### Step 4: Update GamificationRules.tsx

**File:** `components/gamification/GamificationRules.tsx`

**Same as above:**

```typescript
<BadgeImage slug={badge.slug} size="lg" />
```

---

## 🎨 Design Guidelines for AI Generation

### Prompt Template

```
Create a {badge_name} badge icon with an embroidered patch appearance.
Style: Embroidered fabric patch, stitched edges, slight 3D depth
Colors: {primary_color} with subtle shading
Background: Transparent
Size: 128x128 pixels, centered
Details: Clean, recognizable symbol, not too detailed
Mood: Premium, handcrafted, game achievement
```

### Example Prompts

**Merchant King Badge:**
```
Create a golden crown badge icon with an embroidered patch appearance.
Style: Embroidered fabric patch with gold thread, stitched edges, slight 3D depth
Colors: Rich gold (#FFD700) with amber highlights
Background: Transparent
Size: 128x128 pixels, centered
Details: Simple crown silhouette, 5 points, clean lines
Mood: Premium, regal, prestigious achievement
```

**Night Owl Badge:**
```
Create a purple moon and owl badge with embroidered patch appearance.
Style: Embroidered fabric patch, stitched edges, slight 3D depth
Colors: Deep purple (#9333EA) with silver moon
Background: Transparent
Size: 128x128 pixels, centered
Details: Crescent moon with small owl silhouette
Mood: Mysterious, nighttime, premium achievement
```

### Color Palette (from database)

| Badge Color | Hex Code | Usage |
|-------------|----------|-------|
| Gold | #FFD700 | Legendary badges |
| Amber | #F59E0B | Epic badges |
| Purple | #9333EA | Rare badges |
| Emerald | #10B981 | Uncommon badges |
| Blue | #3B82F6 | Common badges |
| Cyan | #06B6D4 | Special badges |
| Red | #EF4444 | Event badges |
| Slate | #64748B | Starter badges |

---

## 🚀 Migration Strategy

### Phase 1: Preparation (You are here)

1. ✅ Generate 16 badge images (128x128 PNG)
2. ✅ Optimize images (< 50KB each)
3. ✅ Name files correctly (`{slug}.png`)
4. ✅ Create `public/badges/` folder
5. ✅ Add all images to folder

### Phase 2: Code Implementation

1. Create `BadgeImage.tsx` component
2. Update `PlayerProfile.tsx`
3. Update `BadgeSelector.tsx`
4. Update `GamificationRules.tsx`
5. Create `fallback.png` (generic badge)

### Phase 3: Testing

1. Test each badge displays correctly
2. Test fallback works for missing badges
3. Test on different screen sizes
4. Test loading performance
5. Verify tooltips still work

### Phase 4: Rollout

1. Generate remaining badges (24 total)
2. Replace all emoji badges
3. Update documentation
4. Deploy to production

---

## ⚠️ Common Issues & Solutions

### Issue 1: Badge Not Displaying

**Symptoms:** Fallback badge shows instead of custom badge

**Causes:**
- Filename doesn't match slug exactly
- File not in `public/badges/` folder
- Image corrupted or wrong format

**Solution:**
```bash
# Check filename matches database slug
SELECT slug FROM badges WHERE slug = 'merchant_king';

# Verify file exists
ls public/badges/merchant_king.png

# Test image is valid PNG
file public/badges/merchant_king.png
```

### Issue 2: Blurry on Retina Displays

**Symptoms:** Badges look pixelated on high-DPI screens

**Cause:** Image too small (< 128x128)

**Solution:** Regenerate at 128x128 or higher, let CSS scale down

### Issue 3: Slow Loading

**Symptoms:** Badges take time to appear

**Causes:**
- File size too large (> 100KB)
- Too many badges loading at once

**Solutions:**
- Optimize images with TinyPNG
- Use `loading="lazy"` attribute (already in code)
- Consider sprite sheet for advanced optimization

### Issue 4: Inconsistent Appearance

**Symptoms:** Some badges look different in style

**Cause:** Generated with different prompts/settings

**Solution:** Use consistent AI generation settings:
- Same model/version
- Same style keywords
- Same dimensions
- Same color palette

---

## 📊 Performance Considerations

### File Size Budget

- **Per Badge:** < 50KB
- **Total (24 badges):** < 1.2MB
- **Acceptable:** Most users won't load all badges at once

### Optimization Tools

1. **TinyPNG** - https://tinypng.com/
   - Lossless compression
   - Reduces file size by 50-70%
   - Maintains transparency

2. **ImageOptim** (Mac) / **FileOptimizer** (Windows)
   - Batch optimization
   - Multiple formats

3. **Squoosh** - https://squoosh.app/
   - Web-based
   - Visual comparison

### Lazy Loading

Already implemented in `BadgeImage` component:
```typescript
loading="lazy"  // Only loads when badge enters viewport
```

---

## 🎯 Quick Start Checklist

- [ ] Create `public/badges/` folder
- [ ] Generate 24 badge images (128x128 PNG)
- [ ] Optimize all images (< 50KB each)
- [ ] Name files with exact database slugs
- [ ] Create `fallback.png` generic badge
- [ ] Create `BadgeImage.tsx` component
- [ ] Update `PlayerProfile.tsx`
- [ ] Update `BadgeSelector.tsx`
- [ ] Update `GamificationRules.tsx`
- [ ] Test all badges display correctly
- [ ] Verify fallback works
- [ ] Check performance on slow connection
- [ ] Deploy to production

---

## 📝 Database Slug Reference

Copy this list to ensure your filenames match exactly:

```
first_trade.png
trader_novice.png
active_seller.png
bargain_hunter.png
price_expert.png
merchant_king.png
tycoon_level_5.png
night_owl.png
early_bird.png
christmas_trader.png
new_year_boom.png
spooky_merchant.png
seller_peddler.png
seller_shopkeeper.png
seller_merchant.png
seller_wholesaler.png
seller_tycoon.png
buyer_scavenger.png
buyer_seeker.png
buyer_collector.png
buyer_investor.png
buyer_shark.png
pioneer_founder.png
verdant_vicar.png
```

---

## 🎨 Example: Complete Badge Creation Workflow

### 1. Generate Image

**AI Prompt:**
```
Create a golden crown embroidered badge patch icon.
Style: Embroidered fabric patch, gold thread stitching, 3D depth
Colors: Rich gold (#FFD700) with subtle shading
Background: Transparent PNG
Size: 128x128 pixels, centered
Details: Simple 5-point crown, clean silhouette
```

### 2. Save & Optimize

```bash
# Save as merchant_king_original.png
# Optimize with TinyPNG
# Save optimized as merchant_king.png
# Verify size < 50KB
```

### 3. Place in Folder

```bash
cp merchant_king.png public/badges/
```

### 4. Test

```typescript
// In browser console or component
<BadgeImage slug="merchant_king" size="md" />
```

### 5. Verify

- ✅ Badge displays correctly
- ✅ Transparent background
- ✅ Sharp on all displays
- ✅ Loads quickly

---

## 🚀 Future Enhancements

### Sprite Sheet (Advanced)

For ultimate performance, combine all badges into one image:

```typescript
// badges-sprite.png (1024x1024)
// Contains all 24 badges in a grid

const BADGE_POSITIONS = {
    'merchant_king': { x: 0, y: 0 },
    'trader_novice': { x: 128, y: 0 },
    // ... etc
};

// Use CSS background-position to show specific badge
```

**Benefits:**
- Single HTTP request for all badges
- Faster loading
- Better caching

**Tradeoffs:**
- More complex to maintain
- Harder to add new badges
- Larger initial download

**Recommendation:** Start with individual files, migrate to sprite sheet if performance becomes an issue.

---

## 📞 Support

If you encounter issues:

1. Check filename matches database slug exactly
2. Verify image is 128x128 PNG with transparency
3. Confirm file is in `public/badges/` folder
4. Test with fallback badge to isolate issue
5. Check browser console for errors

**Common Error Messages:**

- `Failed to load resource` → File not found, check path
- `Image corrupt or truncated` → Re-export PNG
- `CORS error` → File not in public folder
