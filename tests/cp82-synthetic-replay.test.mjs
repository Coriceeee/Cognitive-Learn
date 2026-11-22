import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generate, verify} from '../tools/cla_cp82_synthetic_replay.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raws=[
 'research/golden_path/fixture_SYNTHETIC.v1.json',
 'research/golden_path/fixture_SYNTHETIC_cycle2.v1.json',
 'research/golden_path/measurement_declarations_SYNTHETIC.v1.json',
].map(rel=>fs.readFileSync(path.join(root,rel),'utf8'));
const fingerprint='a'.repeat(64);
test('CP82 replay combines three real-domain-engine synthetic reports',()=>{
 const r=generate(raws,fingerprint);
 assert.equal(r.payload.dataScope,'SYNTHETIC_ONLY');
 assert.equal(r.payload.empiricalClaimEligible,false);
 assert.equal(r.payload.causalEffectVerified,false);
 assert.equal(r.payload.psychometricValidationVerified,false);
 assert.equal(r.payload.forecastAccuracyVerified,false);
 assert.equal(r.payload.productionDeploymentVerified,false);
 assert.equal(r.payload.legacyCp31EvidenceModified,false);
 assert.ok(verify(r,raws,fingerprint));
});
test('CP82 replay is reproducible byte for byte',()=>{
 assert.deepEqual(generate(raws,fingerprint),generate(raws,fingerprint));
});
test('CP82 replay rejects changed engine output and forged causal claim',()=>{
 const r=generate(raws,fingerprint);
 r.payload.stages.golden.payload.replay.stages=[];
 assert.equal(verify(r,raws,fingerprint),false);
 const q=generate(raws,fingerprint);q.payload.causalEffectVerified=true;
 assert.equal(verify(q,raws,fingerprint),false);
});
test('CP82 replay refuses any changed source fingerprint or fixture',()=>{
 const r=generate(raws,fingerprint);
 assert.equal(verify(r,raws,'b'.repeat(64)),false);
 assert.equal(verify(r,[raws[0]+' ',...raws.slice(1)],fingerprint),false);
});
