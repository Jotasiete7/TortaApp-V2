# TortaApp - User Manual

**Version:** 2.0.0 "Venerable Whale"  
**Last Updated:** December 15, 2025

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Uploading Trade Logs](#uploading-trade-logs)
4. [Live Trade Monitor](#live-trade-monitor)
5. [Market Intelligence](#market-intelligence)
6. [ML Price Predictor](#ml-price-predictor)
7. [Gamification System](#gamification-system)
8. [Admin Features](#admin-features)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### What is TortaApp?

TortaApp is your intelligent companion for the Wurm Online trading ecosystem. It analyzes trade data, predicts prices using machine learning, and gamifies your trading experience with XP, levels, and badges.

### First Launch

1. **Open TortaApp** - Double-click the application icon
2. **Create Account** - Click "Sign Up" and enter your email
3. **Verify Email** - Check your inbox for verification link
4. **Login** - Use your credentials to access the dashboard

---

## 👤 Account Setup

### Linking Your Game Nick

To track your trading stats, you need to verify your Wurm character:

1. Navigate to **Profile** → **Settings**
2. Click **"Link Game Nick"**
3. Enter your exact Wurm character name
4. Follow verification steps
5. Once verified, your stats will start tracking automatically

> **💡 Tip:** Your game nick is case-sensitive!

---

## 📤 Uploading Trade Logs

### Supported Formats
- `.txt` - Standard Wurm trade chat logs
- `.log` - Alternative log format

### How to Upload
1. Navigate to **Dashboard** → **Upload Logs**
2. Click "Choose File" or drag & drop
3. Wait for processing
4. Review results

---

## 📡 Live Trade Monitor (V2.0 New!)

TortaApp now watches your log files in real-time.

1. Go to **Dashboard**
2. Click **Start Live Monitoring**
3. Select your active `logs/_Trade_names.txt` file.

**Features:**
- **Zero-Latency:** Trades appear instantly on the ticker.
- **Offline Queue:** If your internet drops, trades are saved and uploaded automatically when you reconnect.
- **Panic Protection:** The watcher automatically recovers if the game file lock behaves unexpectedly.

---

## 📊 Market Intelligence

### Advanced Search

```
iron ore ql>90 price<50
```

### Search Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `ql>X` | `ql>90` | Quality greater than X |
| `price<X` | `price<50` | Price less than X copper |
| `qty>X` | `qty>10` | Quantity greater than X |

### Canonical Identity System
Search now understands that **"Impure Iron Lump"** is the same item as **"Iron Lump"**. It automatically groups these items to show you accurate price history without clutter.

---

## 🤖 ML Price Predictor

Uses machine learning to forecast future prices based on historical data.

**How to Use:**
1. Search for an item
2. Click "Predict Price"
3. View prediction chart

---

## 🎮 Gamification System

### Earning XP

| Action | XP |
|--------|-----|
| Sell Item (WTS) | +10 XP |
| Buy Item (WTB) | +10 XP |
| Price Check (PC) | +10 XP |
| Daily Login | +10 XP |

### Levels

| Level | Title | Requirement |
|-------|-------|-------------|
| 1 | Novice | 0 - 50 Trades |
| 2 | Apprentice | 50 - 150 Trades |
| 3 | Merchant | 150 - 500 Trades |
| 4 | Veteran | 500 - 1,000 Trades |
| 5 | Tycoon | 1,000+ Trades |

### Badges

Unlock achievements by completing challenges. View all badges in **Rules & Compendium**.

---

## 🛡️ Admin Features

Access via **Sidebar** → **Admin Panel**

- User Manager
- Price Manager
- Bulk Upload
- System Stats

---

## 🔧 Troubleshooting

See [FAQ.md](FAQ.md) for common issues and solutions.

---

*TortaApp - Making Wurm trading smarter!* 🎯
