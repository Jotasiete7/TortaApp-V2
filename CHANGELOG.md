# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.5] - 2026-01-08

### Changed
- **Project Structure**: Cleaned up root directory by archiving obsolete files
- **Documentation**: Standardized documentation files and versioning process
- **Maintenance**: Various internal project re-organization tasks

## [2.1.4] - 2026-01-08

### Fixed
- **Null Safety**: Fixed null safety issues in LiveTradeTicker component
- **Build Stability**: Improved build stability and error handling

### Changed
- **Documentation**: Standardized project documentation with PROJECT_STATUS.md as single source of truth
- **Version Sync**: Synchronized version numbers across all configuration files

## [2.1.3] - 2026-01-07

### Changed
- **UI Cleanup**: Removed redundant links from homepage (Discord, Map, WurmNode) already present in Resources section

### Fixed
- **Bug Fixes**: Various stability improvements and bug fixes

## [2.1.0] - 2026-01-08

### Added
- **Mobile Responsiveness**: Complete mobile-responsive design across all components
  - Adaptive layouts for Hero, Mural, System Status, ServicesBoard, ResourcesBoard
  - Bottom sheet modals for GuildMap on mobile
  - Mobile-optimized Admin Area
- **Guild Features**: Enhanced role-based access system
  - GuildMap with pin management for Operator and Cartographer roles
  - Improved Resources Board with operational focus

### Changed
- **Service Directory**: Refinements to detection accuracy and UI
- **Guest Mode**: Enhanced guest mode experience with better feature availability

### Fixed
- **Daily Badge Notification**: Fixed bug causing repeated daily check-in badge notifications

## [2.0.3] - 2025-12-31

### Added
- **Settings Redesign**: Complete overhaul of settings interface
- **i18n Complete**: Full internationalization support for English and Portuguese
- **Bilingual NewsTicker**: Dynamic news ticker with language switching

### Changed
- **UI/UX Refinements**: Multiple visual and interaction improvements across the application
- **Performance**: Optimizations for better responsiveness

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

[2.1.4]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.1.4
[2.1.3]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.1.3
[2.1.0]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.1.0
[2.0.3]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.0.3
[2.0.0-beta.1]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.0.0-beta.1
[2.0.0-alpha.1]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.0.0-alpha.1
[1.0.0]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v1.0.0
[2.1.5]: https://github.com/Jotasiete7/TortaApp-V2/releases/tag/v2.1.5
