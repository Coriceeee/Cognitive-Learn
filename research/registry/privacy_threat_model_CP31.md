# CLA Privacy & Threat Model — CP31 draft

**Status:** design review draft; not a production security certification.

| Asset | Threat | Control in design/source | Evidence still required |
|---|---|---|---|
| Student profile/transcript | Cross-UID read/write | UID ownership checks and candidate Firestore Rules | Firebase Emulator allow/deny matrix; real-account E2E |
| Teacher/parent view | Unauthorized access to private student data | Explicit student sharing/links and role separation | Consent/withdrawal lifecycle E2E |
| Admin functions | Privilege escalation from client | Admin-only route and trusted backend requirement | Privileged API, MFA, audit log and role-denial tests |
| Gemini requests | Prompt injection, unsupported claims, secret leakage | Backend-mediated requests; evidence-grounding policy | Red-team tests, rate limit, server secret audit |
| Research extracts | Re-identification or unauthorized secondary use | Data minimization, pseudonymization, scope/consent gate | Approved protocol, access log, retention/deletion evidence |
| Public release package | Accidental inclusion of `.env`, `.git`, private keys, raw data | CP30 release excludes `.env`, `.git`, `node_modules`; scan manifest | Git history remediation decision; cloud key restrictions; CI secret scan |
| Firebase client config | API-key misuse/quota abuse | Referrer/API restrictions should be applied in Cloud Console | Console verification and quota/rules review |

## Historical audit note

The older `CLA(9).zip` contains `.env` in Git history and a Firebase Web API key in the historical client config/build. This is not a service-account private key, but the key should be restricted to the intended APIs and web referrers, and quota monitored. The old archive must not be redistributed. The current CP30 package scan found no `.env`, `.git`, `node_modules`, private-key pattern or common private-token pattern.

## Residual risks

- Firestore Emulator and production rules have not been proven equivalent at CP31.
- No staging/production smoke or backup/restore drill has been verified.
- Human-subject consent, retention, deletion and incident response require project-owner approval.
