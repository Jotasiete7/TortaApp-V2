# 🧠 Market Intelligence - Technical Documentation

## 1. Overview
The **Market Intelligence** module is the core analytical engine of Torta App v2. It transforms raw chat logs (from Wurm Online) into actionable market insights, identifying Trends (Demand/Supply), Volatility, and Arbitrage opportunities in real-time.

It operates on a **Hybrid Data Model**, capable of merging consistent remote data (Supabase) with immediate local data (User Log Files).

## 2. Core Architecture

### 📂 Key Files
| File | Responsibility |
| :--- | :--- |
| **`services/intelligence.ts`** | **The Brain**. Contains the `IntelligenceService` singleton. Handles data fetching (RPC), normalization, filtering, and aggregation logic. |
| **`components/dashboard/MarketIntelligence.tsx`** | **The View**. React component that manages UI state (Time Window options), calls the service, and renders the 3 main columns (Demand, Supply, Volatility). |
| **`components/dashboard/ArbitrageWidget.tsx`** | **The Alert System**. A specialized polling component that uses `intelligence.ts` to find "Crossed Books" (WTB Price >= WTS Price) and alert the user. |
| **`components/Dashboard.tsx`** | **The Orchestrator**. Manages the high-level state, accepts file uploads, and passes the `localData` down to the Intelligence module. |

---

## 3. Data Flow

### Step 1: Data Ingestion (Hybrid)
 The system accepts data from two sources:
1.  **Remote (Supabase)**: Calls `get_trade_logs_for_market` RPC to fetch the last 10,000 global trades.
2.  **Local (File Upload)**: User uploads a `logs.txt`. This is parsed client-side into `MarketItem[]` objects and passed as the `localData` prop.

### Step 2: Normalization
Inside `getMarketIntelligence`, both sources are mapped to a unified `NormalizedData` interface:
```typescript
interface NormalizedData {
    name: string;      // Cleaned Name (e.g. "Iron Lump")
    ql: string;        // Quality Bucket (e.g. "90ql+")
    price: number;     // Normalized Copper Value
    type: 'WTB'|'WTS'; // Trade Intent
    timestamp: number; // For filtering
}
```
*   **Normalization Logic**:
    *   **Name Cleaning**: Strips prefixes like "Impure", "Shattered", "Rare" (stored separately as metadata) to ensure "Impure Iron" and "Iron" group together.
    *   **QL Bucketing**: Extracts "90ql", "86ql" and groups them into decades: `80ql+`, `90ql+`. `undefined` QL is grouped as generic.

### Step 3: Filtering (Time Window)
The user selects a window (`4h`, `12h`, `24h`, `7d`, `30d`).
*   The service calculates a `cutoff` timestamp.
*   Any trade older than `cutoff` is discarded **before** aggregation.

### Step 4: Aggregation
The system builds `DemandMap` and `SupplyMap`:
*   **Key**: `${Name} (${QL})` -> e.g., "Drake Hide (90ql+)"
*   **Metrics Calculated**:
    *   **Volume**: Count of distinct messages.
    *   **Latest Price**: The most recent price point.
    *   **Avg Price**: Simple moving average of the window.
    *   **Absolute Change**: `LatestPrice - OldestPrice` (Used for Volatility).

### Step 5: Ranking
*   **Top Demand**: Sorted by `Volume` (WTB).
*   **Top Supply**: Sorted by `Volume` (WTS).
*   **Volatility**: Sorted by `Math.abs(AbsoluteChange)`.

---

## 4. Key Algorithms

### 🧹 Noise Stripping (Regex)
To prevent "garbage" items, the parser aggressively strips known noise:
```typescript
// Removes modifiers to find the "True Item Name"
clean = clean.replace(/\b(impure|shattered|unfinished|corroded|broken|..)\s+/gi, '');
```

### ⚖️ Arbitrage Detection
Runs separately via `getArbitrageOpportunities`:
1.  Builds specialized Buy/Sell maps for the last 24h.
2.  Iterates through all items.
3.  Checks strict condition: `Max(WTB_Price) > Min(WTS_Price)`.
4.  Returns list sorted by `Spread` (Potential Profit).

## 5. Extensibility
*   **New Metrics**: Can be added to `MarketTrendItem` in `intelligence.ts` and rendered in the `TrendItem` component.
*   **New Data Sources**: Any source that can produce `MarketItem[]` can be plugged into the `localData` prop in `Dashboard.tsx` without changing the core logic.
