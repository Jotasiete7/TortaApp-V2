# Admin Panel Expansion - Walkthrough

## Overview
We have successfully expanded the **Torta App Admin Panel** with three powerful new modules, elevating the administrative capabilities to a professional level.

## New Modules

### 1. User Manager
*   **Location:** Admin Panel > Users Tab
*   **Features:**
    *   **Search**: Find users by nickname or email.
    *   **Ban**: Toggle 'Banned' status to prevent logins.
    *   **Approve**: Manually approve user registrations.
    *   **Gift Shouts**: Grant specific amounts of shouts to users for gamification.
    *   **Delete User**: Permanently remove a user and all their data (requires 'DELETE' confirmation).

### 2. God Mode (System Settings)
*   **Location:** Admin Panel > Settings Tab
*   **Features:**
    *   **Global Config**: Modify `app_settings` directly from the UI.
    *   **Maintenance Mode**: Lock the app for all non-admin users.
    *   **Registration**: Open/Close new signups.
    *   **Uploads**: Enable/Disable log uploads.
    *   **XP/Shouts**: Tweak game balance values (XP multiplier, prices).
    *   **Interface**: Smart toggle switches and inputs based on value types.

### 3. Anomaly Detective
*   **Location:** Admin Panel > Detective Tab
*   **Features:**
    *   **Scan**: RPC-based scan algorithm (`admin_detect_anomalies`) to find:
        *   Future Dates ("Time Travelers")
        *   Negative Prices/Quantities
        *   Extreme Price Outliers (> 10M gold)
    *   **Clean**: Bulk delete selected anomaly records.

## Improvements & Fixes
*   **Top Appraiser Chart**: Fixed the `get_top_price_checkers` RPC to correctly count 'PC' trade logs.
*   **Database Health**: Added real-time DB usage stats (size, row counts) to the admin dashboard.
*   **Ambiguity Fix**: Resolved SQL column ambiguity in anomaly detection.

## Verification
All modules have been deployed and verified against the production database structure.
- [x] User Management Actions
- [x] System Settings Updates
- [x] Anomaly Scanning & Cleaning
- [x] Leaderboard Data Accuracy
