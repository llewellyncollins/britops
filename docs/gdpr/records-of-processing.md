# Records of Processing Activities — Theatrelog

**Document version:** 1.0
**Date:** 16 March 2026
**Regulation:** UK GDPR Article 30

---

## Processing Activity: Personal Surgical Operation Logbook

| Field | Details |
|-------|---------|
| **Controller** | Each individual doctor using Theatrelog (personal use) |
| **Developer/Processor** | Theatrelog developer — provides the application and cloud infrastructure |
| **Sub-processor** | Google Cloud (Firebase) — authentication, data storage, hosting |
| **Purpose** | Recording surgical operative experience for ARCP portfolio and professional development |
| **Lawful basis** | Legitimate interests (Article 6(1)(f)); substantial public interest for health data (Article 9(2)(i)) |
| **Categories of data subjects** | Patients (pseudonymised), doctors (registered users) |
| **Categories of personal data** | Patient hospital number, diagnosis, procedures, complications, histology, follow-up notes; doctor's email address and specialty preference |
| **Special category data** | Yes — health data (Article 9) |
| **Recipients** | Google Cloud (Firebase) as data processor; no other third-party recipients |
| **International transfers** | Data stored in Google Cloud infrastructure; Google's Standard Contractual Clauses and Data Processing Agreement apply |
| **Retention period** | Active data: retained while account exists; soft-deleted data: permanently purged after 30 days; account deletion: immediate permanent removal |
| **Technical security measures** | TLS encryption in transit, AES-256 encryption at rest (Firebase), Firestore Security Rules for access control, Content Security Policy, X-Frame-Options, authentication via Firebase Auth |
| **Organisational security measures** | Privacy Policy, Terms of Service, consent capture at registration, clinical safety documentation (DCB0129) |

---

## Data Flow Summary

```
User enters operation data
    ↓
Stored in browser IndexedDB (Dexie) — local device
    ↓ (if signed in)
Synced to Google Cloud Firestore — encrypted at rest
    ↓ (on user request)
Exported to Excel/CSV/JSON — downloaded to user's device
```

---

## Data Subject Rights Implementation

| Right | Implementation | Location |
|-------|----------------|----------|
| Access (Art. 15) | Export all data as JSON | Settings > Export All My Data |
| Rectification (Art. 16) | Edit any operation record | Edit operation page |
| Erasure (Art. 17) | Delete individual operations or entire account | Settings > Danger Zone |
| Portability (Art. 20) | Export as JSON, CSV, or Excel | Settings > Export |
| Restriction (Art. 18) | Sign out to stop cloud sync; data remains local only | Settings > Account |
| Object (Art. 21) | Delete account removes all processing | Settings > Danger Zone |
