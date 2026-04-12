# Theatrelog

> **Your logbook, sorted.**

Surgical operation logbook PWA for UK doctors building ARCP portfolios. Log cases offline in theatre, generate ARCP-ready summaries in seconds. No spreadsheets, no stress.

**Production:** [theatrelog.uk](https://theatrelog.uk) &nbsp;|&nbsp; **Staging:** [britops-staging.web.app](https://britops-staging.web.app)

---

## Features

- **Offline-first** — log cases in theatre with no internet connection; syncs automatically when back online
- **ARCP portfolio** — auto-aggregated procedure counts by involvement level (assistant / supervised / independent)
- **187 default procedures** — pre-loaded surgical procedure library with specialty and category grouping
- **Custom procedures** — add your own procedure types, hide defaults you don't need
- **Excel import/export** — bulk import historical cases; export to `.xlsx` for ARCP submissions
- **PWA** — installable on iOS and Android; works like a native app
- **GDPR compliant** — consent tracking, right to erasure, soft deletes with 30-day Firestore TTL
- **Dark / light / system theme** — respects device preference or manual override

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6.3 |
| Styling | Tailwind CSS 4 |
| State | Zustand (global + persist), Dexie / IndexedDB (local) |
| Backend | Firebase Auth + Firestore |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest + Testing Library (unit/integration), Playwright (E2E), Lighthouse CI |
| CI/CD | GitHub Actions → Firebase Hosting |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Firebase project (Auth + Firestore enabled)

### Install

```bash
git clone https://github.com/your-org/theatrelog.git
cd theatrelog
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> These values are baked into the client bundle at build time and are **not secret** — security relies on Firestore Security Rules and Firebase Auth, not key secrecy.

### Run

```bash
npm run dev        # Dev server at http://localhost:5173 (hits staging Firebase)
npm run build      # Production build
npm run preview    # Preview production build locally
```

### Local Dev with Emulators

For development without touching the staging project:

1. Install the Firebase CLI if you haven't already: `npm install -g firebase-tools`
2. Run `npm run dev:emulator` — starts Auth/Firestore/Functions emulators, seeds test data, and launches Vite

Test accounts (created automatically by the seed script):

| Email | Password | Tier |
|---|---|---|
| `free@test.com` | `password123` | Free |
| `pro@test.com` | `password123` | Pro (full access) |

Emulator UI at http://127.0.0.1:4000 — inspect Auth users and Firestore documents live.
Emulator state persists in `.emulator-data/` (gitignored) between runs.

> Stripe checkout is mocked in emulator mode. For end-to-end payment testing, use `npm run dev`
> against staging with Stripe test card `4242 4242 4242 4242`.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit & integration tests (run mode) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with v8 coverage report |
| `npm run test:e2e` | Playwright E2E tests (all projects) |
| `npm run test:e2e:ui` | Playwright interactive UI mode |
| `npm run size` | Check bundle size limits |
| `npm run analyze` | Build with bundle visualiser |
| `npm run lhci` | Run Lighthouse CI |
| `npm run icons` | Regenerate PNG icons from `brand/theatrelog-icon-navy.svg` |
| `npm run dev:emulator` | Firebase emulators + seed + Vite (no staging side-effects) |
| `npm run emulator:start` | Start Firebase emulators (Auth, Firestore, Functions, UI at :4000) |
| `npm run emulator:seed` | Seed emulators with test users and Stripe product fixtures |

---

## Project Structure

```
src/
├── pages/              # Route pages
│   ├── Dashboard.tsx
│   ├── LogOperation.tsx
│   ├── EditOperation.tsx
│   ├── Portfolio.tsx
│   ├── SettingsPage.tsx
│   ├── Login.tsx
│   ├── PrivacyPolicy.tsx
│   └── TermsOfService.tsx
├── components/
│   ├── layout/         # AppShell, BottomNav
│   ├── operations/     # OperationCard, OperationForm, OperationList, ProcedurePicker, FormBuilder
│   ├── portfolio/      # PortfolioSummary
│   ├── settings/       # ProcedureTypeManager
│   └── common/         # OfflineIndicator
├── hooks/              # useAuth, useOperations, usePortfolio, useProcedureTypes, useSync
├── stores/             # useSettingsStore (Zustand persist)
├── context/            # SyncContext
├── firebase/           # config.ts, auth.ts, firestore.ts
├── db/                 # dexie.ts (IndexedDB schema)
├── types/              # TypeScript interfaces
├── data/               # procedures.ts, formSchemas.ts, hospitals.ts, grades.ts
├── utils/              # excel.ts, export.ts
├── lib/                # cn() utility
└── test/               # setup.ts, factories.ts, mocks/
e2e/                    # Playwright E2E tests
brand/                  # Logo SVGs and brand guidelines
```

---

## Architecture

### Data Flow

```
User action → React component → useOperations hook → Dexie (IndexedDB)
                                                         ↕  (useSync)
                                                      Firestore
```

- **Local-first** — all reads/writes go to Dexie. Firestore syncs in the background.
- **Pre-login data** — operations logged before sign-in use `userId: "local-user"`. On sign-in, `useSync` migrates them to the real UID.
- **Soft deletes** — `deleted: boolean` + `deletedAt` timestamp. Never hard-deleted locally; Firestore TTL policy purges after 30 days.
- **Last-write-wins** — sync conflicts resolved by `updatedAt` timestamp.

### Routing

| Path | Page | Auth |
|---|---|---|
| `/login` | Login | Public |
| `/privacy` | Privacy Policy | Public |
| `/terms` | Terms of Service | Public |
| `/` | Dashboard | Protected |
| `/log` | Log Operation | Protected |
| `/edit/:id` | Edit Operation | Protected |
| `/portfolio` | Portfolio Summary | Protected |
| `/settings` | Settings | Protected |

All authenticated routes are wrapped in `AppShell` (header + bottom nav).

### Key Hooks

| Hook | Purpose |
|---|---|
| `useAuth()` | Firebase auth state: `{ user, loading, isConfigured }` |
| `useOperations()` | Dexie CRUD: `{ operations, addOperation, updateOperation, deleteOperation }` |
| `usePortfolio(ops, procs)` | Memoised aggregation of operations into `PortfolioRow[]` |
| `useProcedureTypes()` | Merges 187 defaults with custom types; supports hiding via `__hidden__` prefix |
| `useSync(user)` | Bidirectional Dexie ↔ Firestore sync with real-time listeners |

### Stores

**`useSettingsStore`** — Zustand store with `persist` middleware. Stores `specialty`, `grade`, and `theme` in `localStorage`. `specialty`/`grade` are synced to Firestore; `theme` is device-local only.

---

## Database Schema (Dexie / IndexedDB)

**`operations`** — `id` (PK), indexed: `userId`, `date`, `*procedures` (multi-valued), `involvement`, `deleted`, `updatedAt`

**`procedureTypes`** — `id` (PK), indexed: `specialty`, `category`, `isCustom`

---

## Firebase

### Security Rules

Firestore rules enforce strict per-user data isolation:

- `operations` — read/write only if `userId` matches the authenticated UID
- `procedureTypes` — same scoping
- `userSettings/{userId}` — document ID must match auth UID
- `consents/{userId}` — document ID must match auth UID
- All other paths — denied

### Auth Methods

- Email/password
- Google Sign-In

---

## Testing

### Unit & Integration (Vitest)

```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report (60% threshold)
```

- Environment: happy-dom + fake-indexeddb
- Firebase mocked in `src/test/mocks/`
- Test factories in `src/test/factories.ts`

### E2E (Playwright)

```bash
npm run test:e2e       # Headless (Chromium + WebKit/iPhone 13)
npm run test:e2e:ui    # Interactive UI mode
```

- Auto-starts dev server on port 5173
- Test files: `e2e/*.spec.ts` (auth, dashboard, log-operation, offline, portfolio)

---

## Deployment

### Environments

| Environment | Branch | Firebase Target | URL |
|---|---|---|---|
| Staging | `main` | `britops-staging` | britops-staging.web.app |
| Production | `production` | `britops-1f219` | theatrelog.uk |

### CI/CD Pipeline

```
Feature branch → PR to main
  └─ CI: lint, build, unit tests, E2E tests, size check, Lighthouse
  └─ Firebase preview channel deployed (URL posted on PR)

Merge to main
  └─ Auto-deploy to staging

Merge main → production
  └─ Deploy to production (requires GitHub environment approval)
```

### Required GitHub Secrets

`FIREBASE_SERVICE_ACCOUNT_BRITOPS_1F219` plus `STAGING_FIREBASE_*` and `PROD_FIREBASE_*` variants for all six Firebase config values.

### Pre-Push Hook

Husky runs `lint`, `build`, and `test` before every `git push`. Bypass with `git push --no-verify` (not recommended).

---

## GDPR & Compliance

- Consent recorded in Firestore (`consentTimestamp`, `privacyPolicyVersion`) on first sign-up
- `purgeAllUserData()` deletes all operations, custom procedure types, settings, and consent records
- `deleteAccount()` calls `purgeAllUserData()` before removing the Firebase Auth account
- Soft deletes with 30-day Firestore TTL
- `/privacy` and `/terms` pages are publicly accessible without authentication

---

## Brand

Logo files live in `/brand`. Use the correct variant for each context:

| File | Use |
|---|---|
| `theatrelog-primary-light.svg` | Login page, marketing (light background) |
| `theatrelog-primary-dark.svg` | Splash screens (dark background) |
| `theatrelog-no-tagline-dark.svg` | App header (navy background) |
| `theatrelog-wordmark-light/dark.svg` | Footers, tight spaces |
| `theatrelog-icon-navy.svg` | Primary app icon / favicon source |

Run `npm run icons` to regenerate PNG icons from the source SVG.

### Colour Palette

| Token | Hex | Role |
|---|---|---|
| Navy | `#0B1D3A` | Headings, nav, primary buttons |
| Amber | `#E8943A` | CTAs, active states, highlights |
| Teal | `#1D9E75` | Success, synced status |
| Coral | `#D85A30` | Errors, complications, alerts |
| White | `#FFFFFF` | Primary background |
| Light Grey | `#F5F5F5` | Cards, secondary background |
| Mid Grey | `#6B7280` | Labels, secondary text |
| Dark Grey | `#374151` | Body text |

---

## Contributing

1. Branch from `main`
2. Open a PR — CI must pass before merge
3. Merging to `main` auto-deploys to staging for review
4. Promote to production by merging `main` → `production` (requires approval)
