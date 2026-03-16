# Data Breach Response Plan — BritOps

**Document version:** 1.0
**Date:** 16 March 2026
**Regulation:** UK GDPR Article 33-34

---

## 1. What Constitutes a Breach

A personal data breach is a security incident leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data. For BritOps, this includes:

- Firestore Security Rules misconfiguration allowing cross-user data access
- Unauthorised access to the Firebase project or service account
- XSS or other vulnerability exploited to exfiltrate patient data
- Accidental public exposure of Firestore data
- Compromise of Firebase Auth credentials enabling account takeover

---

## 2. Breach Detection

Potential breach indicators:
- User reports seeing another user's data
- Unexpected Firestore Security Rules changes
- Firebase Auth anomalies (mass sign-ins, credential stuffing alerts)
- CSP violation reports indicating injection attempts
- Google Cloud audit log anomalies

---

## 3. Response Timeline

| Action | Deadline | Responsible |
|--------|----------|-------------|
| Detect and classify breach | Immediate | Developer |
| Contain the breach (e.g., fix rules, revoke access) | Within 4 hours | Developer |
| Assess risk to data subjects | Within 24 hours | Developer |
| Notify ICO (if required) | Within 72 hours of awareness | Developer |
| Notify affected users (if high risk) | Without undue delay after ICO | Developer |
| Post-incident review | Within 2 weeks | Developer |

---

## 4. ICO Notification

Notification to the ICO is required unless the breach is unlikely to result in a risk to rights and freedoms of individuals.

**Notification is likely required if:**
- Patient identifiers (hospital numbers) + clinical data (diagnoses, complications) were exposed
- Multiple users' data was affected
- Data was accessed by malicious actors

**Notification may not be required if:**
- Only pseudonymised identifiers were exposed without clinical context
- Breach was contained before any data was actually accessed
- Only the affected user's own data was involved (e.g., accidental self-exposure)

**ICO notification portal:** https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/

**Information to include:**
- Nature of the breach
- Categories and approximate number of data subjects
- Categories and approximate number of records
- Likely consequences
- Measures taken or proposed to address the breach

---

## 5. User Notification

If the breach poses a high risk to affected individuals, they must be notified directly. The notification should include:

- Plain-language description of what happened
- What data was affected
- What the developer has done to address the breach
- What the user should do (e.g., change password, review their data)
- Contact details for questions

**Communication channel:** Email to registered users, plus in-app notification if possible.

---

## 6. Breach Record

All breaches (including those not reported to the ICO) must be documented with:
- Date and time of detection
- Nature of the breach
- Data and data subjects affected
- Assessment of risk
- Actions taken
- ICO notification decision and rationale

This record is maintained in the project's incident log.

---

## 7. Post-Incident Actions

1. Update the Hazard Log with any new hazards identified
2. Review and update Firestore Security Rules
3. Review and update the DPIA if processing risks have changed
4. Implement additional technical controls as needed
5. Update this response plan based on lessons learned
