# 🧠 TortaApp - Design Decisions & Implementation Guide

**Purpose:** Prevent regressions when multiple agents/developers work on the project.  
**Last Updated:** 2025-12-08

---

## 🎯 Core Principles

1. **Never remove existing optimizations** without explicit user request
2. **Always check component history** before major refactors
3. **Preserve user-facing features** unless replacing with better version
4. **Maintain performance** - `useMemo`, `useCallback` are there for a reason

---

## 🏗️ Critical Components - DO NOT BREAK

### 1. Sidebar (`components/layout/Sidebar.tsx`)

**Key Features (DO NOT REMOVE):**
- ✅ Admin Panel visibility based on `role`
- ✅ Patreon support link
- ✅ Icon-based navigation
- ✅ Active state highlighting
- ✅ Responsive design

**Recent Improvements:**
- Layout optimizations (spacing, alignment)
- Conditional rendering for admin items
- Smooth transitions

**If modifying:** Check git history first, preserve all conditional logic.

---

### 2. UserSettings (`components/UserSettings.tsx`)

**Key Features:**
- ✅ Audio controls (volume, mute)
- ✅ Visual effects toggles
- ✅ **Auto-Updater button** (Check for Updates)
- ✅ SoundService integration

**Critical:** The "Check for Updates" section was added for Tauri auto-updater. DO NOT remove.

---

### 3. MarketTable (`components/market/MarketTable.tsx`)

**Performance Critical:**
- ✅ Uses `useMemo` for `processedData` (filters 100k+ records)
- ✅ Pagination (50 items per page)
- ✅ SearchEngine integration
- ✅ Advanced query parser

**DO NOT:**
- Remove `useMemo` hooks
- Change pagination logic without testing
- Break search operators (`ql>90`, `price<50`)

---

### 4. MLPredictor (`components/market/MLPredictor.tsx`)

**Complex Logic:**
- ✅ Dynamic material extraction
- ✅ Bulk analysis
- ✅ Statistical calculations
- ✅ Confidence scoring

**If modifying:** This is ML code. Test thoroughly before changes.

---

## 🎨 Design Standards

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

## ⚡ Performance Rules

### Always Use:
1. **`useMemo`** for expensive calculations
2. **`useCallback`** for event handlers passed to children
3. **Pagination** for large datasets
4. **Lazy loading** for heavy components (if needed)

### Never Do:
1. ❌ Remove existing `useMemo` without profiling
2. ❌ Load all 100k records at once
3. ❌ Inline complex calculations in JSX
4. ❌ Create new objects/arrays in render

---

## 🔐 Security Rules

### Environment Variables
- **NEVER** hardcode API keys
- **ALWAYS** use `import.meta.env.VITE_*`
- **CHECK** `.gitignore` before committing

### Data Sanitization
- ✅ `sanitizeItemName()` for item names
- ✅ `sanitizeSeller()` for seller names
- ✅ Prevent token leakage in logs

---

## 📦 State Management

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

## 🧩 Component Hierarchy

```
App.tsx (root)
├── Login.tsx (if not authenticated)
└── Main Layout
    ├── Sidebar.tsx
    ├── NewsTicker.tsx
    ├── Dashboard.tsx
    ├── MarketTable.tsx
    ├── MLPredictor.tsx
    ├── UserSettings.tsx
    └── FeedbackWidget.tsx
```

---

## 🚨 Common Pitfalls

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

## 📝 Before Making Changes

### Checklist:
1. [ ] Read this document
2. [ ] Check component's git history
3. [ ] Search for component usage (`grep -r "ComponentName"`)
4. [ ] Test with realistic data (100k+ records)
5. [ ] Verify no regressions in related features

---

## 🔄 When Multiple Agents Work

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

## 📚 Key Files Reference

| File | Purpose | Critical Features |
|------|---------|-------------------|
| `App.tsx` | Main app logic | Routing, auth, data loading |
| `Sidebar.tsx` | Navigation | Admin visibility, Patreon link |
| `MarketTable.tsx` | Trade search | Performance, search operators |
| `MLPredictor.tsx` | Price prediction | ML algorithms, confidence |
| `UserSettings.tsx` | User preferences | Audio, updates, animations |
| `Dashboard.tsx` | Overview | Stats, leaderboard, upload |

---

## 🎯 Future Considerations

### Planned Features:
- Mobile view
- Real-time notifications
- Social features (friends, groups)

### Technical Debt:
- None critical currently
- Bundle size could be optimized further (code splitting)

---

**Remember:** This is a **production-ready beta**. Every feature exists for a reason. When in doubt, preserve existing functionality.
## 🎮 Gamification System - Critical Rules

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

## 🗄️ Database Patterns & SQL Guidelines

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

## 🔧 Development Workflows

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

