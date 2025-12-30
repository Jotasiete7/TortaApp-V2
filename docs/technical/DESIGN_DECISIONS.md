# ðŸ§  TortaApp - Design Decisions & Implementation Guide

**Purpose:** Prevent regressions when multiple agents/developers work on the project.  
**Last Updated:** 2025-12-08

---

## ðŸŽ¯ Core Principles

1. **Never remove existing optimizations** without explicit user request
2. **Always check component history** before major refactors
3. **Preserve user-facing features** unless replacing with better version
4. **Maintain performance** - `useMemo`, `useCallback` are there for a reason

---

## ðŸ—ï¸ Critical Components - DO NOT BREAK

### 1. Sidebar (`components/layout/Sidebar.tsx`)

**Key Features (DO NOT REMOVE):**
- âœ… Admin Panel visibility based on `role`
- âœ… Patreon support link
- âœ… Icon-based navigation
- âœ… Active state highlighting
- âœ… Responsive design

**Recent Improvements:**
- Layout optimizations (spacing, alignment)
- Conditional rendering for admin items
- Smooth transitions

**If modifying:** Check git history first, preserve all conditional logic.

---

### 2. UserSettings (`components/UserSettings.tsx`)

**Key Features:**
- âœ… Audio controls (volume, mute)
- âœ… Visual effects toggles
- âœ… **Auto-Updater button** (Check for Updates)
- âœ… SoundService integration

**Critical:** The "Check for Updates" section was added for Tauri auto-updater. DO NOT remove.

---

### 3. MarketTable (`components/market/MarketTable.tsx`)

**Performance Critical:**
- âœ… Uses `useMemo` for `processedData` (filters 100k+ records)
- âœ… Pagination (50 items per page)
- âœ… SearchEngine integration
- âœ… Advanced query parser

**DO NOT:**
- Remove `useMemo` hooks
- Change pagination logic without testing
- Break search operators (`ql>90`, `price<50`)

---

### 4. MLPredictor (`components/market/MLPredictor.tsx`)

**Complex Logic:**
- âœ… Dynamic material extraction
- âœ… Bulk analysis
- âœ… Statistical calculations
- âœ… Confidence scoring

**If modifying:** This is ML code. Test thoroughly before changes.

---

## ðŸŽ¨ Design Standards

### Colors
- **Primary:** Amber (`amber-500`, `amber-400`)
- **Background:** Slate (`slate-900`, `slate-800`)
- **Text:** White/Slate-300
- **Accents:** Emerald (success), Rose (error), Purple (special)

### Typography
- **Headers:** `text-2xl font-bold`
- **Body:** `text-sm` or `text-base`
- **Muted:** `text-slate-400` or `text-slate-500`

### Spacing
- **Cards:** `p-6` or `p-8`
- **Gaps:** `gap-4` or `gap-6`
- **Margins:** `mb-4`, `mt-6` (consistent)

---

## âš¡ Performance Rules

### Always Use:
1. **`useMemo`** for expensive calculations
2. **`useCallback`** for event handlers passed to children
3. **Pagination** for large datasets
4. **Lazy loading** for heavy components (if needed)

### Never Do:
1. âŒ Remove existing `useMemo` without profiling
2. âŒ Load all 100k records at once
3. âŒ Inline complex calculations in JSX
4. âŒ Create new objects/arrays in render

---

## ðŸ” Security Rules

### Environment Variables
- **NEVER** hardcode API keys
- **ALWAYS** use `import.meta.env.VITE_*`
- **CHECK** `.gitignore` before committing

### Data Sanitization
- âœ… `sanitizeItemName()` for item names
- âœ… `sanitizeSeller()` for seller names
- âœ… Prevent token leakage in logs

---

## ðŸ“¦ State Management

### Global State (App.tsx)
- `user` - Current authenticated user
- `data` - Trade logs (from file or DB)
- `referencePrices` - Price reference data
- `currentView` - Active navigation view

### Local State
- Each component manages its own UI state
- Use `useState` for simple state
- Use `useMemo` for derived state

---

## ðŸ§© Component Hierarchy

