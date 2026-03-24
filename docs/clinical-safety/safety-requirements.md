# Safety Requirements Traceability — Theatrelog

**Document version:** 1.0
**Date:** 16 March 2026
**Standard:** DCB0129

---

## Requirements Traceability Matrix

| Req ID | From Hazard | Requirement | Implementation | File(s) | Test Evidence |
|--------|-------------|-------------|----------------|---------|---------------|
| SR1 | H3 | User data must be isolated per account — no user may read or write another user's data | Firestore Security Rules enforce `userId == request.auth.uid` on all collections | `firestore.rules` | Firestore rules unit tests |
| SR2 | H2 | Data must be recoverable — users must be able to export all their data | Export to Excel (.xlsx), CSV, and JSON formats | `src/utils/excel.ts`, `src/utils/export.ts` | E2E export tests |
| SR3 | H1 | Users must be able to correct records — all operation fields must be editable | Edit operation page allows modification of all fields | `src/pages/EditOperation.tsx` | E2E edit operation test |
| SR4 | H3 | Cross-site scripting must be prevented — Content Security Policy must restrict script sources | CSP header set in Firebase hosting configuration | `firebase.json` | Browser console verification (no CSP violations) |
| SR5 | H3 | Users must be able to delete all personal data — account deletion must remove data from all storage locations | Delete account function purges Firestore, IndexedDB, and localStorage before removing Firebase Auth account | `src/firebase/auth.ts`, `src/firebase/firestore.ts` | E2E account deletion test |
| SR6 | H2 | Data must persist across sessions — offline-first storage must survive browser restarts | Dexie (IndexedDB) used as primary storage; Firestore syncs in background | `src/db/dexie.ts`, `src/hooks/useSync.ts` | E2E offline test |
| SR7 | H3 | Clickjacking must be prevented | X-Frame-Options: DENY header set | `firebase.json` | Header inspection |
| SR8 | H6 | Users must be informed the app is not for clinical decisions | Terms of Service contain clinical disclaimer | `src/pages/TermsOfService.tsx` | Page renders with disclaimer text |
