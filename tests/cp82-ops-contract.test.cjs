const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('CP82 Firebase gate uses no shell:true and never invokes production deploy',()=>{
 const code=read('tools/firestoreSecurityGate.cjs');
 assert.match(code,/shell:\s*false/);
 assert.doesNotMatch(code,/shell:\s*true|firebase deploy|deploy --only/);
 assert.match(code,/'--project', PROJECT_ID/);
 assert.match(code,/stagedRoot = createAsciiEmulatorStage/);
});
test('CP82 keeps old CP31 release fingerprint untouched',()=>{
 const base=read('src/lib/nexusEvidenceBaseline.ts');
 assert.match(base,/cp31ReleaseSourceSha256/);
 const current=read('tools/cla_cp82_synthetic_replay.mjs');
 assert.match(current,/CP82_CURRENT_TREE_NOT_CP31_HISTORICAL_RELEASE/);
 assert.match(current,/empiricalClaimEligible:false/);
});
test('CP82 research preflight is separate from research validation',()=>{
 const code=read('tools/cla_cp82_ml_preflight.py');
 assert.match(code,/OS_POLICY_BLOCKED/);
 assert.match(code,/subprocess\.run/);
 assert.match(code,/scientificClaimVerified/);
});
test('CP82 acceptance script never deploys and runs full regression first',()=>{
 const code=read('CLA_CP82_ONECLICK.ps1');
 assert.match(code,/npm_test_full/);
 assert.match(code,/rules_emulator/);
 assert.doesNotMatch(code,/vercel\s+deploy|firebase\s+deploy/);
});
