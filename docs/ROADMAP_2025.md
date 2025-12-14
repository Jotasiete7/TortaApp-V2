# TortaApp Strategy Roadmap 2025

**Status:** Planned
**Focus:** Market Intelligence & Profitability

## 1. 🥇 Alerta de Arbitragem (High Priority)
*The "Free Money" System.*

*   **Concept:** Real-time detection of profitable spreads (WTS price < WTB price) for the same item.
*   **Architecture:** Frontend (React).
*   **Implementation Plan:**
    1.  **Context:** Extend \TradeEventContext\ to maintain a live \WTB_Map\ (Item -> MaxPrice).
    2.  **Logic:** On every incoming WTS trade:
        *   Check if item exists in \WTB_Map\.
        *   If \WTS_Price < WTB_Map[item]\, trigger **Arbitrage Alert**.
    3.  **UI:** Special "Purple Alert" notification with calculated profit margin.
*   **Effort:** Medium.
*   **Benefit:** Immediate user profit.

## 2. 🥈 Player Deep Dive (Medium Priority)
*Know Your Supplier.*

*   **Concept:** Instant access to a player's trading history and reputation.
*   **Architecture:** Frontend + Supabase.
*   **Implementation Plan:**
    1.  **UI:** Make player nicks clickable in the Live Feed.
    2.  **Query:** \SELECT * FROM trades WHERE nick = ? ORDER BY timestamp DESC LIMIT 50\.
    3.  **Stats:** Calculate avg. pricing and most frequent hours.
    4.  **Display:** Modal with "Trusted Trader" badge if verification_status is high.
*   **Effort:** Low.
*   **Benefit:** Negotiation leverage and scam avoidance.

## 3. 🥉 Market Volatility Index (Long Term)
*Speculation Intelligence.*

*   **Concept:** Identify which items are fluctuating most to buy low/sell high.
*   **Architecture:** Python (ML System) -> Supabase.
*   **Implementation Plan:**
    1.  **Python:** Update cron script to calculate StdDev/Mean for top 100 items daily.
    2.  **DB:** Store in new table \market_volatility\.
    3.  **UI:** Add "🔥" icon next to volatile items in search.
*   **Effort:** High (Requires ML pipeline integration).
*   **Benefit:** Strategic speculation.

## 4. 🔽 Tray Icon Enhancements (Low Priority)
*Quality of Life.*

*   **Concept:** Move cooldown and status indicators to OS System Tray.
*   **Why Low Priority?** Current UI already handles cooldowns effectively.
*   **Implementation:** Tauri System Tray API.

## 5. ⚙️ Infrastructure & Performance (Technical Debt)
*Scalability Foundation (Based on Manus Analysis).*

*   **Rust Event Batching:** Group trade events (50ms buffer) to reduce IPC overhead.
*   **Context Splitting:** Split \TradeEventContext\ into \FeedContext\ and \StatsContext\ to prevent unnecessary re-renders.
*   **Rust Item Cache:** Pre-load canonical item list into Rust memory for instant validation.
*   **Async Persistence:** Decouple Supabase writes from UI updates to improve perceived speed.
