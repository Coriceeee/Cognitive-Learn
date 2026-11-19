/** Local release evidence collector. Does not deploy, access Firestore, or contact an LLM.
 * All gates attempted independently; a nonzero exit is never interpreted as PASS. */
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cp36=process.argv.includes('--cp36');
const out=path.join(root,'reports','verification',cp36?'cp36_local':'cp35_local');
const {fingerprint}=createRequire(import.meta.url)('./cp31_release_fingerprint.cjs');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const py=process.env.CLA_PYTHON || 'python';
const specs=[
 ['demo-final',npm,['run','demo:final']], // refresh source-bound synthetic reports before regression
 ['atlas-retrieval',npm,['run','research:atlas:lookup']],
 ['knowledge-retrieval',npm,['run','research:cla:knowledge']],
 ['node-regression',npm,['test']],
 ['rules-static',npm,['run','test:rules:static']],
 ['layout',npm,['run','check:layout']],
 ['cognitive',py,['-m','unittest','discover','-s','research/cognitive_validation/tests','-v']],
 ['adaptive',py,['-m','unittest','discover','-s','research/adaptive_study/tests','-v']],
 ['uci-ml',py,['-m','unittest','research.tests.test_uci_baseline','research.tests.test_uci_fetch_gate','research.tests.test_uci_ml_comparison','-v']],
];
if(process.argv.includes('--build'))specs.push(['build',npm,['run','build']]);
mkdirSync(out,{recursive:true});
const source=fingerprint(root), rows=[];
for(const [name,command,args] of specs){
 // .cmd invocation needs a shell on Windows. Only fixed npm script arguments.
 const start=Date.now();
 const result=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:300000,maxBuffer:16*1024*1024,shell:process.platform==='win32'&&command===npm,env:{...process.env,CI:'1'}});
 const log=`${result.stdout??''}\n${result.stderr??''}`;
 // These are local source tests; never collect Gemini tokens, browser or runtime student logs.
 writeFileSync(path.join(out,name+'.log'),log,{mode:0o600});
 const status=result.error?'BLOCKED':result.status===0?'PASS':'FAIL';
 rows.push({id:name,status,exitCode:result.status,durationMs:Date.now()-start,log:`${name}.log`,error:result.error?.code??null});
 console.log(`[${status}] ${name}`);
}
const end=fingerprint(root);
const stable=source.sha256===end.sha256;
const report={schema:cp36?'cla.cp36.local-release.v1':'cla.cp35.local-release.v1',scope:'LOCAL_TECHNICAL_ONLY',source,sourceUnchangedDuringRun:stable,generatedAt:new Date().toISOString(),gates:rows,localStatus:stable&&rows.every(r=>r.status==='PASS')?'LOCAL_PASS':'LOCAL_NOT_ALL_PASS',productionAcceptance:'NOT_EVALUATED',externalGates:{firebaseEmulator:'NOT_RUN',browserE2E:'NOT_RUN',productionDeployment:'NOT_RUN',realMl:'NOT_RUN',liveLlm:'NOT_RUN',psychometrics:'NOT_EVALUABLE_BY_LOCAL_GATE',adaptiveEffectiveness:'NOT_EVALUABLE_BY_LOCAL_GATE'},reviewerAccepted:false};
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(report.localStatus);if(report.localStatus!=='LOCAL_PASS')process.exitCode=1;
