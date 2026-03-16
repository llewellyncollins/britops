# Clinical Safety Case Report — BritOps

**Document version:** 1.0
**Date:** 16 March 2026
**Clinical Safety Officer:** [Developer name — to be completed]
**Standard:** DCB0129 — Clinical Risk Management: its Application in the Manufacture of Health IT Systems

---

## 1. System Description

BritOps is a Progressive Web Application (PWA) that provides UK surgical trainees with a personal operation logbook for recording their operative experience. It is designed to support ARCP (Annual Review of Competence Progression) portfolio preparation.

**Key characteristics:**
- Personal single-user tool (not a shared clinical record system)
- Offline-first architecture with optional cloud sync via Firebase
- Does not provide clinical decision support
- Does not interface with NHS clinical systems (PAS, EPR, etc.)
- Does not modify patient treatment or care pathways

**Users:** UK doctors in surgical training programmes

**Data processed:** Operation date, patient hospital number (pseudonymised identifier), diagnosis, procedures performed, involvement level, complications, histology, follow-up status, and free-text notes.

---

## 2. Clinical Context

BritOps serves exclusively as a record-keeping tool for professional development. It replaces paper-based logbooks and spreadsheets that trainees use to track surgical experience.

**The app does NOT:**
- Make or suggest clinical decisions
- Provide alerts, reminders, or clinical prompts
- Interface with patient records or clinical systems
- Transmit data to hospitals, trusts, or regulatory bodies
- Act as a medical device under MHRA definitions

**Clinical risk profile:** Low. The primary risk relates to data accuracy and data security, not clinical safety.

---

## 3. Hazard Identification Summary

See the accompanying [Hazard Log](./hazard-log.md) for full details.

Six hazards were identified through systematic analysis:

| ID | Hazard | Risk Level |
|----|--------|------------|
| H1 | Incorrect operation data recorded | Low |
| H2 | Data loss (operations disappear) | Low |
| H3 | Patient data exposed to unauthorised person | Medium |
| H4 | Sync conflict causes data overwrite | Low |
| H5 | Offline operation logged with wrong date | Very Low |
| H6 | Exported data used for clinical decisions | Very Low |

---

## 4. Safety Requirements Summary

See [Safety Requirements](./safety-requirements.md) for full traceability.

| Req | Description | Status |
|-----|-------------|--------|
| SR1 | User data must be isolated per account | Implemented (Firestore Security Rules) |
| SR2 | Data must be recoverable via export | Implemented (Excel/CSV/JSON export) |
| SR3 | Users must be able to edit records | Implemented (Edit operation page) |
| SR4 | XSS prevention via Content Security Policy | Implemented (CSP headers) |
| SR5 | Users must be able to delete all their data | Implemented (Account deletion) |

---

## 5. Residual Risk Assessment

After implementation of all safety requirements and mitigations:

- **H3 (data exposure)** is reduced from Medium to Low through Firestore Security Rules, CSP headers, and security headers (X-Frame-Options, X-Content-Type-Options)
- All other hazards remain at their initial Low/Very Low levels with existing mitigations adequate

**Overall residual risk: ACCEPTABLE**

The system presents no unmitigated hazards at Significant or higher severity.

---

## 6. Testing Evidence

- Firestore Security Rules enforce per-user data isolation
- Content Security Policy prevents inline script injection
- Security headers prevent clickjacking and MIME-type attacks
- Unit and integration tests run via Vitest on every commit
- E2E tests run via Playwright on every CI pipeline
- Production deployment requires GitHub environment approval

---

## 7. Conclusion

BritOps is assessed as **safe for its intended use** as a personal surgical operation logbook. The system's clinical risk profile is low, with the highest identified risk (patient data exposure) mitigated through appropriate technical controls. The system does not make clinical decisions and is not classified as a medical device.

This safety case should be reviewed:
- Annually, or
- When significant changes are made to data handling, authentication, or sync mechanisms, or
- If a clinical safety incident is reported