## 🚀 Performance Checklist
- [ ] Large lists use pagination
- [ ] Expensive calculations use `useMemo`
- [ ] No console.logs in production
- [ ] Bundle size checked

---

**Last Updated:** 2025-12-08

---

## 🎨 Design System - Assets & Branding

### Icons & Images

**Icon Library:** Lucide React (`lucide-react` v0.555.0)
- ✅ Consistent style across app
- ✅ Tree-shakeable (only imports used icons)
- ✅ Customizable size/color

**DO NOT:**
- ❌ Mix icon libraries (no Font Awesome, Material Icons, etc.)
- ❌ Use raster icons for UI (use SVG/Lucide only)
- ❌ Hardcode icon sizes (use Tailwind classes)

**App Icons (Tauri):**
- Location: `src-tauri/icons/`
- Windows: `icon.ico` (59 KB)
- macOS: `icon.icns` (866 KB)
- PNG sizes: 32x32, 64x64, 128x128, 128x128@2x

**DO NOT** replace icons without regenerating all sizes.

### Emoji System

**Source:** Open Source Emoji (Twemoji-compatible)
- Location: `public/emojis/` (SVG format)
- Used in: Ticker messages, badges, shout box
- License: CC-BY 4.0 (attribution required)

**Why SVGs:**
- ✅ Consistent across all platforms (Windows, Mac, Linux)
- ✅ No font dependencies
- ✅ Scalable without quality loss
- ✅ Customizable colors

**Adding New Emojis:**
1. Download from Twemoji repo
2. Save to `public/emojis/[unicode].svg`
3. Update `EmojiPicker.tsx` if needed

---

## 🎨 Color Palette - DO NOT CHANGE

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

## 📝 Typography & Fonts

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;
```

**Why System Fonts:**
- ✅ No external font loading (faster)
- ✅ Native look on each OS
- ✅ No GDPR issues (Google Fonts)
- ✅ Better performance

### Font Sizes (Tailwind)
- `text-xs`: 12px - Small labels, metadata
- `text-sm`: 14px - Body text, table content
- `text-base`: 16px - Default body
- `text-lg`: 18px - Subheadings
- `text-xl`: 20px - Section titles
- `text-2xl`: 24px - Page headers

**DO NOT** use arbitrary values like `text-[15px]` - stick to Tailwind scale.

---

## 👤 Developer Information

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

## 🔑 Critical Keys & Secrets

### Environment Variables (NEVER COMMIT)

**Required in `.env.local`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Tauri Signing Keys:**
- **Private:** `src-tauri/app.key` (GITIGNORED)
- **Public:** `src-tauri/app.key.pub` (Safe to commit)

**⚠️ CRITICAL:**
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

## 📦 Third-Party Dependencies

### Core Libraries (DO NOT REMOVE)

| Package | Version | Purpose | Can Remove? |
|---------|---------|---------|-------------|
| `react` | 19.2.0 | UI framework | ❌ Never |
| `@supabase/supabase-js` | 2.86.0 | Backend | ❌ Never |
| `lucide-react` | 0.555.0 | Icons | ❌ Never |
| `recharts` | 3.5.1 | Charts | ⚠️ Only if removing analytics |
| `react-markdown` | 10.1.0 | Docs rendering | ⚠️ Only if removing docs |
| `@tauri-apps/api` | 2.9.1 | Desktop features | ❌ Never |

### License Compliance

**MIT Licensed:**
- React, Lucide, Recharts (safe to use commercially)

**CC-BY 4.0:**
- Twemoji (requires attribution)

**Proprietary (During Beta):**
- TortaApp code (all rights reserved until public release)

---

## 🚨 Breaking Changes - Approval Required

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

- ✅ Performance optimizations
- ✅ Bug fixes
- ✅ New features (additive)
- ✅ Code refactoring (same behavior)
- ✅ Documentation updates

---

## 📋 Asset Inventory

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

## 🔐 Security - Critical Reminders

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

## 📚 Official Asset Sources

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
3. Rename to unicode (e.g., `1f4af.svg` for 💯)
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

## 🎨 Design Resources

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

## 📦 Asset Management

### Where Assets Live

```
TortaApp-V2/
├── public/
│   └── emojis/          # Twemoji SVGs
├── src-tauri/
│   └── icons/           # App icons (all sizes)
├── app-icon.png         # Source icon (root)
└── components/          # Lucide icons imported here
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

## 🏷️ Version Naming & Roadmap

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Iron Ore" (Foundation Release)
- **Status:** Closed Beta
- **Release Date:** December 2025

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

**Phase 1: Foundation (v0.1.0 "Iron Ore")** ✅ Complete
- Core features implemented
- Authentication & profiles
- Market intelligence
- ML predictor
- Gamification basics

