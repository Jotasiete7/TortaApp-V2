🔐 Identity System
Nick Verification: Link your in-game identity securely
Player Authentication: OAuth via Supabase
Admin Controls: Secure bulk data upload and news ticker management
📰 Community Features
News Ticker: Real-time announcements and market updates
Player Search: Find any trader's complete history and stats
Price Manager: Maintain reference prices for accurate market analysis
🚀 Quick Start
Prerequisites
Node.js 18+
npm or pnpm
Supabase Account (for backend)
Installation
# Clone the repository
git clone https://github.com/Jotasiete7/tortaapp.git
cd "Torta app/TortaApp-V2"
# Install dependencies
npm install
# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# Run development server
npm run dev
Visit http://localhost:3000 🎉

Build for Production
npm run build
npm run preview  # Preview production build locally
⚙️ Configuration
Environment Variables
Create 
.env.local
 in TortaApp-V2/:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Supabase Setup
Create Tables: Run migrations in supabase-migrations/:

01_create_ticker_messages.sql
02_create_rpc_functions_FIXED.sql
03_create_verification_system.sql
create_trade_logs_table.sql
 (in artifacts)
Set Admin Role:

UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your_user_id';
Enable RLS: Policies are included in migration files
📁 Project Structure
TortaApp-V2/
├── components/          # React components
│   ├── Dashboard.tsx    # Main analytics view
│   ├── PlayerProfile.tsx # Player stats & history
│   ├── MarketTable.tsx  # Trade database browser
│   ├── AdminPanel.tsx   # Admin controls
│   └── LogProcessor/    # RAW log upload system
├── services/           
│   ├── intelligence.ts  # Supabase RPC client
│   ├── fileParser.ts    # Log parsing engine
│   ├── mlEngine.ts      # ML anomaly detection
│   ├── priceUtils.ts    # Price formatting & evaluation
│   └── logProcessing/   # Bulk upload system
│       ├── BulkDataUploader.tsx
│       ├── supabaseIngestor.ts
│       └── types.ts
├── contexts/
│   └── AuthContext.tsx  # Authentication state
├── supabase-migrations/ # Database setup scripts
├── App.tsx             # Main app component
└── types.ts            # TypeScript types
🎮 Usage
For Regular Users
Browse Market Data:

Navigate to Trade Master
Search items, filter by type (WTS/WTB), rarity
View price trends and insights
View Player Profiles:

Search any player name in Dashboard
See complete trade history, stats, and rank
Upload Trade Logs (Optional):

Go to Dashboard → Advanced Data Tools
Upload your local Wurm trade chat log
Contribute to the community database
For Admins
Bulk Upload (Admin Only):

Admin Panel → Bulk Upload Tab
Upload large pre-cleaned NDJSON files
Populate database with historical trade data
Manage News Ticker:

Admin Panel → News Ticker Tab
Create announcements, set expiration
Paid announcement badge support
🔧 Development
Available Scripts
npm run dev      # Start dev server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
Tech Stack
Frontend: React 19, TypeScript, Vite
Styling: Tailwind CSS (utility-first)
Charts: Recharts
Icons: Lucide React
Backend: Supabase (PostgreSQL + Auth + Storage)
State: React Context API
Adding New Features
Create component in components/
Add types to 
types.ts
Create RPC functions in Supabase if needed
Wire up in 
App.tsx
📊 Database Schema
Main Tables
trade_logs: Core trade records (timestamp, nick, item, price, server)
profiles: User profiles (linked to auth.users, role management)
ticker_messages: News announcements
user_nicks: Identity verification system
Key RPC Functions
get_global_stats(): Dashboard statistics
get_player_stats_advanced(nick): Player profile data
get_top_traders(limit): Leaderboard
get_player_logs(nick, limit, offset): Trade history
See supabase-migrations/ for complete schema.

🐛 Troubleshooting
"Player not found" in profiles
RPC functions not created → Run 
fix_profile_loading.sql
Nick case mismatch → Searches are case-insensitive
Bulk upload shows "0 Success"
This is a cosmetic bug - check Supabase table, data IS saved
Run SELECT COUNT(*) FROM trade_logs to verify
Trade Master shows "NO DATA LOADED"
Trade Master only shows locally uploaded files currently
Database-powered Trade Master coming soon
🤝 Contributing
Contributions welcome! Please:

Fork the repo
Create feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open Pull Request
📝 License
Open source - use freely!

🙏 Acknowledgments
Wurm Online Community - for trade data and feedback
Supabase - amazing backend platform
React Team - incredible framework
Built with ❤️ for Wurm Online traders

For issues or questions, open a GitHub Issue or contact @Jotasiete