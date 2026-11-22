# START HERE — CP47 Orion Autosave

Base: `Cognitive-Learn-080333b4b7ad7976017ce32e0b0c499d28a76173.zip`.

## What changed

1. Orion now debounces Firestore draft saves by 700 ms after edits, but only after authenticated draft state is `ready` or `empty`.
2. The UI reports autosave progress and failures; manual save remains available.
3. Revision tracking prevents an older save from clearing the dirty state of a newer edit; manual save cancels a pending debounce to avoid duplicate writes.
4. Three unused legacy parent/teacher-sharing components were removed; the app remains student-only.
5. Two duplicate research scripts misplaced in `src/` were removed; their identical canonical copies remain in `research/src/`.
6. Source fingerprint and synthetic demo backup were regenerated after the tracked source changes.

## Verification

- `npm test`: PASS (full package test chain, including CP47).
- `npm run check:layout`: PASS (22 required files; 19 legacy misplacements absent).
- `npm run demo:final`: PASS (11/11 offline technical gates; synthetic backup generate/verify PASS).
- `npm run build`: BLOCKED because `npm ci` timed out twice and the partial dependency tree lacks React and type packages.
- Browser E2E, Firebase Emulator and production deploy: NOT RUN.

## Important

This is a source-level checkpoint, not a production release. The ZIP excludes `.env`; keep local deployment configuration separately. Do not deploy candidate Firestore Rules or overwrite production data from this archive without the normal release gates.

See `BAO_CAO_CP47_ORION_AUTOSAVE_20261121.md` for the detailed handover.