**Phase 2: Strengthened (v0.2.0 "Steel Bar")** 🔄 In Progress
- Performance optimizations
- In-app feedback system
- Enhanced ML predictions
- Bug fixes from beta

**Phase 3: Social (v0.3.0 "Silver Coin")** 📋 Planned
- Friends system
- Trading groups
- Chat integration
- Shared wishlists

**Phase 4: Premium (v0.4.0 "Gold Lump")** 📋 Planned
- Real-time price alerts
- Advanced analytics
- Custom dashboards
- API access

**Phase 5: Public Release (v1.0.0 "Dragon Scale")** 🎯 Goal
- All beta features stable
- Full documentation
- Mobile app available
- Community features

---

## 📅 Release Schedule

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

## 🎨 CORREÇÃO: Emoji System (OpenMoji, não Twemoji!)

### Emojis (OpenMoji)
- **Source:** https://openmoji.org/
- **GitHub:** https://github.com/hfg-gmuend/openmoji
- **License:** CC-BY-SA 4.0 (requires attribution)
- **Format:** SVG (scalable, consistent)
- **Location in project:** `public/openmoji/`
- **Total Emojis:** 4,293 SVG files

**Why OpenMoji (not Twemoji):**
- ✅ Open source and free
- ✅ Consistent design across all emojis
- ✅ SVG format (scalable, customizable)
- ✅ No platform dependencies
- ✅ CC-BY-SA 4.0 license (commercial use OK with attribution)

**How to Use:**
```tsx
// Emoji files are named by unicode (e.g., 1F4AF.svg for 💯)
<img src="/openmoji/1F4AF.svg" alt="emoji" className="w-6 h-6" />
```

**Attribution Required:**
```
Emoji graphics by OpenMoji (https://openmoji.org/)
Licensed under CC-BY-SA 4.0
```

**DO NOT:**
- ❌ Delete the `public/openmoji/` folder (4,293 files!)
- ❌ Mix with other emoji libraries
- ❌ Forget attribution in About page

**Adding New Emojis:**
1. Visit: https://openmoji.org/library/
2. Download desired emoji SVG
3. Rename to unicode format (e.g., `1F600.svg`)
4. Place in `public/openmoji/`

---

