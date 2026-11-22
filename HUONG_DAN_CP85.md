# CLA CP85 — Firestore Rules expression-budget candidate (22/11/2026)

**Status:** experimental optimization, **not** certified Firestore security PASS.

## Evidence from CP84 Windows runtime

- The Firestore Emulator actually ran **99** authorization tests: **98 PASS, 1 FAIL**.
- The single failing test is `J21 adaptive lineage accepted only with current reviewed source and remains immutable`.
- The emulator reported `maximum of 1000 expressions to evaluate has been reached` during the atomic two-document creation of the next adaptive cycle.
- This is not the earlier Windows CLI `unknown option --test` issue.

## Change

`firestore.rules.CANDIDATE_CP21` is the only security-rule file changed. `validJourneyRecord` is invoked only by `allow create` for a cycle. Its repeated validations of status, empty check-ins, null reassessment, null evidence and `keys().hasAll` were removed to reduce rule expression evaluation. All of those create-only conditions remain enforced by the adjacent `allow create` rule; a list-type check was added explicitly for `checkIns`. Owner+consent, immutable T0, bounds of every subject, adaptive lineage validation and atomic mutex still remain intact. The existing J01-J23 positive/negative tests have **not** been modified.

Important: A static regression suite and SHA-256 only prove the intended source was installed. CP85 still MUST run every Firestore emulator authorization test before the Rules can be considered correct; changes to the candidate must NOT be deployed.

## Install CP85 overlay after CP84 in `C:\Gạo\Cognitive-Learn`

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
$zip=Join-Path $env:USERPROFILE 'Downloads\CLA_CP85_HOTFIX_OVERLAY_20261122.zip'
if (-not (Test-Path -LiteralPath $zip)) { throw 'ZIP CP85 chua co trong Downloads' }
$backup=Join-Path $env:USERPROFILE ('CLA_BEFORE_CP85_'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item -LiteralPath '.\firestore.rules.CANDIDATE_CP21' -Destination (Join-Path $backup 'firestore.rules.CANDIDATE_CP21')
Expand-Archive -LiteralPath $zip -DestinationPath (Get-Location).Path -Force
node tools/verify-cp85-snapshot.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP85 SOURCE FAIL' }
node --test tests/cp85-firestore-expression-budget.test.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP85 STATIC FAIL' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { Get-Content '.\reports\security\firestore_emulator_gate.log' -Tail 65; throw 'EMULATOR FAIL - do not deploy' }
.\CHAY_NGHIEM_THU_CP85.cmd
```

## Safety

No changes to Firestore production Rules, `.env.local`, authentication configuration, personal data, six student modules, ML/LLM/XAI/Adaptive logic, or historical CP31 proof. No LMM. All tests are on fixed demo project, loopback Firestore Emulator only. The security gate must fail closed on regression.