```
App.tsx (root)
â”œâ”€â”€ Login.tsx (if not authenticated)
â””â”€â”€ Main Layout
    â”œâ”€â”€ Sidebar.tsx
    â”œâ”€â”€ NewsTicker.tsx
    â”œâ”€â”€ Dashboard.tsx
    â”œâ”€â”€ MarketTable.tsx
    â”œâ”€â”€ MLPredictor.tsx
    â”œâ”€â”€ UserSettings.tsx
    â””â”€â”€ FeedbackWidget.tsx
```

---

## ðŸš¨ Common Pitfalls

### 1. "Simplifying" Code
**Problem:** Removing `useMemo` to "simplify"  
**Impact:** Performance regression with large datasets  
**Solution:** Keep optimizations unless profiling shows they're unnecessary

### 2. Changing Component Structure
**Problem:** Refactoring without checking dependencies  
**Impact:** Breaking parent components that rely on specific props  
**Solution:** Search for component usage before major changes

### 3. Removing "Unused" Features
**Problem:** Deleting code that seems unused  
**Impact:** Breaking admin features or future functionality  
**Solution:** Ask user before removing anything

---

## ðŸ“ Before Making Changes

### Checklist:
1. [ ] Read this document
2. [ ] Check component's git history
3. [ ] Search for component usage (`grep -r "ComponentName"`)
4. [ ] Test with realistic data (100k+ records)
5. [ ] Verify no regressions in related features

---

## ðŸ”„ When Multiple Agents Work

### For the Agent:
1. **Read this file first** before major changes
2. **Preserve existing optimizations** unless explicitly asked to remove
3. **Ask user** if unsure about removing something
4. **Document new decisions** by updating this file

### For the User:
1. **Reference this file** when asking for changes
2. **Mention if something was recently improved** by another agent
3. **Request explicit preservation** of critical features

---

## ðŸ“š Key Files Reference

| File | Purpose | Critical Features |
|------|---------|-------------------|
| `App.tsx` | Main app logic | Routing, auth, data loading |
| `Sidebar.tsx` | Navigation | Admin visibility, Patreon link |
| `MarketTable.tsx` | Trade search | Performance, search operators |
| `MLPredictor.tsx` | Price prediction | ML algorithms, confidence |
| `UserSettings.tsx` | User preferences | Audio, updates, animations |
| `Dashboard.tsx` | Overview | Stats, leaderboard, upload |

---

## ðŸŽ¯ Future Considerations

### Planned Features:
- Mobile view
- Real-time notifications
- Social features (friends, groups)

### Technical Debt:
- None critical currently
- Bundle size could be optimized further (code splitting)

---

**Remember:** This is a **production-ready beta**. Every feature exists for a reason. When in doubt, preserve existing functionality.
## ðŸŽ® Gamification System - Critical Rules

### Badge System

**Registry Location:** `docs/technical/BADGE_REGISTRY.md`

**Rules for Adding New Badges:**
1. **Always update BADGE_REGISTRY.md first**
2. **Use consistent ID format:** `badge_name_lowercase`
3. **Required fields:** id, name, description, icon, rarity, criteria

**Database Integration:**
- Badges table: `user_badges`
- Award via: `award_badge(user_id, badge_id)` RPC
- Check via: `has_badge(user_id, badge_id)` RPC

### XP System

**XP Formula:** `1 Trade = 10 XP`

**XP Sources (DO NOT CHANGE):**
- WTS/WTB/PC: +10 XP each
- Daily Check-in: +10 XP
- Upload Log: +50 XP

**Level Thresholds (FIXED):**
- Level 1: 0-50 trades
- Level 2: 50-150 trades
- Level 3: 150-500 trades
- Level 4: 500-1000 trades
- Level 5: 1000+ trades

---

## ðŸ—„ï¸ Database Patterns & SQL Guidelines

### Naming Conventions
- **Tables:** Plural snake_case (`trade_logs`, `user_badges`)
- **Columns:** snake_case (`user_id`, `created_at`)
- **Functions:** Verb_noun (`get_global_stats`, `award_badge`)