**ASSET SOURCES CORRECTED:**
- **Icons:** Lucide (https://lucide.dev/) - 1000+ icons
- **Emojis:** OpenMoji (https://openmoji.org/) - 4,293 emojis ✅
- **Fonts:** System fonts (no downloads)
- **Colors:** Tailwind palette

---

## 🏷️ Version Codenames - Torta Creatures (OFICIAL!)

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Torta Dragon Hatchling" (versão beta/infantil mas poderosa!)
- **Status:** Closed Beta
- **Release Date:** December 2025

---

## 🎭 Tier S+ (OBRIGATÓRIO usar algum dia - Wurmianos vão surtar de rir)

### Criaturas Lendárias
- **Torta Kyklops** - Para versão com visão única/foco
- **Torta Deathcrawler** - Para versão que rasteja por bugs e os mata
- **Torta Forest Giant** - Para versão GIGANTE de features
- **Torta Red Dragon** - Para versão de fogo (performance extrema)
- **Torta Dragon Hatchling** - Para versão beta/infantil (ATUAL v2.0.0-beta) ✅
- **Torta Hell Horse** - Para versão veloz e infernal
- **Torta Goblin Leader** - Para versão com liderança (novos recursos de admin)

**Uso Recomendado:**
- v1.0.0: "Torta Dragon Hatchling" (público release - nascimento oficial)
- v2.0.0: "Torta Forest Giant" (versão MASSIVA)
- v3.0.0: "Torta Red Dragon" (versão de FOGO)
- v4.0.0: "Torta Kyklops" (visão unificada do projeto)

---

## 🔥 Tier S (Icônicos pra caralho)

### Criaturas Épicas
- **Torta Troll King** - Para versão BOSS (major release)
- **Torta Lava Fiend** - Para versão quente/instável mas poderosa
- **Torta Unique Slayer** - META! Para versão que MATA bugs (hotfix épico)
- **Torta Rift Beast** - Para versão que abre portais (novas features dimensionais)
- **Torta Venerable Whale** - Para versão GORDA de features (muuuito conteúdo)

**Uso Recomendado:**
- Hotfix crítico: "Torta Unique Slayer" (mata todos os bugs)
- Major update: "Torta Troll King"
- Feature-heavy: "Torta Venerable Whale"

---

## ⚔️ Tier A (Monstros clássicos que todo mundo odeia/ama)

### Criaturas Clássicas
- **Torta Diseased Troll** - Para versão com bugs conhecidos mas funcional
- **Torta Hardened Crocodile** - Para versão fortificada (segurança++)
- **Torta Fierce Anaconda** - Para versão que aperta/otimiza tudo
- **Torta Scaredy Cat** - Para versão cheia de jumpscare de bug 😂
- **Torta Wild Cat** - A original, antes do nerf (versão clássica)
- **Torta Greenish Goblin** - Para versão eco-friendly (otimização de recursos)
- **Torta Mountain Gorilla** - O rei do early game (versão inicial estável)

**Uso Recomendado:**
- Versão com bugs: "Torta Diseased Troll" (honestidade é tudo)
- Versão segura: "Torta Hardened Crocodile"
- Versão otimizada: "Torta Fierce Anaconda"

---

## 🐰 Tier B (Bichos "normais" mas que viraram meme)

### Criaturas Meme
- **Torta Aged Fat Rabbit** - Para versão gordinha mas experiente
- **Torta Starving Hyena** - Para versão lean/minimalista
- **Torta Pheasant** - O pássaro do tutorial (versão introdutória)
- **Torta Rooster** - Para versão que ACORDA todo mundo com notificação 🐓

**Uso Recomendado:**
- Versão tutorial: "Torta Pheasant"
- Versão com notificações: "Torta Rooster"
- Versão minimalista: "Torta Starving Hyena"

---

## 📋 Roadmap com Codenames

### Planejado (Sugestões)

**Beta Releases (0.x.x)**
- v0.1.0-beta: "Torta Pheasant" (tutorial, primeiros passos)
- v0.2.0-beta: "Torta Mountain Gorilla" (early game king)
- v0.3.0-beta: "Torta Wild Cat" (versão clássica)
- v0.4.0-beta: "Torta Greenish Goblin" (otimizações)

**Stable Releases (1.x.x)**
- v1.0.0: "Torta Dragon Hatchling" (nascimento oficial) 🐣
- v1.1.0: "Torta Unique Slayer" (mata bugs pós-release)
- v1.2.0: "Torta Hardened Crocodile" (fortificado)
- v1.5.0: "Torta Venerable Whale" (gorda de features)

**Major Releases (2.x.x)**
- v2.0.0: "Torta Forest Giant" (GIGANTE)
- v2.1.0: "Torta Troll King" (BOSS update)
- v2.5.0: "Torta Rift Beast" (portais de features)

**Epic Releases (3.x.x+)**
- v3.0.0: "Torta Red Dragon" (FOGO e velocidade)
- v4.0.0: "Torta Kyklops" (visão única)
- v5.0.0: "Torta Deathcrawler" (rasteja e domina)

---

## �� Naming Rules (OFICIAL)

### Quando Usar Cada Tier

**Tier S+ (Lendários):**
- Major releases (x.0.0)
- Game-changing updates
- Versões que definem o futuro

**Tier S (Icônicos):**
- Hotfixes críticos ("Unique Slayer")
- Feature-heavy updates ("Venerable Whale")
- Boss updates ("Troll King")

**Tier A (Clássicos):**
- Security updates ("Hardened Crocodile")
- Performance updates ("Fierce Anaconda")
- Buggy but functional ("Diseased Troll")

**Tier B (Memes):**
- Tutorial versions ("Pheasant")
- Notification-heavy ("Rooster")
- Minimal updates ("Starving Hyena")

### Special Cases

**"Torta Scaredy Cat"** - RESERVADO para versão com muitos jumpscares de bug (use com humor!)

**"Torta Diseased Troll"** - Para quando você sabe que tem bugs mas lança mesmo assim (honestidade++)

**"Torta Rooster"** - Para versão que adiciona sistema de notificações agressivo

---

## 🎨 Branding

**Formato Oficial:**
```
TortaApp v2.0.0-beta "Torta Dragon Hatchling"
```

**Em Changelogs:**
```markdown
# v2.0.0-beta "Torta Dragon Hatchling" 🐣
Released: 2025-12-06
```

**Em About Page:**
```
Version: 2.0.0-beta
Codename: Torta Dragon Hatchling
```

---

**IMPORTANTE:** Esses nomes são OURO para marketing! Todo wurmiano vai reconhecer e rir. Use com orgulho! 🎯

**Última Atualização:** 2025-12-08
**Mantido por:** Jotasiete7 (com ajuda da comunidade Wurm)

---

## ✏️ CORREÇÃO: Versão Atual

### Current Version
- **Number:** 2.0.0-beta
- **Codename:** "Torta Venerable Whale" 🐋 (versão GORDA de features!)
- **Status:** Closed Beta
- **Release Date:** December 2025

**Por que "Venerable Whale":**
- Venerable = Experiente, respeitável
- Whale = GRANDE, muitas features
- Perfeito para v2.0.0-beta com tudo implementado!

---
