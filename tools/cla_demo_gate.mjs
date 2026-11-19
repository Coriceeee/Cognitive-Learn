/** CP31 Batch 16 — a single local readiness gate for the 2-day DEMO freeze.
 * This is NOT a production release approval or empirical research validation.
 * No Firebase credentials, deployment, browser automation or real learner data.
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'reports','demo','cla_batch16_offline_readiness.json');
const steps=[
  ['Core closed-loop + measurement regression', 'node',['--experimental-strip-types','--test',
    'tests/cp31-batch8-golden-path.test.mjs','tests/cp31-batch9-evidence-integrity.test.mjs',
    'tests/cp31-batch10-t0-freeze.test.mjs','tests/cp31-batch11-t0-t1-comparison.test.mjs',
    'tests/cp31-batch12-multicycle-trend.test.mjs','tests/cp31-batch13-measurement-audit.test.mjs',
    'tests/cp31-batch14-measurement-persistence.test.mjs','tests/cp31-batch15-snapshot-integrity.test.mjs',
    'tests/cp31-batch16-history-pagination.test.mjs']],
  ['Seed tests','node',['tests/academic.test.cjs']],
  ['Atlas + chatbot tests','node',['--experimental-strip-types','--test','tests/admissions-and-chat.test.mjs']],
  ['Golden Path synthetic generate','node',['--experimental-strip-types','tools/cla_golden_path_offline.mjs','--generate']],
  ['Golden Path synthetic verify','node',['--experimental-strip-types','tools/cla_golden_path_offline.mjs','--verify']],
  ['Multicycle synthetic generate','node',['--experimental-strip-types','tools/cla_multicycle_offline.mjs','--generate']],
  ['Multicycle synthetic verify','node',['--experimental-strip-types','tools/cla_multicycle_offline.mjs','--verify']],
  ['Measurement synthetic generate','node',['--experimental-strip-types','tools/cla_measurement_offline.mjs','--generate']],
  ['Measurement synthetic verify','node',['--experimental-strip-types','tools/cla_measurement_offline.mjs','--verify']],
  ['Layout contract','node',['tools/check-cla-layout.cjs']],
  ['Source fingerprint / release evidence preflight','node',['--experimental-strip-types','tools/cp31_evidence_preflight.mjs']],
];
const results=[];
for(const [label,cmd,args] of steps){
  const start=Date.now();
  const run=spawnSync(cmd,args,{cwd:root,encoding:'utf8',timeout:120_000,maxBuffer:8*1024*1024,env:{...process.env,CI:'1'}});
  const text=(run.stdout||'')+'\n'+(run.stderr||'');
  const status=run.status===0 && !run.error?'PASS':'FAIL';
  results.push({name:label,status,exitCode:run.status,durationMs:Date.now()-start,
    outputTail:text.slice(-1600),failure:run.error?.message||null});
  process.stdout.write(`[${status}] ${label}\n`);
  // A blocked prerequisite must not be labeled PASS by a downstream workflow.
  if(status==='FAIL')break;
}
const report={schema:'cla.demo.offline-readiness.v1',generatedAt:new Date().toISOString(),
  dataScope:'SYNTHETIC_OR_STATIC_ONLY',status:results.length===steps.length && results.every(x=>x.status==='PASS')?'DEMO_OFFLINE_CORE_PASS':'DEMO_OFFLINE_CORE_FAIL',
  gates:results,releaseGates:{productionBuild:'NOT_TESTED_BY_THIS_GATE',firestoreEmulator:'NOT_TESTED_BY_THIS_GATE',
    browserE2E72:'NOT_TESTED_BY_THIS_GATE',empiricalTHPTValidation:'NOT_TESTED_BY_THIS_GATE'},
  limitations:['Synthetic replay does not prove student learning impact.','Source integrity does not attest production deployment.',
    'Offline tests do not validate Firestore permissions or browser behavior.']};
mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600});
process.stdout.write(`${report.status} — ${results.length}/${steps.length} steps; report: ${out}\n`);
if(report.status!=='DEMO_OFFLINE_CORE_PASS')process.exitCode=1;
