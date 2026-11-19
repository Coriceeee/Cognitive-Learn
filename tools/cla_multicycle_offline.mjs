/** Synthetic longitudinal reproducibility fixture. No Firestore, no learners, no real claims. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle } from '../src/lib/closedLoopJourney.ts';
import { auditJourneyHistory, replayJourneyHistory } from '../src/lib/journeyMultiCycleTrend.ts';
import { validateSyntheticFixture } from './cla_golden_path_offline.mjs';
import { cp31ReleaseSourceSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const { fingerprint } = createRequire(import.meta.url)('./cp31_release_fingerprint.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixturePaths=['research/golden_path/fixture_SYNTHETIC.v1.json', 'research/golden_path/fixture_SYNTHETIC_cycle2.v1.json'];
export const DEFAULT_OUTPUT=path.join(root,'reports/evidence/cla_multicycle_SYNTHETIC.json');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x);
const ensure=(ok,msg)=>{if(!ok)throw new Error(msg)};
function cycleFromFixture(fixture){
  validateSyntheticFixture(fixture);
  let cycle=createJourneyCycle(fixture.cycle);
  for(const check of fixture.checkIns) cycle=appendJourneyCheckIn(cycle,check);
  return reassessJourneyCycle(cycle,fixture.reassessment);
}
export function generateSyntheticMultiCycle(fixtureStrings, sourceFingerprint=cp31ReleaseSourceSha256){
  ensure(Array.isArray(fixtureStrings) && fixtureStrings.length===2, 'Need exactly two synthetic fixtures');
  const fixtures=fixtureStrings.map(f=>JSON.parse(f));
  const cycles=fixtures.map(cycleFromFixture);
  const history=auditJourneyHistory([...cycles].reverse()); // Deliberately unordered as the UI query is newest-first.
  ensure(history.status==='MULTI_CYCLE_DESCRIPTIVE' &&
    history.subjectTrends.some(s=>s.key==='math' && s.points.length===3 && s.points[0].score===0),
    'Synthetic multi-cycle time/score continuity failed');
  ensure(replayJourneyHistory(cycles, history),'History is not deterministically reproducible');
  ensure(history.causalEffect===null && history.forecastError===null && history.crossCycleAverageChange===null,
    'Unsupported empirical claim');
  const payload={schema:'cla.multicycle.synthetic-replay.v1',dataScope:'SYNTHETIC_ONLY',
    scientificStatus:'TECHNICAL_REPLAY_ONLY',empiricalClaimEligible:false,
    verifiedLearnerIdentity:false,measurementEquivalenceVerified:false,
    fixtureSha256s:fixtureStrings.map(hash),sourceFingerprint,history};
  return {envelopeSchema:'cla.multicycle.local-integrity.v1',payloadSha256:hash(json(payload)),payload};
}
export function verifySyntheticMultiCycle(report, rawFixtures, sourceFingerprint=cp31ReleaseSourceSha256){
  if(!report || typeof report!=='object' || Array.isArray(report))return false;
  try{return json(report)===json(generateSyntheticMultiCycle(rawFixtures,sourceFingerprint));}
  catch{return false;}
}
function main(){
  const [mode,file,...additional]=process.argv.slice(2);
  ensure(['--generate','--verify'].includes(mode)&&additional.length===0, 'Usage: ... --generate|--verify [report.json]');
  ensure(fingerprint(root).sha256===cp31ReleaseSourceSha256,'Source fingerprint drift');
  const rawFixtures=fixturePaths.map(rel=>fs.readFileSync(path.join(root,rel),'utf8'));
  const dest=file?path.resolve(file):DEFAULT_OUTPUT;
  if(mode==='--generate'){
    const envelope=generateSyntheticMultiCycle(rawFixtures);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,JSON.stringify(envelope,null,2)+'\n',{flag:'w',mode:0o600});
    console.log(`MULTICYCLE_SYNTHETIC_GENERATED: ${dest}; 2 reviewed cycles; 0 empirical claims`);
  }else{
    ensure(verifySyntheticMultiCycle(JSON.parse(fs.readFileSync(dest,'utf8')),rawFixtures),'Multi-cycle mismatch or manipulated evidence');
    console.log('MULTICYCLE_SYNTHETIC_VERIFY_PASS: deterministic local replay; NO empirical/production claim');
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main()}catch(error){console.error('MULTICYCLE_SYNTHETIC_FAIL:',error.message);process.exitCode=1;}
}