### Critical RPC Functions (DO NOT BREAK)
- `get_global_stats` - Dashboard stats
- `get_trade_logs_for_market` - Market data
- `submit_logs_batch` - Bulk upload
- `award_badge` - Badge system
- `update_rankings` - Leaderboards

### Migration Pattern
**File naming:** `XX_descriptive_name.sql`

**Checklist:**
1. Add to `database/migrations/`
2. Number sequentially
3. Include rollback comments
4. Test locally first
5. Document in CHANGELOG

---

## ðŸ”§ Development Workflows

### Adding a New Badge
1. Update BADGE_REGISTRY.md
2. Create SQL migration
3. Test award function
4. Verify UI display

### Adding a New SQL Function
1. Create migration file
2. Update TypeScript types
3. Call from service
4. Document here

---

## ðŸš€ Performance Checklist
- [ ] Large lists use pagination
- [ ] Expensive calculations use `useMemo`
- [ ] No console.logs in production
- [ ] Bundle size checked

---

**Last Updated:** 2025-12-08

---

## ðŸŽ¨ Design System - Assets & Branding

### Icons & Images

**Icon Library:** Lucide React (`lucide-react` v0.555.0)
- âœ… Consistent style across app
- âœ… Tree-shakeable (only imports used icons)
- âœ… Customizable size/color

**DO NOT:**
- âŒ Mix icon libraries (no Font Awesome, Material Icons, etc.)
- âŒ Use raster icons for UI (use SVG/Lucide only)
- âŒ Hardcode icon sizes (use Tailwind classes)

**App Icons (Tauri):**
- Location: `src-tauri/icons/`
- Windows: `icon.ico` (59 KB)
- macOS: `icon.icns` (866 KB)
- PNG sizes: 32x32, 64x64, 128x128, 128x128@2x

**DO NOT** replace icons without regenerating all sizes.

### Emoji System (DEPRECATED / REMOVED)
**Status:** Removed to prevent VS Code / Language Server RAM exhaustion.
**Reason:** 4,000+ SVG files caused high memory usage in dev environment.
**Solution:** EmojiPicker is currently disabled/empty. Future solution should use sprites or CDN.

---

## ðŸŽ¨ Color Palette - DO NOT CHANGE

### Primary Colors
```css
/* Amber (Brand Color) */
--amber-400: #fbbf24;  /* Hover states */
--amber-500: #f59e0b;  /* Primary actions */
--amber-600: #d97706;  /* Active states */

/* Slate (Backgrounds) */
--slate-700: #334155;  /* Borders */
--slate-800: #1e293b;  /* Cards */
--slate-900: #0f172a;  /* Background */
```

### Semantic Colors
```css
/* Success */
--emerald-400: #34d399;
--emerald-500: #10b981;

/* Error */
--rose-400: #fb7185;
--rose-500: #f43f5e;

/* Warning */
--yellow-400: #facc15;
--yellow-500: #eab308;

/* Info */
--blue-400: #60a5fa;
--blue-500: #3b82f6;

/* Special (Gamification) */
--purple-500: #a855f7;
--purple-600: #9333ea;
```

**Why These Colors:**
- Amber: Warm, inviting (Wurm Online theme)
- Slate: Professional, easy on eyes (dark mode)
- High contrast for accessibility

**DO NOT** change without user approval - documented in user guides.

---

