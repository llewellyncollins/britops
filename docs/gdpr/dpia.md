# Data Protection Impact Assessment (DPIA) — Theatrelog

**Document version:** 1.0
**Date:** 16 March 2026
**Regulation:** UK GDPR / Data Protection Act 2018, Article 35

---

## 1. Description of Processing

### What data is processed?
- **User account data:** email address
- **Operation records:** date, patient hospital number, diagnosis, procedures performed, involvement level, intra-operative complications, post-operative complications, histology, follow-up status, complexity score, PCI score, MDT discussion status, free-text notes
- **Preferences:** medical specialty
- **Custom procedure types:** procedure name, category, subcategory, specialty

### Who are the data subjects?
- **Primary:** Patients (pseudonymised — identified by hospital number only)
- **Secondary:** The doctor using the app (email address, specialty)

### Purpose of processing
To maintain a personal surgical operation logbook for the doctor's professional development and ARCP portfolio evidence.

### Lawful basis
Legitimate interests of the data controller (the doctor) for professional development (Article 6(1)(f)). For special category health data (Article 9), processing is necessary for reasons of substantial public interest in the area of public health and healthcare quality (Article 9(2)(i), Schedule 1 Part 1 paragraph 2 of the DPA 2018).

### Data controller
Each individual doctor using Theatrelog acts as the data controller for the patient data they enter. The developer provides the tool (data processor role for cloud-stored data).

### Data processor
Google Cloud (Firebase) acts as data processor for cloud-synced data. Google's Data Processing Agreement applies.

---

## 2. Necessity and Proportionality

| Data Field | Necessity | Justification |
|------------|-----------|---------------|
| Patient hospital number | Required | Deduplication — prevents double-counting the same patient's procedure |
| Date | Required | Temporal record of experience progression |
| Diagnosis | Required | ARCP portfolio requires diagnosis-procedure correlation |
| Procedures | Required | Core purpose — recording operative experience |
| Involvement level | Required | ARCP requires distinction between assisted/supervised/independent |
| Complications | Required | Portfolio evidence of complication awareness and management |
| Histology | Optional | Relevant for specific specialties (e.g., surgical oncology) |
| Follow-up | Optional | Relevant for continuity of care documentation |
| Complexity score / PCI | Optional | Specialty-specific metrics for portfolio |
| Notes | Optional | Free-text for additional context |

**Data minimisation assessment:** All required fields serve a specific ARCP portfolio purpose. Optional fields are only shown when relevant to the user's specialty. Patient data is pseudonymised (hospital number only — no name, NHS number, date of birth, or address).

---

## 3. Risks to Data Subjects

| Risk | Likelihood | Severity | Overall |
|------|-----------|----------|---------|
| Unauthorised access to patient data via Firestore | Unlikely (with security rules) | Significant | Medium |
| Data breach through XSS attack | Unlikely (with CSP) | Significant | Medium |
| Device theft exposing local data | Possible | Moderate | Medium |
| Data loss preventing ARCP submission | Unlikely | Minor | Low |
| Unnecessary data retention | Unlikely (with retention policy) | Minor | Low |

---

## 4. Measures to Address Risks

### Technical measures
1. **Firestore Security Rules** — enforce per-user data isolation; no cross-user access
2. **Content Security Policy** — prevents XSS and inline script injection
3. **Encryption in transit** — all communication over TLS (HTTPS)
4. **Encryption at rest** — Firebase uses AES-256 for Firestore data
5. **Security headers** — X-Frame-Options: DENY, X-Content-Type-Options: nosniff, strict Referrer-Policy, restrictive Permissions-Policy
6. **No analytics or tracking** — no third-party data collection
7. **Pseudonymisation** — patient data uses hospital numbers only

### Data lifecycle measures
1. **Soft delete** — immediate removal from UI when user deletes an operation
2. **Hard delete** — automatic permanent deletion 30 days after soft delete
3. **Account deletion** — immediate purge of all cloud data, local data, and auth account
4. **Data export** — Excel, CSV, and JSON export for portability

### Organisational measures
1. **Terms of Service** — inform users of their responsibilities regarding patient data
2. **Privacy Policy** — transparent description of data processing
3. **Consent capture** — explicit consent at registration with timestamp
4. **Device security guidance** — users informed they are responsible for device-level security

---

## 5. Consultation

Given the low-risk profile (personal tool, pseudonymised data, no NHS system integration), formal consultation with the ICO is not required. However, this DPIA will be reviewed annually or when significant changes are made to data processing.

---

## 6. Conclusion

The processing is **necessary and proportionate** for the stated purpose. Identified risks have been mitigated to acceptable levels through technical and organisational measures. The residual risk to data subjects is **low**.

**DPIA outcome:** Processing may proceed.

**Review date:** March 2027 (or earlier if processing changes significantly)
