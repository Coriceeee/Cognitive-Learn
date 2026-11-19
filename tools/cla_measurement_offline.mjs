/** CP31 B13 — synthetic assessment metadata replay. No network, no Firebase. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle} from '../src/lib/closedLoopJourney.ts';
import {auditJourneyMeasurements, replayJourneyMeasurements} from '../src/lib/journeyMeasurementAudit.ts';
import {validateSyntheticFixture} from './cla_golden_path_offline.mjs';
import {cp31ReleaseSourceSha256} from '../src/lib/nexusEvidenceBaseline.ts';
const {fingerprint}=createRequire(import.meta.url)('./cp31_release_fingerprint.cjs');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const relativeFixtures=['research/golden_path/fixture_SYNTHETIC.v1.json',
  'research/golden_path/fixture_SYNTHETIC_cycle2.v1.json',
  'research/golden_path/measurement_declarations_SYNTHETIC.v1.json'];
const SHA=x=>crypto.createHash('sha256').update(x).digest('hex');
const j=x=>JSON.stringify(x);
const ensure=(test,msg)=>{if(!test)throw new Error(msg)};
export const DEFAULT_OUTPUT=path.join(ROOT,'reports/evidence/cla_measurement_SYNTHETIC.json');
const load=()=>relativeFixtures.map(p=>fs.readFileSync(path.join(ROOT,p),'utf8'));
const reviewed=fixture=>{
  validateSyntheticFixture(fixture);
  let c=createJourneyCycle(fixture.cycle);
  for(const check of fixture.checkIns) c=appendJourneyCheckIn(c,check);
  return reassessJourneyCycle(c,fixture.reassessment);
};
export function generateSyntheticMeasurement(raws, sourceFingerprint=cp31ReleaseSourceSha256){
  ensure(Array.isArray(raws)&&raws.length===3,'Expected two synthetic cycles and one independent synthetic manifest');
  const [first,second,decl]=raws.map(s=>JSON.parse(s));
  const cycles=[reviewed(first),reviewed(second)].reverse();
  const report=auditJourneyMeasurements(cycles,decl);
  ensure(report.status==='DECLARED_ALIGNED_ONLY'&&report.declaredAlignedSubjects.length===2,
    'Measurement declarations did not align (descriptive only)');
  ensure(replayJourneyMeasurements(cycles,decl,report),'Could not replay measurement declaration audit');
  ensure(report.measurementEquivalenceVerified===false&&report.reliabilityValidated===false&&
    report.causalEffect===null&&report.forecastError===null,'False research claim');
  const payload={schema:'cla.measurement.synthetic-replay.v1',dataScope:'SYNTHETIC_ONLY',
    scientificStatus:'DECLARED_METADATA_ONLY_NOT_VALIDATED',empiricalClaimEligible:false,
    measurementEquivalenceVerified:false,reliabilityValidated:false,
    sourceFingerprint,fixtureSha256s:raws.map(SHA),measurementAudit:report};
  return {envelopeSchema:'cla.measurement.local-integrity.v1', payloadSha256:SHA(j(payload)),payload};
}
export const verifySyntheticMeasurement=(report,raws,sourceFingerprint=cp31ReleaseSourceSha256)=>{
  try{return j(report)===j(generateSyntheticMeasurement(raws,sourceFingerprint));}catch{return false;}
};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [mode,file,...extra]=process.argv.slice(2);
    ensure((mode==='--generate'||mode==='--verify')&&extra.length===0,'Usage: --generate|--verify [path.json]');
    ensure(fingerprint(ROOT).sha256===cp31ReleaseSourceSha256,'Source fingerprint drift');
    const raws=load(), destination=file?path.resolve(file):DEFAULT_OUTPUT;
    if(mode==='--generate'){
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.writeFileSync(destination,j(generateSyntheticMeasurement(raws))+'\n',{flag:'w',mode:0o600});
      console.log('MEASUREMENT_SYNTHETIC_GENERATED:',destination,'(no verified measurement claims)');
    }else{
      ensure(verifySyntheticMeasurement(JSON.parse(fs.readFileSync(destination,'utf8')),raws),
        'Measurement evidence modified, stale or invalid');
      console.log('MEASUREMENT_SYNTHETIC_VERIFY_PASS: deterministic local replay, NOT scientific validation');
    }
  }catch(err){console.error('MEASUREMENT_SYNTHETIC_FAIL:',err.message);process.exitCode=1;}
}
