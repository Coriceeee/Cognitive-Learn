# Orion drafts — Firestore Production 403 fix

## What the captured request proves

The browser attempted the **first create** of:

`orion_drafts/{authenticated UID}`

The payload already matches the application's versioned draft contract:
- `userId` equals the document ID / authenticated UID
- `schemaVersion = 1`
- `revision = 1`
- `data` is a map containing the Orion inputs
- `updatedAt` is a Firestore server timestamp

The request reports `currentDocument.exists: false`, so this is not a stale-revision update. The 403 is an authorization denial.

## Why a code-only deploy cannot fix this

The current `firebase.json` config deploys **Hosting only** and does not point to a production Firestore Rules file. The repository's `firestore.rules.CANDIDATE_CP21` is a candidate and must not be deployed wholesale: other sections of that candidate have outstanding emulator failures. The draft-specific policy is already owner-scoped and consent-gated, but the production Rules need the matching rule to be published.

## Safe, narrow production patch

1. Open Firebase Console → project **cognitive-learn-ai** → Firestore Database → Rules.
2. Find the existing `match /databases/{database}/documents` block.
3. Search for `match /orion_drafts/{uid}`. If it exists, replace only that block. If it does not exist, add the fragment below inside the documents match, before its closing brace.
4. Add the helper functions from `firestore.rules.orion-drafts.patch` at the same documents-match level.
5. Review that there is no broad wildcard rule granting public writes. Firestore overlapping `allow` statements are ORed; a narrow block cannot cancel an existing broad grant.
6. Publish the Rules. Do not replace the full Rules file with the patch fragment.

The patch grants:
- owner-only reads to an active student/admin;
- student create/update only when the same UID has an accepted product-consent record with the current notice version;
- admin writes only to the admin's own demo draft;
- create at revision 1 and updates at exactly previous revision + 1;
- no list and no delete permissions.

It does **not** grant public access, cross-student access, research consent, or delete access.

## Emulator verification

Run the isolated patch test against a local Firestore Emulator:

```powershell
firebase emulators:exec --only firestore --project demo-cla-orion-draft-patch "npm run test:orion-drafts:rules"
```

Do not treat static tests as proof of Production authorization. After publishing, sign in as the affected student and verify that the first Orion save creates `orion_drafts/{UID}`, then a second save advances revision from 1 to 2.

## If the first save is still denied

Verify in Firestore Console (without sharing personal values publicly):
- `users/{UID}`: `active == true`, `role == "student"`;
- `student_consents/{UID}`: `userId == UID`, `productAccepted == true`, `noticeVersion == "cla-student-privacy-v1"`;
- the deployed Rules contain the exact owner-only Orion block.

Do not bypass consent or set `allow read, write: if true`.
