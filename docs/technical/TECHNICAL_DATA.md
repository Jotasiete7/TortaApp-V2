# Technical Data & Architecture Reference

**Version:** 2.0.0
**Last Updated:** 14/12/2024

## 1. Domain Logic

### 1.1 Money System (src/domain/price/Money.ts)
The application uses a dedicated Money value object to handle Wurm Online currency safely.

*   **Internal Representation:** Integer (copper count) or Float (for iron coins support).
*   **Conversion Standard:**
    *   1 Gold = 100 Silver
    *   1 Silver = 100 Copper
    *   **1 Gold = 10,000 Copper** (Fixed in v2.0)
*   **Key Operations:**
    *   romCopper(amount): Creates instance from raw value.
    *   romString(priceStr): Parses text like '1g 50s 25c'.
    *   	oString(): Formats back to standard display '1g 50s 25c'.

### 1.2 Price Adapter (services/adapters/PriceAdapter.ts)
Acts as a bridge between raw primitive inputs (strings/numbers) and the Money domain.

*   **Responsibilities:**
    *   Sanitizing input strings.
    *   Handling 'Iron' coins (decimal values).
    *   Providing safe default values (0c) for invalid inputs.

## 2. Parsing Architecture

### 2.1 Unified Parser Strategy
As of v2.0, the legacy StandardLogParser has been removed. The application relies entirely on the **Rust-based Advanced Parser** (Tauri Sidecar/Command).

*   **Flow:**
    1.  File Watcher (Rust) detects line change.
    2.  Line is parsed for Timestamp, Nick, and Message.
    3.  Event 	rade-event emitted to Frontend.
    4.  Frontend (LiveTradeMonitor) enriches data using PriceAdapter.

## 3. Alert System Architecture

### 3.1 Alert Service (services/AlertService.ts)
Handles logic for matching incoming trades against user-defined rules.

*   **Match Criteria:**
    1.  **Keyword:** Case-insensitive partial match.
    2.  **Trade Type:** WTS, WTB, WTT filters.
    3.  **Price Thresholds:**
        *   maxPrice (for Buyers): Triggers if trade price <= limit.
        *   minPrice (for Sellers): Triggers if trade price >= limit.
*   **Storage:** localforage (Key: 	rade_alerts).

### 3.2 Data Flow
LiveTradeMonitor -> 	rade-event -> AlertService.checkAlerts(trade) -> Match? -> AlertService.fireAlert() -> Notification/Sound.

## 4. Database Schema (Supabase)

### 4.1 Trade Logs
*   	rade_hash (Text): SHA-256 hash for deduplication.
*   price_copper (Int): Normalized price for analytics.
*   erification_status: PENDING | VERIFIED.

### 4.2 User Stats
*   user_badges: Gamification achievements.
*   user_streaks: Daily activity tracking.

## 5. Environment & Build

*   **Framework:** Vite + React + TypeScript
*   **Shell:** Tauri v2 (Rust)
*   **Test Runner:** Vitest (Unit Testing)
*   **Persistence:** LocalForage (Browser DB) + Supabase (Cloud)

