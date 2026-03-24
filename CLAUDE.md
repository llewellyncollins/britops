# Theatrelog

Surgical operation logbook PWA for UK doctors building ARCP portfolios. Offline-first with cloud sync.

**Tagline:** "Your logbook, sorted."
**Value prop:** "Log cases offline in theatre. Generate ARCP-ready summaries in seconds. No spreadsheets, no stress."

## Brand

### Colour Palette

| Token | Hex | Role |
|---|---|---|
| Navy (primary) | `#0B1D3A` | Headings, nav, primary buttons |
| Amber (accent) | `#E8943A` | CTAs, active states, highlights |
| Teal (success) | `#1D9E75` | Success, synced status |
| Coral (warning/danger) | `#D85A30` | Errors, complications, alerts |
| White | `#FFFFFF` | Primary background |
| Light Grey | `#F5F5F5` | Secondary bg, cards |
| Mid Grey | `#6B7280` | Secondary text, labels |
| Dark Grey | `#374151` | Body text |

### Typography

| Use | Font | Weight |
|---|---|---|
| Headings/display | Satoshi (Fontshare CDN) | Bold / Semibold |
| Body/UI | Inter (Google Fonts) | Regular / Medium |
| Monospace | JetBrains Mono (Google Fonts) | Regular |

### Logo Files (`/brand`)

| File | Use |
|---|---|
| `theatrelog-primary-light.svg` | Login page, marketing (light bg) |
| `theatrelog-primary-dark.svg` | Splash screens (dark bg) |
| `theatrelog-no-tagline-light.svg` | Compact header (light bg) |
| `theatrelog-no-tagline-dark.svg` | App header (navy bg) ← used in AppShell |
| `theatrelog-wordmark-light/dark.svg` | Footers, tight spaces |
| `theatrelog-icon-navy.svg` | Primary app icon / favicon source |
| `theatrelog-icon-white/amber/monochrome.svg` | Alternate icon variants |

Run `npm run icons` to regenerate PNG icons from `brand/theatrelog-icon-navy.svg`.

## Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6.3, Tailwind CSS 4
- **State:** Zustand (global + persist), Dexie/IndexedDB (local persistence)
- **Backend:** Firebase Auth + Firestore (cloud sync)
- **PWA:** vite-plugin-pwa with Workbox, auto-update service worker
- **Testing:** Vitest + Testing Library (unit/integration), Playwright (E2E), Lighthouse CI
- **CI/CD:** GitHub Actions → Firebase Hosting (staging + production)

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript compile + Vite production build
npm run lint         # ESLint
npm run test         # Vitest unit & integration tests (run mode)
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with v8 coverage
npm run test:e2e     # Playwright E2E tests (all projects)
npm run test:e2e:ui  # Playwright interactive UI mode
npm run preview      # Preview production build locally
npm run size         # Check bundle size limits
npm run analyze      # Build with bundle visualizer (sets ANALYZE=true)
npm run lhci         # Run Lighthouse CI
```

## Project Structure

```
src/
├── pages/              # Route pages: Dashboard, LogOperation, EditOperation,
│                       #   Portfolio, SettingsPage, Login, PrivacyPolicy, TermsOfService
├── components/
│   ├── layout/         # AppShell (auth wrapper + header), BottomNav
│   ├── operations/     # OperationCard, OperationForm, OperationList, ProcedurePicker, FormBuilder
│   ├── portfolio/      # PortfolioSummary
│   ├── settings/       # ProcedureTypeManager
│   └── common/         # OfflineIndicator
├── hooks/              # useAuth, useOperations, usePortfolio, useProcedureTypes, useSync
├── stores/             # useSettingsStore (Zustand persist store for specialty, grade, theme)
├── context/            # SyncContext (syncing state for UI indicators)
├── firebase/           # config.ts, auth.ts, firestore.ts
├── db/                 # dexie.ts (IndexedDB schema, 2 versions)
├── types/              # TypeScript interfaces
├── data/               # procedures.ts (187 default surgical procedures), formSchemas.ts (Zod),
│                       #   hospitals.ts (UK NHS hospitals list), grades.ts (UK trainee grades)
├── utils/              # excel.ts (import/export), export.ts (JSON export)
├── lib/                # cn() utility (clsx + tailwind-merge)
├── test/               # setup.ts, factories.ts, render-with-providers.tsx, mocks/ (Firebase mocks)
└── assets/             # Static images
e2e/                    # Playwright E2E tests
.github/workflows/      # CI/CD pipelines
```

## Architecture

### Data Flow

```
User action → React component → useOperations hook → Dexie (IndexedDB)
                                                         ↕ (useSync hook)
                                                      Firestore
