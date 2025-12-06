# TortaApp V2 - Beta

> 🔒 **Private Repository** - Beta Testing Phase

Intelligent market analysis and trading companion for Wurm Online.

## 🚀 Features

- **Market Intelligence** - Advanced search with 100k+ trade records
- **ML Price Predictor** - Machine learning-powered price forecasting
- **Gamification** - XP, levels, badges, and leaderboards
- **Trade Analytics** - Comprehensive statistics and insights
- **Admin Panel** - User and price management tools

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS (via inline styles)
- **Icons:** Lucide React
- **ML:** Custom prediction algorithms

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

## 🔧 Setup

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/Jotasiete7/TortaApp-V2.git
cd TortaApp-V2
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables

Create \`.env.local\` file in root:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

> ⚠️ **Never commit .env.local!** It's already in .gitignore.

### 4. Database Setup

Run SQL migrations in order from \`database/migrations/\`:

\`\`\`bash
# In Supabase SQL Editor, run files in order:
# 06_badges_system.sql
# 07_shouts_system.sql
# ... (all numbered files)
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

App will be available at \`http://localhost:5173\`

## 📚 Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete feature guide
- [FAQ](docs/FAQ.md) - Common questions
- [Admin Guide](docs/ADMIN_GUIDE.md) - Admin features
- [Changelog](docs/CHANGELOG.md) - Version history

## 🧪 Beta Testing

### Current Version: 0.1.0-beta

**What to Test:**
- [ ] Account creation and login
- [ ] File upload (trade logs)
- [ ] Market search and filtering
- [ ] ML price predictions
- [ ] Gamification (XP, badges, levels)
- [ ] Admin panel (if admin)

**How to Report Issues:**
- Use in-app feedback (coming soon)
- Discord: [beta testing channel]
- Email: [your email]

## 🏗️ Project Structure

\`\`\`
TortaApp-V2/
├── components/          # React components
├── services/           # Business logic
├── database/           # SQL migrations
├── docs/              # Documentation
├── public/            # Static assets
└── types.ts           # TypeScript types
\`\`\`

## 🔒 Security

- All sensitive data in .env.local (gitignored)
- Row-level security (RLS) in Supabase
- No API keys in code
- Private repository during beta

## 📝 Scripts

\`\`\`bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
\`\`\`

## 🤝 Contributing (Beta Testers)

1. Test features thoroughly
2. Report bugs with details
3. Suggest improvements
4. Help with documentation

## 📄 License

Proprietary - All Rights Reserved (during beta)

## 👥 Team

- **Developer:** Jotasiete7
- **Beta Testers:** [TBD]

---

**Status:** 🟡 Beta Testing  
**Last Updated:** December 2025  
**Next Release:** TBD
