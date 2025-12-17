# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.1] - 2024-12-17

### Added
- **Enhanced Gamification System**
  - 50-level progressive XP system (100 trades to 10M+ trades)
  - 12 achievements across 3 categories (Live Monitor, Database, Milestones)
  - DatabaseStatsCard component showing real-time database metrics
  - AchievementPanel component with visual achievement grid
  - AchievementNotification component for real-time unlock notifications
  - Achievement tracking system in GamificationService
  - New gamification constants file (`constants/gamification.ts`)

- **Auto-Updater Configuration**
  - Configured Tauri v2 auto-updater with minisign
  - Generated signing keys for secure updates
  - Updated `latest.json` with proper signature
  - Auto-update endpoint configured

- **Semantic Versioning**
  - Implemented SemVer 2.0.0 as official versioning standard
  - Created VERSIONING.md documentation
  - Updated version format to `2.0.0-beta.1`

### Fixed
- **Widget Overlay Bug**: Fixed Trade Feed freezing when widgets (FeedbackWidget, AdCooldownWidget) were open by adding `pointer-events-auto`
- **Search Performance**: Added 400ms debounce to SmartSearch to prevent freezing on short queries

### Changed
- **UI Polish**
  - Unified floating button sizes (`w-14 h-14`)
  - Standardized sidebar hover effects
  - Consistent dashboard block heights
- **PlayerProfile**: Updated to use new 50-level system from gamification constants

### Performance
- Search optimization with debounce reduces unnecessary expensive queries
- Database stats component auto-refreshes every 5 minutes

### Documentation
- Created `VERSIONING.md` with SemVer guidelines
- Created comprehensive session walkthrough
- Updated implementation plans and task tracking

## [2.0.0-alpha.1] - 2024-XX-XX

### Added
- Tauri v2 migration
- Rust-based log parser
- Live Trade Monitor
- Supabase integration
- Real-time trade feed

### Changed
- Complete architecture overhaul for v2

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic trade log processing
- Market analytics dashboard
- Price prediction system

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **PRERELEASE**: alpha, beta, rc versions

[2.0.0-beta.1]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.0.0-beta.1
[2.0.0-alpha.1]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.0.0-alpha.1
[1.0.0]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v1.0.0
