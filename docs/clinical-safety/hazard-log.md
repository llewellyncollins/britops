# Hazard Log — Theatrelog

**Document version:** 1.0
**Date:** 16 March 2026
**Standard:** DCB0129

---

## Risk Matrix

**Severity levels:** Catastrophic (5) > Major (4) > Significant (3) > Minor (2) > Negligible (1)
**Likelihood levels:** Certain (5) > Probable (4) > Possible (3) > Unlikely (2) > Remote (1)
**Risk = Severity x Likelihood**

| Risk Score | Level |
|------------|-------|
| 1–4 | Very Low (acceptable) |
| 5–9 | Low (acceptable with monitoring) |
| 10–14 | Medium (mitigations required) |
| 15–19 | High (mitigations essential) |
| 20–25 | Very High (unacceptable) |

---

## Hazard Register

### H1: Incorrect operation data recorded

| Field | Value |
|-------|-------|
| **ID** | H1 |
| **Hazard** | Incorrect operation data recorded in logbook |
| **Cause** | User data entry error (typo, wrong field selection) |
| **Effect** | Inaccurate procedure count in ARCP portfolio; potential misrepresentation of experience |
| **Severity** | 2 (Minor) |
| **Likelihood** | 3 (Possible) |
| **Initial Risk** | 6 (Low) |
| **Mitigation** | Edit functionality allows correction at any time; user reviews data before export |
| **Residual Risk** | 6 (Low) |
| **Status** | Open — monitoring |

---

### H2: Data loss (operations disappear)

| Field | Value |
|-------|-------|
| **ID** | H2 |
| **Hazard** | Operation records lost or become inaccessible |
| **Cause** | IndexedDB corruption, browser data clearing, sync failure, device loss |
| **Effect** | Missing records in ARCP portfolio; need to re-enter data |
| **Severity** | 2 (Minor) |
| **Likelihood** | 2 (Unlikely) |
| **Initial Risk** | 4 (Very Low) |
| **Mitigation** | Dual storage (local IndexedDB + cloud Firestore); export to Excel/CSV/JSON; data syncs across devices when signed in |
| **Residual Risk** | 4 (Very Low) |
| **Status** | Open — monitoring |

---

### H3: Patient data exposed to unauthorised person

| Field | Value |
|-------|-------|
| **ID** | H3 |
| **Hazard** | Patient identifiers, diagnoses, or complication details accessed by unauthorised party |
| **Cause** | Missing/misconfigured Firestore security rules; XSS vulnerability; device theft; shared computer |
| **Effect** | Patient privacy breach; potential regulatory action under UK GDPR |
| **Severity** | 3 (Significant) |
| **Likelihood** | 3 (Possible) |
| **Initial Risk** | 9 (Medium) — **mitigations required** |
| **Mitigations** | 1. Firestore Security Rules enforce per-user data isolation |
| | 2. Content Security Policy prevents XSS/inline script injection |
| | 3. X-Frame-Options: DENY prevents clickjacking |
| | 4. Data encrypted in transit (TLS) and at rest (AES-256 by Firebase) |
| | 5. Patient data pseudonymised (hospital number only, not name/NHS number/DOB) |
| | 6. Device-level security is user's responsibility (documented in Terms of Service) |
| **Residual Severity** | 3 (Significant) |
| **Residual Likelihood** | 2 (Unlikely) |
| **Residual Risk** | 6 (Low) |
| **Status** | Mitigated |

---

### H4: Sync conflict causes data overwrite

| Field | Value |
|-------|-------|
| **ID** | H4 |
| **Hazard** | Correct operation data overwritten by stale data during sync |
| **Cause** | Simultaneous edits from multiple devices; last-write-wins conflict resolution |
| **Effect** | Loss of recent edits; need to re-enter corrected data |
| **Severity** | 2 (Minor) |
| **Likelihood** | 2 (Unlikely) |
| **Initial Risk** | 4 (Very Low) |
| **Mitigation** | Single-user app reduces concurrent edit likelihood; `updatedAt` timestamp-based conflict resolution; users can re-edit at any time |
| **Residual Risk** | 4 (Very Low) |
| **Status** | Open — monitoring |

---

### H5: Offline operation logged with wrong date

| Field | Value |
|-------|-------|
| **ID** | H5 |
| **Hazard** | Operation recorded with incorrect date when offline |
| **Cause** | No network time validation; device clock drift |
| **Effect** | Incorrect temporal record in ARCP portfolio |
| **Severity** | 1 (Negligible) |
| **Likelihood** | 2 (Unlikely) |
| **Initial Risk** | 2 (Very Low) |
| **Mitigation** | Date field defaults to today's date; user can correct date at any time via edit |
| **Residual Risk** | 2 (Very Low) |
| **Status** | Accepted |

---

### H6: Exported data used for clinical decisions

| Field | Value |
|-------|-------|
| **ID** | H6 |
| **Hazard** | Doctor makes clinical decisions based on aggregated logbook statistics |
| **Cause** | Misuse of portfolio summary data (e.g., procedure volume statistics) |
| **Effect** | Inappropriate clinical action based on incomplete or inaccurate aggregate data |
| **Severity** | 2 (Minor) |
| **Likelihood** | 1 (Remote) |
| **Initial Risk** | 2 (Very Low) |
| **Mitigation** | Terms of Service explicitly state the app is a logbook, not a clinical decision support system; clinical disclaimer displayed |
| **Residual Risk** | 2 (Very Low) |
| **Status** | Accepted |

---

## Summary

| Hazard | Initial Risk | Residual Risk | Status |
|--------|-------------|---------------|--------|
| H1 — Incorrect data | Low (6) | Low (6) | Monitoring |
| H2 — Data loss | Very Low (4) | Very Low (4) | Monitoring |
| H3 — Data exposure | Medium (9) | Low (6) | Mitigated |
| H4 — Sync conflict | Very Low (4) | Very Low (4) | Monitoring |
| H5 — Wrong date | Very Low (2) | Very Low (2) | Accepted |
| H6 — Clinical misuse | Very Low (2) | Very Low (2) | Accepted |

**No residual risks at Medium or above.** All hazards are at acceptable risk levels.