```

- **Local-first:** All reads/writes go to Dexie. Firestore syncs in background.
- **Pre-login data:** Operations logged before sign-in use `userId: "local-user"`. On sign-in, `useSync` migrates them to the real UID.
- **Soft deletes:** `deleted: boolean` flag + `deletedAt: string | null` timestamp on operations. Never hard-deleted locally; Firestore TTL policy purges 30 days after `deletedAt`.
- **Last-write-wins:** Sync conflicts resolved by `updatedAt` timestamp.

### Database Schema (Dexie)

**operations** — `id` (PK), indexes: `userId`, `date`, `*procedures` (multi-valued), `involvement`, `deleted`, `updatedAt`

**procedureTypes** — `id` (PK), indexes: `specialty`, `category`, `isCustom`

### Key Types

```typescript
type InvolvementLevel = "assistant" | "supervised" | "independent";

interface OperationEntry {
  id: string;
  userId: string;
  date: string;
  hospital: string;
  grade: string;
  patientId: string;
  chemotherapy: string;
  diagnosis: string;
  procedures: string[];
  involvement: InvolvementLevel;
  otherDetails: string;
  intraOpComplications: string;
  postOpComplications: string;
  histology: string;
  followUp: boolean;
  complexityScore: number | null;
  pci: number | null;
  discussedMDT: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt: string | null;
}

interface ProcedureType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  specialty: string;
  isCustom: boolean;
}

interface ConsentRecord {
  userId: string;
  consentGiven: boolean;
  consentTimestamp: string;
  privacyPolicyVersion: string;
}

type ThemePreference = 'system' | 'light' | 'dark'; // local-only, not synced to Firestore

interface UserSettings {
  specialty: string | null;
  hospital: string | null;
  grade: string | null;
}

interface PortfolioRow {
  procedureId: string;
  procedure: string;
  category: string;
  subcategory?: string;
  specialty: string;
  total: number;
  assistant: number;
  supervised: number;
  independent: number;
}
```

### Routing

```
/login    → Login (public)
/privacy  → Privacy Policy (public)
/terms    → Terms of Service (public)
/         → Dashboard (protected)
/log      → LogOperation form
/edit/:id → EditOperation form
/portfolio → Portfolio summary
/settings → Settings & data management
```

All authenticated routes wrapped in `AppShell` (header + BottomNav).

### Custom Hooks

| Hook                       | Purpose                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `useAuth()`                | Firebase auth state: `{ user, loading, isConfigured }`                                      |
| `useOperations()`          | Dexie CRUD for operations: `{ operations, addOperation, updateOperation, deleteOperation }` |
| `usePortfolio(ops, procs)` | Memoized aggregation of operations into PortfolioRow[]                                      |
| `useProcedureTypes()`      | Merges 187 defaults with custom types. Supports hiding defaults via `__hidden__` prefix     |
| `useSync(user)`            | Bidirectional Dexie ↔ Firestore sync with Dexie hooks and Firestore real-time listeners     |

### Stores

**`stores/useSettingsStore.ts`** — Zustand store with `persist` middleware. Stores `specialty`, `grade`, and `theme` (`ThemePreference`) in localStorage (`theatrelog-settings`). `specialty`/`grade` synced to Firestore via `useSync`; `theme` is local-only (device preference).

### Firebase Modules

- **auth.ts** — `signInEmail()`, `signUpEmail()`, `signInGoogle()`, `signOut()`, `deleteAccount()` (purges all Firestore data before deleting auth account), `onAuthChange()`
- **firestore.ts** — push/subscribe/sync for operations, procedureTypes, and user settings; `migrateLocalOps()` for pre-login data; `saveConsentRecord()` (GDPR consent tracking); `purgeAllUserData()` (GDPR right to erasure)

### GDPR & Compliance

- Consent recorded in Firestore (`consentTimestamp`, `privacyPolicyVersion`) on first sign-up
- `purgeAllUserData()` deletes all operations, custom procedure types, settings, and consent records
- `deleteAccount()` calls `purgeAllUserData()` before removing the Firebase Auth account
- `/privacy` and `/terms` pages are publicly accessible (no auth required)

## Deployment Pipeline

### Environments

| Environment | Branch       | Firebase Target   | URL                     |
| ----------- | ------------ | ----------------- | ----------------------- |
| Staging     | `main`       | `britops-staging` | britops-staging.web.app |
| Production  | `production` | `britops-1f219`   | britops-1f219.web.app   |

### Flow

```
Feature branch → PR to main → CI runs (lint, build, unit tests, e2e tests, size, lighthouse)
                             → Preview channel deployed (unique URL on PR comment)
