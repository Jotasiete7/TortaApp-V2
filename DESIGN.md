# TortaApp Design System

## 🎨 Color Palette

### Primary Colors
- `slate-900` (#0f172a) - Background
- `slate-800` (#1e293b) - Cards, Panels
- `slate-700` (#334155) - Borders
- `slate-200` (#e2e8f0) - Primary text

### Accent Colors
- `amber-500` (#f59e0b) - Primary accent, CTAs
- `amber-600` (#d97706) - Portuguese language
- `emerald-400` (#34d399) - Success, verified
- `rose-400` (#fb7185) - Danger, logout

## 📐 Typography

**Font Stack**: System fonts (Segoe UI, Roboto, etc.)

**Sizes**: xs (12px), sm (14px), base (16px), xl (20px), 2xl (24px)

## 🎭 Component Patterns

### Buttons
- Primary: `bg-amber-500 hover:bg-amber-600`
- Secondary: `bg-slate-700 hover:bg-slate-600`
- Danger: `bg-rose-500 hover:bg-rose-600`

### Cards
```tsx
<div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
```

### Badges
```tsx
<span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
```

## 🎬 Animations
- Fade In: 0.5s ease-out
- Slide In: 0.3s ease-out
- Transitions: 300ms default

## 📱 Responsive
- Sidebar: 256px (16rem)
- Breakpoints: sm (640px), md (768px), lg (1024px)

## 🌐 i18n
- EN/PT toggle in header
- Language state persisted

## ♿ Accessibility
- Focus rings on all interactive elements
- WCAG AA contrast ratios
- Semantic HTML

## 🎯 Best Practices
1. Use design tokens consistently
2. Mobile-first responsive design
3. Dark mode optimized
4. Smooth transitions
5. Icon size: 16px inline, 20px buttons
