# CP93: deploy only dedicated Gemini Functions then Hosting; never Rules/Auth.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
function Run($Step, [string[]]$Params) {
  Write-Host "== $Step =="
  & firebase @Params
  if ($LASTEXITCODE -ne 0) { throw "$Step FAIL; no next step executed." }
}
if (-not (Test-Path '.\functions-gemini\dist\chat.mjs')) { throw 'Run BUILD_CLA_CP93_FIREBASE_GEMINI.cmd first.' }
if (-not (Test-Path '.\dist\index.html')) { throw 'Missing frontend dist.' }
node tools\claFirebaseGeminiGate.cjs
if ($LASTEXITCODE -ne 0) { throw 'Config gate failed.' }
Write-Host 'Deployment will modify: Functions codebase cla-gemini, then Hosting site cognitive-learn-ai.'
Write-Host 'It WILL NOT deploy Firestore Rules, Auth, admin, privacy, or push functions.'
$answer = Read-Host 'Type DEPLOY-GEMINI-CP93 to continue'
if ($answer -cne 'DEPLOY-GEMINI-CP93') { throw 'Cancelled.' }
Run 'Deploy Gemini Cloud Functions (isolated codebase)' @('deploy','--only','functions:cla-gemini','--config','firebase.gemini.json','--project','cognitive-learn-ai')
Write-Host 'Function has been deployed. Firebase Hosting rewrite is not active until the next step.'
$answer2 = Read-Host 'After Functions deploy, type HOSTING-CP93 to publish Hosting rewrites + new frontend'
if ($answer2 -cne 'HOSTING-CP93') { throw 'Hosting cancelled. Function is deployed, site unchanged.' }
Run 'Deploy Firebase Hosting ONLY' @('deploy','--only','hosting','--project','cognitive-learn-ai')
Write-Host '== Verify both production Gemini status endpoints =='
& node tools\verify-cp93-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Production Gemini smoke check failed. Hosting deploy ran, but Gemini is NOT ready.' }
Write-Host 'Gemini status is configured on both Hosting domains. Test authenticated LUMEN/Gemini with a student account.'