Merge to main              → Auto-deploy to staging
Merge main → production    → Deploy to production (requires GitHub environment approval)
```

### GitHub Actions Workflows

| Workflow                | Trigger                             | Jobs                                                                        |
| ----------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `ci.yml`                | Push to main/production, PR to main | lint-and-build (+ size check), unit-and-integration-tests, e2e-tests, lighthouse |
| `deploy-staging.yml`    | CI passes on main                   | Build with STAGING secrets → Firebase deploy                                |
| `deploy-production.yml` | CI passes on production             | Build with PROD secrets → Firebase deploy (environment gate)                |
| `preview.yml`           | CI passes on PR                     | Build → Firebase preview channel                                            |

### Required GitHub Secrets

`FIREBASE_SERVICE_ACCOUNT_BRITOPS_1F219`, `STAGING_FIREBASE_API_KEY`, `STAGING_FIREBASE_AUTH_DOMAIN`, `STAGING_FIREBASE_PROJECT_ID`, `STAGING_FIREBASE_STORAGE_BUCKET`, `STAGING_FIREBASE_MESSAGING_SENDER_ID`, `STAGING_FIREBASE_APP_ID`, and `PROD_*` equivalents.

### Local Pre-Push Hook

Husky runs `npm run lint`, `npm run build`, and `npm test` before every `git push`. Bypass with `--no-verify`.

## Testing Strategy

### Unit & Integration (Vitest)

- Environment: happy-dom + fake-indexeddb
- Coverage thresholds: 60% statements, branches, functions, lines
- Mocks: Firebase auth/firestore in `src/test/mocks/`
- Factories: `src/test/factories.ts` for test data
- Setup: `src/test/setup.ts` (auto-loaded)
- Helper: `src/test/render-with-providers.tsx`

### E2E (Playwright)

- Projects: Chromium (desktop), WebKit (iPhone 13)
- Auto-starts dev server on port 5173
- Retries: 2 on CI, 0 locally
- Test files: `e2e/*.spec.ts` (auth, dashboard, log-operation, offline, portfolio)

## Environment Variables

All prefixed with `VITE_` (baked into client bundle at build time via `import.meta.env`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Note:** These are not secret — they're visible in the client JS bundle. Security relies on Firestore Security Rules and Firebase Auth, not key secrecy.

## Code Conventions

- Strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- ESLint with `react-hooks` and `react-refresh` rules
- Tailwind utility classes with `cn()` helper (clsx + tailwind-merge)
- Form validation via Zod schemas in `src/data/formSchemas.ts` + react-hook-form
- Vite code splitting: separate chunks for `firebase`, `xlsx`, and `vendor` (React/Router/Dexie/Zustand)
- PWA: `index.html`, `sw.js`, `manifest.webmanifest` always served with `no-cache`; hashed assets with `immutable` cache
