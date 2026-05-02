# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `boardly/boardly/`:

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (TypeScript check + bundle)
npm run lint      # ESLint
npm run preview   # Serve built output
```

Always run `npm run build` before marking any task complete — TypeScript errors surface only at build time (not dev server).

## Architecture

### Routing

No router library. `useNavStore` holds the current `NavPage` (enum: `dashboard | subjects | sessions | tests | calendar | settings`). `App.tsx` has a static `PAGE_MAP` object that maps each `NavPage` to its page component. Navigation happens via `navigate()` from the store.

Onboarding gate: `App.tsx` checks `localStorage.getItem('boardly:onboarded')` and renders `<Onboarding>` early-return until the user completes it.

### State Management

Seven Zustand stores, each persisting via the `storage` util (`boardly:` prefixed keys):

| Store | Key | Notable |
|---|---|---|
| `useNavStore` | — | In-memory only |
| `useThemeStore` | `boardly:theme` | Applies `dark` class to `document.documentElement` |
| `useSettingsStore` | `boardly:settings` | User profile, exam dates, page labels, study defaults |
| `useSubjectsStore` | `boardly:subjects`, `boardly:topics` | Owns read-status cycling |
| `useSessionsStore` | `boardly:sessions` | Owns attendance, reviews, weekly test scores |
| `useTestsStore` | `boardly:tests` | Mastery tests and score history |
| `useEventsStore` | `boardly:events` | Calendar events |

`src/utils/storage.ts` is a thin `{ get, set, remove }` wrapper over `localStorage` with error recovery.

### Key Types (`src/types/index.ts`)

- `SubjectColor`: `amber | jade | sky | rose | violet | orange | teal | pink`
- `COLOR_MAP`: maps each `SubjectColor` → `{ bg, text, border, dot }` Tailwind class strings — used by subject and topic cards
- `AppSettings`: includes `userName`, `boardExamName`, `examDates[]`, `pageLabels: PageLabels`, and study defaults
- `DEFAULT_PAGE_LABELS` / `DEFAULT_SETTINGS`: constants for fallback values across nav and settings
- `NavPage`: string union used as keys for `PAGE_MAP` and `pageLabels`

### Utilities (`src/utils/`)

- `dates.ts`: `buildCalendarMonth()`, `upcomingEvents()`, `generateReviewDates()` (spaced repetition), `formatDate()`, `daysUntil()`, `isToday/isPast/isFuture()`
- `progress.ts`: `topicProgress()`, `subjectProgress()`, `sessionProgress()` (40% attendance + 60% reviews), `overallProgress()`, `pct()`, `pctNum()`
- `scores.ts`: `highestScore()`, `latestScore()`, `averageScore()`, `scoreTrend()`, `passedTarget()`
- `storage.ts`: localStorage wrapper
- `seedData.ts`: test data generator

### Styling

Tailwind CSS 3, `darkMode: 'class'`. Custom config:
- **Fonts**: `Syne` (display), `DM Sans` (body), `JetBrains Mono` (mono)
- **Colors**: `ink` (dark backgrounds), `jade` (green accent distinct from Tailwind's `emerald`)
- **Backgrounds**: `bg-grid-ink` / `bg-grid-light` SVG grid textures
- **Shadows**: `shadow-card`, `shadow-card-hover`, `glow-emerald`, `glow-jade`
- **Animations**: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`

Dark mode classes follow pattern: `text-slate-700 dark:text-slate-300`, `bg-white dark:bg-ink-800`.

### Layout

- Desktop: `Sidebar` (left) + page content
- Mobile: `BottomNav` (bottom) + mobile header with page title from `pageLabels`
- Both nav components read `settings.pageLabels` merged with `DEFAULT_PAGE_LABELS` to support user-renamed pages

### Component Patterns

- **Inline editing**: State pattern `[editing, setEditing]` + `[editVal, setEditVal]` per row (see `ScoreRow` in `TestCard.tsx`, `WeeklyScoreRow` in `SessionCard.tsx`) — no separate modal
- **Color theming**: Components that need subject color import `COLOR_MAP` and `subject.color`, then destructure `{ bg, text, border }`
- **Progress bars**: `<ProgressBar value={0..1} size="xs|sm|md" color="jade|rose|..." gradient? />`
- **Modal**: Reusable `<Modal open={bool} onClose={fn} title="...">` wrapper
