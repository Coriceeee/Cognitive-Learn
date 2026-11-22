#!/usr/bin/env node
/**
 * CP82: CURRENT-SOURCE, SYNTHETIC-ONLY replay of the three frozen domain engines.
 * This is not the historical CP31 release. DO NOT rewrite CP31 fingerprints.
 * Source hashing and local reproducibility are NOT psychometric validation,
 * forecasting accuracy, causal effectiveness, deployment, or real-student evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createEnvelope, verifyEnvelope} from './cla_golden_path_offline.mjs';
import {generateSyntheticMultiCycle, verifySyntheticMultiCycle} from './cla_multicycle_offline.mjs';
import {generateSyntheticMeasurement, verifySyntheticMeasurement} from './cla_measurement_offline.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {fingerprint}=createRequire(import.meta.url)('./cp31_release_fingerprint.cjs');
const FIXTURES=[
  'research/golden_path/fixture_SYNTHETIC.v1.json',
  'research/golden_path/fixture_SYNTHETIC_cycle2.v1.json',
  'research/golden_path/measurement_declarations_SYNTHETIC.v1.json',
];
const out=path.join(root,'reports/evidence/cla_cp82_SYNTHETIC_LOCAL_REPLAY.json');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const encode=obj=>JSON.stringify(obj);
const load=()=>FIXTURES.map(rel=>fs.readFileSync(path.join(root,rel),'utf8'));
const isHex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function generate(raws,source){
  if(!Array.isArray(raws)||raws.length!==3||!isHex(source))throw Error('Invalid CP82 synthetic inputs');
  const golden=createEnvelope(raws[0],source);
  const multi=generateSyntheticMultiCycle(raws.slice(0,2),source);
  const measurement=generateSyntheticMeasurement(raws,source);
  const body={
    schema:'cla.cp82.current-source.synthetic-local-replay.v1',
    sourceScope:'CP82_CURRENT_TREE_NOT_CP31_HISTORICAL_RELEASE',
    sourceFingerprintSha256:source,
    fixtureSha256s:raws.map(sha),
    dataScope:'SYNTHETIC_ONLY',
    verificationScope:'DETERMINISTIC_LOCAL_ENGINE_REPLAY_ONLY',
    empiricalClaimEligible:false,
    psychometricValidationVerified:false,
    forecastAccuracyVerified:false,
    causalEffectVerified:false,
    productionDeploymentVerified:false,
    datasetsFromRealStudents:false,
    legacyCp31EvidenceModified:false,
    stages:{golden,multi,measurement},
  };
  return {envelopeSchema:'cla.cp82.local-integrity.v1',payloadSha256:sha(encode(body)),payload:body};
}
function verify(report,raws,source){
  if(!report||typeof report!=='object'||!report.payload||!report.payload.stages)return false;
  if(!verifyEnvelope(report.payload.stages.golden,raws[0],source))return false;
  if(!verifySyntheticMultiCycle(report.payload.stages.multi,raws.slice(0,2),source))return false;
  if(!verifySyntheticMeasurement(report.payload.stages.measurement,raws,source))return false;
  return encode(report)===encode(generate(raws,source));
}
function main(args){
  if(args.length>2||!['--generate','--verify'].includes(args[0]))throw Error('Usage: node --experimental-strip-types tools/cla_cp82_synthetic_replay.mjs --generate|--verify [output.json]');
  const current=fingerprint(root);
  const raws=load();
  const dest=args[1]?path.resolve(args[1]):out;
  if(args[0]==='--generate'){
    // Output is not a privileged ledger. Never allow the caller to overwrite source code.
    if(!dest.endsWith('.json')||dest===path.join(root,'CP81_SOURCE_MANIFEST.json'))throw Error('Output must be a separate JSON report');
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,JSON.stringify(generate(raws,current.sha256),null,2)+'\n',{mode:0o600});
    console.log(`CP82 SYNTHETIC GENERATED: ${dest}; tracked source files=${current.fileCount}. NO scientific/production claims.`);
  }else{
    const report=JSON.parse(fs.readFileSync(dest,'utf8'));
    if(!verify(report,raws,current.sha256))throw Error('CP82 replay mismatch, fixture/source changed, or report modified');
    console.log('CP82 SYNTHETIC VERIFY PASS: 3 source-bound local replays; 0 empirical or production claims.');
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main(process.argv.slice(2))}catch(error){console.error('CP82 SYNTHETIC FAIL:',error.message);process.exitCode=1;}
}
export {generate,verify,main};
