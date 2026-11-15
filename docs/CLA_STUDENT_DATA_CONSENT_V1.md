# CLA Student Data Consent V1 — Product scope, not research consent

**Policy version**: `cla-student-privacy-v1` · **Status**: CANDIDATE, not approved for real-student rollout.

## Product decision
A student may accept or withdraw permission for CLA to write new student-profile, transcript, private draft, technical-evidence, and shared-report records. The decision is stored under `student_consents/{uid}` with an authenticated UID, version, `productAccepted`, `researchConsent: false`, and a server timestamp. No DOB, guardian name, signature, diagnostic score or detailed profile is stored in this record.

This decision is *not* parental/guardian consent. CLA has no validated process to verify parent identity, relationship, authority or assent, and does not currently enroll any student in research through this screen. For minors, additional approval and independent ethics/privacy review are still necessary before collecting research data or claiming compliance.

## User rights and limitations
- Students may view the statement, decline, accept, or withdraw. The account owner retains the ability to read their existing saved documents after withdrawal; the candidate Rules block new student academic writes.
- Existing documents, backups and shared data are **not automatically deleted**. Export, deletion and retention SOPs must be implemented and evaluated separately.
- Candidate Rules are **not** deployed automatically. The browser alone is not a sufficient security enforcement layer.
- Before enabling the gate for real users, check which Rules are deployed in the actual Firebase project, test authorization with local Emulator, review open server APIs, and provide a guardian-verification workflow where applicable.

## Current UX activation
`VITE_CLA_STUDENT_CONSENT_GATE` defaults to OFF. Until the complete Rules are validated and deployed, `/student/consent` is an informative preview, and existing routes are not blocked. Set the flag to `true` **only** in an appropriately configured staging environment with matching Rules to exercise acceptance/withdrawal. This is deliberate fail-safe deployment, not a claim of completed P0.

## Enforcement contract (Rules candidate only)
- Only active student role may read/update their own consent record; cannot list consent records or write other users' decisions.
- Schema keys, notice version, `request.time` and `researchConsent: false` are constrained.
- Student writes to academic profile, transcript, drafts, evidence, and shares require active product consent; Admin's own demo scope is unchanged.
- Withdrawal stops teacher/parent access to existing linked reports via candidate Rules, while student can still read and revoke their own shares.
- Rules still need Emulator verification; do not deploy if tests fail.
