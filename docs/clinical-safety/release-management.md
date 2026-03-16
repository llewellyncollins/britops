# Release Management — BritOps

**Document version:** 1.0
**Date:** 16 March 2026
**Standard:** DCB0129

---

## Change Control Process

All changes to BritOps follow a controlled CI/CD pipeline:

### 1. Development
- Changes are made on feature branches
- Code is authored with strict TypeScript checking enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)

### 2. Pull Request
- All changes require a Pull Request to the `main` branch
- PR triggers automated CI pipeline (see below)
- Preview deployment is created with a unique URL for manual verification

### 3. Automated CI Pipeline (`ci.yml`)
On every push to `main`/`production` and every PR:
1. **Lint** — ESLint with React-specific rules
2. **Build** — TypeScript compilation + Vite production build
3. **Unit & Integration Tests** — Vitest with happy-dom and fake-indexeddb
4. **E2E Tests** — Playwright on Chromium (desktop) and WebKit (iPhone 13)

All steps must pass before merge is allowed.

### 4. Staging Deployment
- Merge to `main` triggers automatic deployment to staging (`britops-staging.web.app`)
- Staging has `X-Robots-Tag: noindex` to prevent search engine indexing
- CSP is deployed in report-only mode for monitoring

### 5. Production Deployment
- Merge from `main` to `production` branch triggers production deployment
- Requires **GitHub environment approval** before deployment proceeds
- Deploys to `britops-1f219.web.app`

### 6. Pre-Push Safety
- Husky pre-push hook runs lint, build, and tests before any push
- Prevents broken code from reaching the remote repository

---

## Version Tracking

- Application version is tracked in `package.json`
- Each deployment corresponds to a specific git commit hash
- GitHub Actions run IDs provide audit trail for all deployments

---

## Rollback Procedure

1. Identify the last known good commit on the `production` branch
2. Create a revert PR or reset to the known good commit
3. Follow the standard deployment pipeline
4. Firebase Hosting retains previous deployment versions for instant rollback via Firebase Console

---

## Clinical Safety Review Triggers

The following changes require review against the Hazard Log before deployment:
- Changes to authentication or authorisation logic
- Changes to data sync or conflict resolution
- Changes to Firestore Security Rules
- Changes to data export functionality
- Addition of new data fields or collections
- Changes to third-party dependencies handling user data