## ðŸ“ Typography & Fonts

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;
```

**Why System Fonts:**
- âœ… No external font loading (faster)
- âœ… Native look on each OS
- âœ… No GDPR issues (Google Fonts)
- âœ… Better performance

### Font Sizes (Tailwind)
- `text-xs`: 12px - Small labels, metadata
- `text-sm`: 14px - Body text, table content
- `text-base`: 16px - Default body
- `text-lg`: 18px - Subheadings
- `text-xl`: 20px - Section titles
- `text-2xl`: 24px - Page headers

**DO NOT** use arbitrary values like `text-[15px]` - stick to Tailwind scale.

---

## ðŸ‘¤ Developer Information

### Primary Developer
- **Name:** Jotasiete7
- **GitHub:** [@Jotasiete7](https://github.com/Jotasiete7)
- **Email:** [To be added]
- **Role:** Lead Developer

### Contact Information (Public)
- **Support Email:** [To be added]
- **Discord:** [Server link to be added]
- **Patreon:** https://www.patreon.com/c/tortawurmapp

**DO NOT** hardcode personal emails in code - use environment variables or config.

### Attribution Requirements

**In App:**
- About page: "Developed by Jotasiete7"
- Credits: "Emoji graphics by Twitter (Twemoji)"

**In README:**
- Developer section
- License information
- Third-party attributions

---

## ðŸ”‘ Critical Keys & Secrets

### Environment Variables (NEVER COMMIT)

**Required in `.env.local`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Tauri Signing Keys:**
- **Private:** `src-tauri/app.key` (GITIGNORED)
- **Public:** `src-tauri/app.key.pub` (Safe to commit)

**âš ï¸ CRITICAL:**
- Private key is used to sign updates
- If lost, you CANNOT sign future updates
- Backup securely (password manager, encrypted drive)

### API Keys Checklist

Before committing:
- [ ] No Supabase keys in code
- [ ] No API keys in frontend
- [ ] `.env.local` in `.gitignore`
- [ ] `app.key` in `.gitignore`

---

## ðŸ“¦ Third-Party Dependencies

### Core Libraries (DO NOT REMOVE)

| Package | Version | Purpose | Can Remove? |
|---------|---------|---------|-------------|
| `react` | 19.2.0 | UI framework | âŒ Never |
| `@supabase/supabase-js` | 2.86.0 | Backend | âŒ Never |
| `lucide-react` | 0.555.0 | Icons | âŒ Never |
| `recharts` | 3.5.1 | Charts | âš ï¸ Only if removing analytics |
| `react-markdown` | 10.1.0 | Docs rendering | âš ï¸ Only if removing docs |
| `@tauri-apps/api` | 2.9.1 | Desktop features | âŒ Never |

### License Compliance

**MIT Licensed:**
- React, Lucide, Recharts (safe to use commercially)

**CC-BY 4.0:**
- Twemoji (requires attribution)

**Proprietary (During Beta):**
- TortaApp code (all rights reserved until public release)

---

## ðŸš¨ Breaking Changes - Approval Required

### Changes That REQUIRE User Approval

1. **Color Scheme**
   - Users expect amber/slate theme
   - Documented in guides

2. **XP/Level System**
   - Users track progress
   - Changing breaks expectations

3. **Badge Criteria**
   - Users working toward badges
   - Retroactive changes unfair

4. **Database Schema**
   - Requires migration
   - Can break existing data

5. **Icon Library**
   - Consistency is key
   - Mixing styles looks unprofessional

### Changes That Are OK

- âœ… Performance optimizations
- âœ… Bug fixes
- âœ… New features (additive)
- âœ… Code refactoring (same behavior)
- âœ… Documentation updates

---

## ðŸ“‹ Asset Inventory

### Images
- `app-icon.png` (173 KB) - Main app icon source
- `public/emojis/*.svg` - Emoji library

### Fonts
- System fonts only (no custom fonts)

### Sounds (Future)
- Location: `public/sounds/` (when implemented)
- Format: MP3 or OGG
- Max size: 50 KB per sound

### Data Files
- `data/` - Large datasets (GITIGNORED)
- Sample data for testing only

---

## ðŸ” Security - Critical Reminders

### Never Commit
1. `.env.local` - Supabase credentials
2. `src-tauri/app.key` - Private signing key
3. `data/*.txt` - User data dumps
4. Any file with real user emails/data

### Always Sanitize
1. Item names (prevent token leakage)
2. Seller names (prevent injection)
3. User input in search
4. File uploads (validate format)

### RLS Policies
- Test with non-admin user
- Test with admin user
- Verify data isolation

---

**Last Updated:** 2025-12-08  
**Version:** 2.0.0-beta  
**Maintainer:** Jotasiete7

---

## ðŸ“š Official Asset Sources

### Icons (Lucide React)
- **Source:** https://lucide.dev/
- **GitHub:** https://github.com/lucide-icons/lucide
- **License:** ISC (permissive, commercial use OK)
- **Version:** 0.555.0
- **Total Icons:** 1000+ available

**How to Add New Icon:**
```tsx
import { IconName } from 'lucide-react';

<IconName className="w-5 h-5 text-amber-500" />
```

**Browse Icons:** https://lucide.dev/icons/

### Emojis (Twemoji)
- **Source:** https://twemoji.twitter.com/
- **GitHub:** https://github.com/twitter/twemoji
- **License:** CC-BY 4.0 (requires attribution)
- **Format:** SVG (scalable, consistent)
- **Location in project:** `public/emojis/`

**How to Get Emojis:**
1. Visit: https://github.com/twitter/twemoji/tree/master/assets/svg
2. Download desired emoji SVG
3. Rename to unicode (e.g., `1f4af.svg` for ðŸ’¯)
4. Place in `public/emojis/`

**Attribution Required:**
```
Emoji graphics by Twitter (Twemoji)
Licensed under CC-BY 4.0
https://twemoji.twitter.com/
```

### App Icons (Tauri)
- **Generated from:** `app-icon.png` (173 KB, root folder)
- **Tool:** Tauri Icon Generator
- **Command:** `npm run tauri icon path/to/icon.png`

**Regenerate Icons:**
```bash
npm run tauri icon app-icon.png
```

This creates all required sizes automatically in `src-tauri/icons/`.

---

## ðŸŽ¨ Design Resources

### Color Palette Tool
- **Tailwind Colors:** https://tailwindcss.com/docs/customizing-colors
- **Current Scheme:** Amber + Slate (dark mode)

### Typography
- **System Fonts:** Native to each OS
- **No external fonts** (performance + privacy)

### Inspiration
- **Dark Mode:** Discord, VS Code
- **Data Tables:** Notion, Airtable
- **Gamification:** Duolingo, GitHub

---

## ðŸ“¦ Asset Management

### Where Assets Live

```
TortaApp-V2/
â”œâ”€â”€ public/
â”‚   â””â”€â”€ emojis/          # Twemoji SVGs
â”œâ”€â”€ src-tauri/
â”‚   â””â”€â”€ icons/           # App icons (all sizes)
â”œâ”€â”€ app-icon.png         # Source icon (root)
â””â”€â”€ components/          # Lucide icons imported here
```

### Asset Checklist

**Before Using External Assets:**
- [ ] Check license (commercial use OK?)
- [ ] Add attribution if required
- [ ] Document source in DESIGN_DECISIONS.md
- [ ] Optimize file size (compress images)
- [ ] Test on all platforms (Windows, Mac, Linux)

### Optimization

**Images:**
- Use WebP for photos (smaller than PNG/JPG)
- Use SVG for icons/logos (scalable)
- Compress with TinyPNG or similar

**Icons:**
- Only import used icons (tree-shaking)
- Use consistent sizes (w-4, w-5, w-6)

---

**Asset Sources Summary:**
- **Icons:** Lucide (https://lucide.dev/)
- **Emojis:** Twemoji (https://github.com/twitter/twemoji)
- **Fonts:** System fonts (no downloads)
- **Colors:** Tailwind palette (https://tailwindcss.com/docs/customizing-colors)

---

## ðŸ·ï¸ Version Naming & Roadmap

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Iron Ore" (Foundation Release)
- **Status:** Closed Beta
- **Release Date:** December 2025

> [!IMPORTANT]
> **NEXT VERSION RULE:** The next release MUST be tagged 2.0.1 (or higher).
> Do NOT use 2.0.0 again to prevent tag collision.

### Version Naming Scheme

**Pattern:** Wurm Online themed names (materials, creatures, items)

**Planned Codenames:**
- **v0.1.0-beta:** "Iron Ore" (Foundation) - Current
- **v0.2.0-beta:** "Steel Bar" (Strengthened)
- **v0.3.0-beta:** "Silver Coin" (Social Features)
- **v0.4.0-beta:** "Gold Lump" (Premium Features)
- **v1.0.0:** "Dragon Scale" (Public Release)
- **v1.1.0:** "Unicorn Horn" (Rare Features)
- **v1.2.0:** "Troll King" (Boss Update)
- **v2.0.0:** "Valrei" (Major Overhaul)

### Naming Rules
1. **Beta versions:** Common materials (Iron, Steel, Silver)
2. **Stable releases:** Rare items/creatures (Dragon, Unicorn)
3. **Major versions:** Wurm lore references (Valrei, Libila)

**DO NOT** change codenames without updating:
- README.md / README_PT.md
- CHANGELOG.md / CHANGELOG_PT.md
- ABOUT_PT.md
- This file

### Roadmap Milestones

**Phase 1: Foundation (v0.1.0 "Iron Ore")** âœ… Complete
- Core features implemented
- Authentication & profiles
- Market intelligence
- ML predictor
- Gamification basics

**Phase 2: Strengthened (v0.2.0 "Steel Bar")** ðŸ”„ In Progress
- Performance optimizations
- In-app feedback system
- Enhanced ML predictions
- Bug fixes from beta

**Phase 3: Social (v0.3.0 "Silver Coin")** ðŸ“‹ Planned
- Friends system
- Trading groups
- Chat integration
- Shared wishlists

**Phase 4: Premium (v0.4.0 "Gold Lump")** ðŸ“‹ Planned
- Real-time price alerts
- Advanced analytics
- Custom dashboards
- API access

**Phase 5: Public Release (v1.0.0 "Dragon Scale")** ðŸŽ¯ Goal
- All beta features stable
- Full documentation
- Mobile app available
- Community features

---

## ðŸ“… Release Schedule

### Beta Releases
- **Frequency:** Every 2-4 weeks
- **Testing Period:** 1 week minimum
- **Changelog:** Required for each release

### Stable Releases
- **Frequency:** Every 2-3 months
- **Testing Period:** 2 weeks minimum
- **Migration Guide:** Required if breaking changes

### Hotfixes
- **As needed** for critical bugs
- **Version:** Patch number increment (e.g., 0.1.1)
- **No codename** for hotfixes

---

**Version History:**
- 2025-12-06: v0.1.0-beta "Iron Ore" - Initial beta release
- TBD: v0.2.0-beta "Steel Bar" - Performance update
- TBD: v1.0.0 "Dragon Scale" - Public release

---

## ðŸŽ¨ CORREÃ‡ÃƒO: Emoji System (OpenMoji, nÃ£o Twemoji!)

### Emojis (OpenMoji)
- **Source:** https://openmoji.org/
- **GitHub:** https://github.com/hfg-gmuend/openmoji
- **License:** CC-BY-SA 4.0 (requires attribution)
- **Format:** SVG (scalable, consistent)
- **Location in project:** `public/openmoji/`
- **Total Emojis:** 4,293 SVG files

**Why OpenMoji (not Twemoji):**
- âœ… Open source and free
- âœ… Consistent design across all emojis
- âœ… SVG format (scalable, customizable)
- âœ… No platform dependencies
- âœ… CC-BY-SA 4.0 license (commercial use OK with attribution)

**How to Use:**
```tsx
// Emoji files are named by unicode (e.g., 1F4AF.svg for ðŸ’¯)
<img src="/openmoji/1F4AF.svg" alt="emoji" className="w-6 h-6" />
```

**Attribution Required:**
```
Emoji graphics by OpenMoji (https://openmoji.org/)
Licensed under CC-BY-SA 4.0
```

**DO NOT:**
- âŒ Delete the `public/openmoji/` folder (4,293 files!)
- âŒ Mix with other emoji libraries
- âŒ Forget attribution in About page

**Adding New Emojis:**
1. Visit: https://openmoji.org/library/
2. Download desired emoji SVG
3. Rename to unicode format (e.g., `1F600.svg`)
4. Place in `public/openmoji/`

---

**ASSET SOURCES CORRECTED:**
- **Icons:** Lucide (https://lucide.dev/) - 1000+ icons
- **Emojis:** OpenMoji (https://openmoji.org/) - 4,293 emojis âœ…
- **Fonts:** System fonts (no downloads)
- **Colors:** Tailwind palette

---

## ðŸ·ï¸ Version Codenames - Torta Creatures (OFICIAL!)

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Torta Dragon Hatchling" (versÃ£o beta/infantil mas poderosa!)
- **Status:** Closed Beta
- **Release Date:** December 2025

---

## ðŸŽ­ Tier S+ (OBRIGATÃ“RIO usar algum dia - Wurmianos vÃ£o surtar de rir)

### Criaturas LendÃ¡rias
- **Torta Kyklops** - Para versÃ£o com visÃ£o Ãºnica/foco
- **Torta Deathcrawler** - Para versÃ£o que rasteja por bugs e os mata
- **Torta Forest Giant** - Para versÃ£o GIGANTE de features
- **Torta Red Dragon** - Para versÃ£o de fogo (performance extrema)
- **Torta Dragon Hatchling** - Para versÃ£o beta/infantil (ATUAL v2.0.0-beta) âœ…
- **Torta Hell Horse** - Para versÃ£o veloz e infernal
- **Torta Goblin Leader** - Para versÃ£o com lideranÃ§a (novos recursos de admin)

**Uso Recomendado:**
- v1.0.0: "Torta Dragon Hatchling" (pÃºblico release - nascimento oficial)
- v2.0.0: "Torta Forest Giant" (versÃ£o MASSIVA)
- v3.0.0: "Torta Red Dragon" (versÃ£o de FOGO)
- v4.0.0: "Torta Kyklops" (visÃ£o unificada do projeto)

---

## ðŸ”¥ Tier S (IcÃ´nicos pra caralho)

### Criaturas Ã‰picas
- **Torta Troll King** - Para versÃ£o BOSS (major release)
- **Torta Lava Fiend** - Para versÃ£o quente/instÃ¡vel mas poderosa
- **Torta Unique Slayer** - META! Para versÃ£o que MATA bugs (hotfix Ã©pico)
- **Torta Rift Beast** - Para versÃ£o que abre portais (novas features dimensionais)
- **Torta Venerable Whale** - Para versÃ£o GORDA de features (muuuito conteÃºdo)

**Uso Recomendado:**
- Hotfix crÃ­tico: "Torta Unique Slayer" (mata todos os bugs)
- Major update: "Torta Troll King"
- Feature-heavy: "Torta Venerable Whale"

---

## âš”ï¸ Tier A (Monstros clÃ¡ssicos que todo mundo odeia/ama)

### Criaturas ClÃ¡ssicas
- **Torta Diseased Troll** - Para versÃ£o com bugs conhecidos mas funcional
- **Torta Hardened Crocodile** - Para versÃ£o fortificada (seguranÃ§a++)
- **Torta Fierce Anaconda** - Para versÃ£o que aperta/otimiza tudo
- **Torta Scaredy Cat** - Para versÃ£o cheia de jumpscare de bug ðŸ˜‚
- **Torta Wild Cat** - A original, antes do nerf (versÃ£o clÃ¡ssica)
- **Torta Greenish Goblin** - Para versÃ£o eco-friendly (otimizaÃ§Ã£o de recursos)
- **Torta Mountain Gorilla** - O rei do early game (versÃ£o inicial estÃ¡vel)

**Uso Recomendado:**
- VersÃ£o com bugs: "Torta Diseased Troll" (honestidade Ã© tudo)
- VersÃ£o segura: "Torta Hardened Crocodile"
- VersÃ£o otimizada: "Torta Fierce Anaconda"

---

## ðŸ° Tier B (Bichos "normais" mas que viraram meme)

### Criaturas Meme
- **Torta Aged Fat Rabbit** - Para versÃ£o gordinha mas experiente
- **Torta Starving Hyena** - Para versÃ£o lean/minimalista
- **Torta Pheasant** - O pÃ¡ssaro do tutorial (versÃ£o introdutÃ³ria)
- **Torta Rooster** - Para versÃ£o que ACORDA todo mundo com notificaÃ§Ã£o ðŸ“

**Uso Recomendado:**
- VersÃ£o tutorial: "Torta Pheasant"
- VersÃ£o com notificaÃ§Ãµes: "Torta Rooster"
- VersÃ£o minimalista: "Torta Starving Hyena"

---

## ðŸ“‹ Roadmap com Codenames

### Planejado (SugestÃµes)

**Beta Releases (0.x.x)**
- v0.1.0-beta: "Torta Pheasant" (tutorial, primeiros passos)
- v0.2.0-beta: "Torta Mountain Gorilla" (early game king)
- v0.3.0-beta: "Torta Wild Cat" (versÃ£o clÃ¡ssica)
- v0.4.0-beta: "Torta Greenish Goblin" (otimizaÃ§Ãµes)

**Stable Releases (1.x.x)**
- v1.0.0: "Torta Dragon Hatchling" (nascimento oficial) ðŸ£
- v1.1.0: "Torta Unique Slayer" (mata bugs pÃ³s-release)
- v1.2.0: "Torta Hardened Crocodile" (fortificado)
- v1.5.0: "Torta Venerable Whale" (gorda de features)

**Major Releases (2.x.x)**
- v2.0.0: "Torta Forest Giant" (GIGANTE)
- v2.1.0: "Torta Troll King" (BOSS update)
- v2.5.0: "Torta Rift Beast" (portais de features)

**Epic Releases (3.x.x+)**
- v3.0.0: "Torta Red Dragon" (FOGO e velocidade)
- v4.0.0: "Torta Kyklops" (visÃ£o Ãºnica)
- v5.0.0: "Torta Deathcrawler" (rasteja e domina)

---

## ï¿½ï¿½ Naming Rules (OFICIAL)

### Quando Usar Cada Tier

**Tier S+ (LendÃ¡rios):**
- Major releases (x.0.0)
- Game-changing updates
- VersÃµes que definem o futuro

**Tier S (IcÃ´nicos):**
- Hotfixes crÃ­ticos ("Unique Slayer")
- Feature-heavy updates ("Venerable Whale")
- Boss updates ("Troll King")

**Tier A (ClÃ¡ssicos):**
- Security updates ("Hardened Crocodile")
- Performance updates ("Fierce Anaconda")
- Buggy but functional ("Diseased Troll")

**Tier B (Memes):**
- Tutorial versions ("Pheasant")
- Notification-heavy ("Rooster")
- Minimal updates ("Starving Hyena")

### Special Cases

**"Torta Scaredy Cat"** - RESERVADO para versÃ£o com muitos jumpscares de bug (use com humor!)

**"Torta Diseased Troll"** - Para quando vocÃª sabe que tem bugs mas lanÃ§a mesmo assim (honestidade++)

**"Torta Rooster"** - Para versÃ£o que adiciona sistema de notificaÃ§Ãµes agressivo

---

## ðŸŽ¨ Branding

**Formato Oficial:**
```
TortaApp v2.0.0-beta "Torta Dragon Hatchling"
```

**Em Changelogs:**
```markdown
# v2.0.0-beta "Torta Dragon Hatchling" ðŸ£
Released: 2025-12-06
```

**Em About Page:**
```
Version: 2.0.0-beta
Codename: Torta Dragon Hatchling
```

---

**IMPORTANTE:** Esses nomes sÃ£o OURO para marketing! Todo wurmiano vai reconhecer e rir. Use com orgulho! ðŸŽ¯

**Ãšltima AtualizaÃ§Ã£o:** 2025-12-08
**Mantido por:** Jotasiete7 (com ajuda da comunidade Wurm)

---

## âœï¸ CORREÃ‡ÃƒO: VersÃ£o Atual

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Torta Venerable Whale" ðŸ‹ (versÃ£o GORDA de features!)
- **Status:** Closed Beta
- **Release Date:** December 2025

**Por que "Venerable Whale":**
- Venerable = Experiente, respeitÃ¡vel
- Whale = GRANDE, muitas features
- Perfeito para v2.0.0-beta com tudo implementado!

---




