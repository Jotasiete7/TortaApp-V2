# TortaApp - Wurm Trade Analytics (Beta)

> ðŸ”’ **Private Repository** - Beta Testing Phase

Advanced trade analytics and market intelligence and trading companion for Wurm Online.

## ðŸš€ Features

- **Market Intelligence** - Advanced search with 100k+ trade records
- **ML Price Predictor** - Machine learning-powered price forecasting
- **Gamification** - XP, levels, badges, and leaderboards
- **Trade Analytics** - Comprehensive statistics and insights
- **Admin Panel** - User and price management tools

## ðŸ› ï¸ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS (via inline styles)
- **Icons:** Lucide React
- **ML:** Custom prediction algorithms

## ðŸ“‹ Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

## ðŸ”§ Setup

### 1. Clone Repository

```bash
git clone https://github.com/Jotasiete7/TortaApp-V2.git
cd TortaApp-V2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` file in root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> âš ï¸ **Never commit .env.local!** It's already in .gitignore.

### 4. Database Setup

Run SQL migrations in order from `database/migrations/`:

```bash
# In Supabase SQL Editor, run files in order:
# 06_badges_system.sql
# 07_shouts_system.sql
# ... (all numbered files)
```

### 5. Run Development Server

```bash
npm run dev
```

App will be available at `http://localhost:5173`

## ðŸ“š Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete feature guide
- [FAQ](docs/FAQ.md) - Common questions
- [Admin Guide](docs/ADMIN_GUIDE.md) - Admin features
- [Changelog](docs/CHANGELOG.md) - Version history

## ðŸ§ª Beta Testing

### Current Version: 2.1.4

> ðŸ“Š **For detailed project status, see [PROJECT_STATUS.md](PROJECT_STATUS.md)** - Single source of truth for versions, features, and roadmap.

**What to Test:**
- [ ] Account creation and login
- [ ] File upload (trade logs)
- [ ] Market search and filtering
- [ ] ML price predictions
- [ ] Gamification (XP, badges, levels)
- [ ] Service Directory (Yellow Pages)
- [ ] Live Trade Monitor & Alerts
- [ ] Guild features (Map, Resources)
- [ ] Mobile responsiveness
- [ ] Admin panel (if admin)

**How to Report Issues:**
- Use in-app feedback
- Discord: [beta testing channel]
- Email: [your email]

## ðŸ—ï¸ Project Structure

```
TortaApp-V2/
â”œâ”€â”€ components/          # React components
â”œâ”€â”€ services/           # Business logic
â”œâ”€â”€ database/           # SQL migrations
â”œâ”€â”€ docs/              # Documentation
â”œâ”€â”€ public/            # Static assets
â””â”€â”€ types.ts           # TypeScript types
```

## ðŸ”’ Security

- All sensitive data in .env.local (gitignored)
- Row-level security (RLS) in Supabase
- No API keys in code
- Private repository during beta

## ðŸ“ Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## ðŸ¤ Contributing (Beta Testers)

1. Test features thoroughly
2. Report bugs with details
3. Suggest improvements
4. Help with documentation

## ðŸ“„ License

Proprietary - All Rights Reserved (during beta)

## ðŸ‘¥ Team

- **Developer:** Jotasiete7
- **Beta Testers:** [TBD]

## â¤ï¸ Support the Project

If you like TortaApp and want to support its development, consider becoming a patron!

[![Patreon](https://img.shields.io/badge/Patreon-Support%20Development-orange?style=for-the-badge&logo=patreon)](https://www.patreon.com/c/tortawurmapp?vanity=user)

**[Become a Patron](https://www.patreon.com/c/tortawurmapp?vanity=user)**

---

**Status:** ðŸŸ¡ Beta Testing / Active Production  
**Last Updated:** January 2026  
**Version:** 2.1.4