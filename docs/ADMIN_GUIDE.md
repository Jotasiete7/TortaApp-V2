# TortaApp - Admin Guide

**Version:** 0.1.0-beta  
**For:** System Administrators

---

## 🛡️ Admin Panel Overview

The Admin Panel provides powerful tools for managing users, data, and system settings.

**Access:** Sidebar → Admin Panel (admin role required)

---

## 👥 User Management

### Viewing Users

Navigate to **Admin Panel** → **User Manager**

**Information Displayed:**
- User ID
- Email
- Game nick (if verified)
- Role (user/admin)
- Registration date
- Last login
- Total trades

### Assigning Admin Role

1. Find the user in User Manager
2. Click "Edit" or user row
3. Toggle "Admin" role
4. Save changes

> **⚠️ Warning:** Admin users have full access to all features. Only assign to trusted individuals.

### Removing Admin Role

Follow the same process and toggle admin role off.

### Viewing User Activity

Click on a user to see:
- Trade history
- XP and level
- Badges earned
- Upload history

---

## 💰 Price Management

### Updating Reference Prices

Reference prices are used for price insights and ML predictions.

**To Update:**
1. Navigate to **Price Manager**
2. Search for item name
3. Enter new reference price (in copper)
4. Click "Save"
5. Changes apply immediately

### Bulk Price Updates

For updating many prices at once:
1. Prepare CSV file with format: `item_name,price`
2. Navigate to **Bulk Price Update**
3. Upload CSV
4. Review changes
5. Confirm import

### Price Data Sources

Reference prices should come from:
- Historical trade averages
- Community price guides
- Official Wurm market data

---

## 📦 Bulk Data Upload

### NDJSON Format

For large dataset imports, use NDJSON (Newline Delimited JSON):

```json
{"nick":"PlayerName","item":"Iron ore","price":50,"quantity":100,"quality":90,"timestamp":"2025-01-01T12:00:00Z","trade_type":"WTS"}
{"nick":"PlayerName2","item":"Steel","price":200,"quantity":50,"quality":85,"timestamp":"2025-01-01T13:00:00Z","trade_type":"WTB"}
```

### Upload Process

1. Navigate to **Bulk Upload**
2. Select NDJSON file
3. Review file preview
4. Click "Import"
5. Wait for processing (may take several minutes for large files)
6. Review import summary

### Data Validation

The system validates:
- Required fields present
- Valid data types
- Price ranges (0-999999 copper)
- Quality ranges (0-100)
- Timestamp format

Invalid records are skipped and logged.

---

## 📊 System Statistics

### Monitoring Dashboard

View real-time system metrics:
- Total users
- Total trades in database
- Active users (last 7 days)
- Storage usage
- API response times

### Performance Metrics

Monitor:
- Database query performance
- File upload success rate
- ML prediction accuracy
- Error rates

### Alerts

Set up alerts for:
- High error rates
- Slow performance
- Storage limits
- Unusual activity

---

## 📢 Ticker Messages

### Managing Announcements

The ticker displays scrolling messages at the top of the app.

**To Add Message:**
1. Navigate to **Ticker Manager**
2. Click "New Message"
3. Enter message text
4. Set priority (normal/important/urgent)
5. Set expiration date (optional)
6. Save

**Message Types:**
- **Info** - General announcements
- **Warning** - Important notices
- **Alert** - Urgent system messages

### Best Practices

✅ Keep messages concise (< 100 characters)  
✅ Use for important announcements only  
✅ Set expiration dates to auto-remove  
❌ Don't spam with too many messages

---

## 🔒 Security & Permissions

### Row Level Security (RLS)

All data is protected with Supabase RLS policies:
- Users can only see their own data
- Admins can view all data (for support)
- Public data (leaderboards) is read-only

### Reviewing RLS Policies

Check Supabase dashboard for current policies:
1. Login to Supabase
2. Navigate to Authentication → Policies
3. Review each table's policies
4. Test with different user roles

### Rate Limiting

Protect against abuse:
- File uploads: 10 per hour per user
- API calls: 100 per minute per user
- ML predictions: 20 per hour per user

---

## 🐛 Troubleshooting

### Common Admin Issues

**Users can't upload files**
- Check storage quota
- Verify file size limits
- Review error logs

**Predictions not working**
- Ensure sufficient historical data
- Check ML service status
- Review prediction logs

**Leaderboards not updating**
- Trigger manual refresh
- Check database functions
- Verify RPC permissions

### Logs & Debugging

Access logs in:
- Supabase Dashboard → Logs
- Application error logs
- User activity logs

---

## 📋 Maintenance Tasks

### Daily
- Monitor system health
- Review error logs
- Check ticker messages

### Weekly
- Review user feedback
- Update reference prices
- Check storage usage

### Monthly
- Database cleanup (old logs)
- Performance optimization
- Security audit

---

## 🚨 Emergency Procedures

### System Down

1. Check Supabase status
2. Review error logs
3. Notify users via Discord
4. Contact development team

### Data Corruption

1. Stop all uploads immediately
2. Backup current database
3. Identify corrupted records
4. Restore from backup if needed

### Security Breach

1. Disable affected accounts
2. Change admin passwords
3. Review access logs
4. Notify affected users
5. Contact development team

---

## 📞 Support Contacts

**Development Team:** [contact info]  
**Supabase Support:** [supabase.com/support]  
**Beta Testing Group:** [Discord link]

---

**Remember:** With great power comes great responsibility. Use admin features wisely! 🛡️
