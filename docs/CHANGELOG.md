# Changelog

All notable changes to TortaApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- In-app feedback system
- Mobile app version
- Real-time price alerts
- Trading recommendations

---

## [2.0.0] - 2025-12-15

### Major Architecture Changes
- **Canonical Item Dictionary:** Migrated from string-based names to `itemId` system. "Sleep Powder" and "Wheat Sleep Powder" now resolve to `sleep_powder`.
- **Rust Integration:** Replaced legacy JS parser with high-performance Rust `AdvancedParser` via Tauri command.
- **Impurity Cleaning:** Automatic removal of "Impure", "Shattered", "Corroded" prefixes for consistent data.
- **Smart Search V2:** Search now returns canonical objects `{id, name}` to prevent chart duplication.

### Added
- **Live Trade Monitor:** Real-time offline queueing system (trades save locally if internet drops).
- **Service Filtering:** "Cleaning Service", "Recruitment" messages are now automatically filtered out.
- **Panic Handler:** Added Rust-side panic hooks for better crash diagnostics.

### Fixed
- **Sleep Powder Duplication:** Fixed the issue where different names for the same item created multiple chart lines.
- **Memory Leak:** Optimized file watcher to prevent RAM explosion on large logs.

---

## [0.1.0-beta] - 2025-12-06

### Added
- 🎉 Initial beta release
- User authentication (email/password)
- Game nick verification system
- Trade log upload (.txt, .log formats)
- Advanced search with operators (ql, price, qty, seller, rarity)
- Market intelligence dashboard
- ML price predictor with confidence intervals
- Gamification system (XP, levels, badges)
- Daily check-in rewards
- Leaderboards (top traders, XP leaders)
- Badge system with 12+ achievements
- Admin panel for user/price management
- Bulk data upload (NDJSON format)
- Reference price system
- Price insights (good/fair/bad deals)
- Ticker message system
- Responsive UI with dark theme

### Features

#### Authentication & Profile
- Email/password registration
- Email verification
- Password reset
- Profile customization
- Badge display selection (up to 5)

#### Market Intelligence
- Trade database with 50+ items per page
- Real-time search and filtering
- Sort by name, price, quality, quantity, date
- Price comparison with reference prices
- Bulk pricing calculations
- Trade type filtering (WTS/WTB)
- Rarity filtering (Common/Rare/Supreme/Fantastic)

#### ML Predictor
- 7-day price forecasts
- Confidence intervals
- Trend analysis
- Historical data visualization
- Multiple prediction models

#### Gamification
- 5 career levels (Novice to Tycoon)
- 12+ unlockable badges
- Daily XP bonuses
- Trading milestones
- Time-based achievements
- Seasonal badges
- Public leaderboards

#### Admin Tools
- User management
- Role assignment
- Price manager
- Bulk data import
- System statistics
- Ticker message control

### Technical
- React + TypeScript frontend
- Vite build system
- Supabase backend
- Row-level security (RLS)
- Lucide React icons
- Tailwind CSS styling
- Custom emoji system
- Advanced search engine
- File parser for trade logs

### Documentation
- Comprehensive user manual
- FAQ section
- Admin guide
- Technical specifications
- Badge registry
- Gamification guide

---

## Version History

### Beta Releases

**0.1.0-beta** - Initial beta release (2025-12-06)
- Core features implemented
- Ready for beta testing
- Known issues documented

### Planned Releases

**0.2.0-beta** - Enhanced Features (TBD)
- In-app feedback system
- Improved ML predictions
- Performance optimizations
- Bug fixes from beta feedback

**0.3.0-beta** - Social Features (TBD)
- Friends system
- Trading groups
- Chat integration
- Shared wishlists

**1.0.0** - Public Release (TBD)
- All beta features stable
- Full documentation
- Mobile app available
- Community features

---

## Known Issues

### Current Limitations
- XP updates every ~5 minutes (not real-time)
- ML predictions require sufficient historical data
- File upload limited to 50MB
- Some TypeScript errors in development (non-critical)

### Planned Fixes
- Real-time XP updates
- Improved prediction accuracy
- Larger file upload support
- Complete TypeScript compliance

---

## Breaking Changes

None yet (beta version)

---

## Migration Guide

### From Alpha to Beta
Not applicable (first release)

---

## Contributors

- **Development Team:** Jotasiete7
- **Beta Testers:** TBD
- **Community Feedback:** Wurm Online community

---

## Support

- **Bug Reports:** Use in-app feedback (coming soon)
- **Feature Requests:** Discord community
- **Documentation:** See docs/ folder

---

**Thank you for being part of the TortaApp beta!** 🎯
