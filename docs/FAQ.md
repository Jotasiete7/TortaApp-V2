# Frequently Asked Questions (FAQ)

## General Questions

### What is TortaApp?
TortaApp is a market intelligence and trading analysis tool for Wurm Online. It helps you track prices, predict market trends, and gamify your trading experience.

### Is TortaApp free?
Yes! TortaApp is completely free to use during the beta period.

### Is my data safe?
Yes. All data is stored securely in Supabase with row-level security. We never share your personal information.

---

## Account & Setup

### How do I create an account?
1. Click "Sign Up" on the login screen
2. Enter your email and password
3. Verify your email
4. Login and start using the app

### How do I verify my game nick?
1. Go to Profile → Settings
2. Click "Link Game Nick"
3. Enter your Wurm character name (case-sensitive)
4. Complete the verification process
5. Your stats will start tracking automatically

### I forgot my password. What do I do?
Click "Forgot Password" on the login screen and follow the email instructions.

---

## Uploading & Data

### What file formats are supported?
- `.txt` files (Wurm trade chat logs)
- `.log` files
- **NDJSON** (admin only, for bulk uploads)

### How do I upload trade logs?
1. Navigate to Dashboard
2. Click "Upload Logs"
3. Select your file or drag & drop
4. Wait for processing
5. Review the summary

### My upload failed. Why?
Common reasons:
- File is too large (max 50MB)
- File format is incorrect
- File contains corrupted data

Try uploading smaller chunks or cleaning your log file.

### How often should I upload logs?
Upload regularly (weekly or monthly) to keep your data fresh and predictions accurate.

---

## Market Intelligence

### How do I search for items?
Use the search bar in the Trade Database. You can use:
- **Simple search:** `iron ore`
- **Advanced search:** `iron ore ql>90 price<50`

### What are the search operators?
- `ql>X` / `ql<X` - Quality filters
- `price>X` / `price<X` - Price filters
- `qty>X` - Quantity filters
- `seller=NAME` - Filter by seller
- `rarity=TYPE` - Filter by rarity

### What does "Good Deal" / "Bad Deal" mean?
These insights compare the current price to historical reference prices:
- **Good Deal** - Cheaper than average
- **Fair** - Close to average
- **Bad Deal** - More expensive than average

---

## ML Price Predictor

### How accurate are the predictions?
Accuracy depends on:
- Amount of historical data
- Market volatility
- Confidence level shown

High confidence (>80%) predictions are generally more reliable.

### Why can't I predict prices for some items?
Predictions require sufficient historical data. New or rarely-traded items may not have enough data for accurate predictions.

### How far ahead can I predict?
Currently, predictions forecast 7 days ahead.

### Should I trust the predictions for trading?
Predictions are estimates based on historical patterns. Use them as guidance, not guarantees. Always consider current market conditions.

---

## Gamification

### How do I earn XP?
- Upload trade logs (WTS, WTB, PC trades)
- Daily check-in (+10 XP)
- Each trade type gives +10 XP

### My XP isn't updating. Why?
- XP updates every ~5 minutes
- Try refreshing the page
- Ensure your game nick is verified
- Check that trades are being uploaded correctly

### How do I unlock badges?
Badges unlock automatically when you meet their requirements. View all badges and requirements in **Rules & Compendium**.

### Can I choose which badges to display?
Yes! Click on your profile badges and select up to 5 to display.

### What's the daily check-in?
Open **Rules & Compendium** and click "Daily Check-in" to earn +10 XP. Resets at midnight.

---

## Admin Features

### How do I become an admin?
Admin roles are assigned by the system administrator. Contact the development team if you need admin access.

### What can admins do?
- Manage users
- Update reference prices
- Upload bulk data (NDJSON)
- View system statistics
- Manage ticker messages

---

## Technical Issues

### The app won't open
- Check if you have the latest version
- Try restarting your computer
- Contact support if the issue persists

### I'm getting errors when uploading files
- Verify file format (.txt or .log)
- Check file size (max 50MB)
- Ensure file isn't corrupted
- Try uploading a smaller portion

### The app is slow
- Close other applications
- Clear browser cache (if using web version)
- Check your internet connection
- Large datasets may take time to process

### I found a bug. How do I report it?
Use the in-app feedback button (coming soon) or contact the beta testing group on Discord.

---

## Privacy & Security

### What data do you collect?
- Email address (for authentication)
- Trade logs you upload
- Game nick (if verified)
- Usage statistics (anonymous)

### Do you sell my data?
No. We never sell or share your personal data.

### Can I delete my account?
Yes. Contact support to request account deletion.

### Is my trading data private?
Yes. Your data is protected with row-level security. Only you (and admins for support purposes) can access your data.

---

## Getting Help

### Where can I get more help?
- Check this FAQ
- Read the [User Manual](USER_MANUAL.md)
- Join the beta tester Discord/community
- Contact support via email

### How do I provide feedback?
We love feedback! Use the in-app feedback system (coming soon) or reach out via Discord.

---

**Still have questions?** Contact us through the beta testing community!
