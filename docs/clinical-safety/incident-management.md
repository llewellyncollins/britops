# Incident Management Process — BritOps

**Document version:** 1.0
**Date:** 16 March 2026
**Standard:** DCB0129

---

## 1. Scope

This document describes the process for managing clinical safety incidents related to BritOps. A clinical safety incident is any event where the system may have contributed to, or had the potential to contribute to, patient harm or data breach.

---

## 2. Reporting an Incident

Users or anyone who identifies a potential clinical safety issue should report it via:

1. **GitHub Issues** — create an issue with the label `clinical-safety`
2. **Email** — contact the developer at [developer email — to be completed]

Reports should include:
- Description of what happened
- Date and time of the incident
- Impact (actual or potential)
- Steps to reproduce (if applicable)
- Screenshots or error messages (if available)

---

## 3. Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Patient data confirmed exposed to unauthorised parties | Immediate (within 4 hours) |
| High | System vulnerability identified that could lead to data exposure | Within 24 hours |
| Medium | Data integrity issue (lost or corrupted records) | Within 72 hours |
| Low | Minor issue with no patient safety impact | Next scheduled release |

---

## 4. Investigation Process

1. **Triage** — Classify severity and assign to the Clinical Safety Officer (developer)
2. **Containment** — Take immediate action to prevent further harm (e.g., disable affected feature, rotate credentials)
3. **Investigation** — Determine root cause through code review, log analysis, and reproduction
4. **Resolution** — Implement fix following the standard change control process
5. **Review** — Update the Hazard Log with new hazard or revised risk assessment
6. **Communication** — Notify affected users if personal data was compromised

---

## 5. Data Breach Escalation

If an incident involves confirmed or suspected personal data breach:
- Follow the Data Breach Response Plan (`docs/gdpr/data-breach-response.md`)
- ICO notification required within 72 hours if risk to data subjects
- Affected users must be notified without undue delay if high risk

---

## 6. Post-Incident Review

After resolution of any Medium or higher severity incident:
- Document lessons learned
- Update the Hazard Log
- Review and update Safety Requirements if needed
- Consider whether the Clinical Safety Case Report needs revision
