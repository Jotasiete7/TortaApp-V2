# TortaApp Architecture

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite 6
- **Desktop**: Tauri 2
- **Styling**: TailwindCSS v3
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **Testing**: Vitest

## 📁 Project Structure

```
TortaApp-V2/
├── components/          # React components
│   ├── auth/           # Authentication
│   ├── gamification/   # Levels, achievements
│   ├── layout/         # Sidebar, NewsTicker
│   └── market/         # Market analysis
├── contexts/           # React contexts
├── services/           # Business logic
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── src-tauri/          # Rust backend
└── docs/               # Documentation
```

## 🔄 Data Flow

### 1. Authentication
```
User → Google OAuth → Supabase Auth → AuthContext → App
```

### 2. Trade Data
```
Log File → FileParser → MarketData State → Components
Database → RPC → MarketData State → Components
```

### 3. Real-time Updates
```
Supabase Realtime → Channel Subscription → State Update → UI
```

## 🎯 State Management

### Global State (Context)
- `AuthContext`: User authentication
- `TradeEventContext`: Live trade events

### Local State (useState)
- Component-specific UI state
- Form inputs
- Filters and searches

### Persistent State
- `localStorage`: User preferences, last view
- Supabase: User data, trade logs

## 🔐 Security

### Authentication
- Google OAuth 2.0
- Deep-link verification for game nicks
- JWT tokens (Supabase)

### Data Sanitization
- `sanitizeItemName()`: XSS prevention
- `sanitizeSeller()`: Input validation
- Canonical item names for consistency

### Secrets Management
- `.env.local` for API keys (gitignored)
- `app.key` for minisign (gitignored)
- Public key in `tauri.conf.json`

## 🚀 Build & Deploy

### Development
```bash
npm run tauri:dev
```

### Production Build
```bash
npm run tauri:build
```

### Auto-Update
- GitHub Releases
- `latest.json` generated automatically
- Minisign signature verification

## 📊 Database Schema

### Key Tables
- `profiles`: User data, levels, XP
- `trade_logs`: Historical trade data
- `player_identities`: Nick verification
- `achievements`: Gamification

### Materialized Views
- Performance optimization
- Pre-aggregated stats

## 🎮 Gamification System

### Levels (1-50)
- XP per trade: 10 XP
- Level formula: `level = floor(sqrt(xp / 100))`
- Real-time updates via Supabase channels

### Achievements
- Tracked in database
- UI notifications
- Sound effects

## 🔌 Integrations

### Supabase
- Authentication
- Real-time subscriptions
- RPC functions
- Storage

### Tauri
- File system access
- Deep-link handling
- Auto-updater
- Notifications

## 🧪 Testing Strategy

### Unit Tests
- `vitest` for services
- Component logic testing

### Integration Tests
- File parsing
- Data transformation

### Manual Testing
- UI/UX flows
- Cross-platform (Windows)

## 📈 Performance

### Optimization
- Lazy loading components
- Memoization (`useMemo`, `useCallback`)
- Virtual scrolling for large lists
- Debounced search

### Limits
- Dev: 5,000 trades
- Production: 50,000 trades

## 🌐 Internationalization

### Supported Languages
- English (EN)
- Portuguese (PT)

### Implementation
- `translations` object in `i18n.ts`
- Language toggle in header
- Persistent preference

## 🔄 Update Flow

1. New version released on GitHub
2. `latest.json` generated
3. App checks for updates on startup
4. User downloads and installs
5. App restarts with new version

## 📝 Code Organization

### Naming Conventions
- Components: PascalCase
- Files: PascalCase for components, camelCase for utilities
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### File Structure
- One component per file
- Co-locate related files
- Index files for clean imports

## 🎯 Design Patterns

### Component Patterns
- Presentational vs Container components
- Custom hooks for logic reuse
- Context for global state

### Service Layer
- Pure functions
- Single responsibility
- Testable units

## 🔍 Monitoring

### Error Handling
- Try-catch blocks
- User-friendly error messages
- Console logging (dev mode)

### Analytics
- Trade volume tracking
- User engagement metrics
- Performance monitoring

## 🚦 Feature Flags

Currently using environment variables:
- `import.meta.env.DEV`: Development mode
- `import.meta.env.PROD`: Production mode

## 📚 Documentation

- `README.md`: Project overview
- `VERSIONING.md`: Semantic versioning
- `CHANGELOG.md`: Version history
- `DESIGN.md`: Design system
- `ARCHITECTURE.md`: This file
