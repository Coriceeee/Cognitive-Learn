import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditAtlasApprovals, auditOrionPolicy, auditOrionScenarios, auditPulseEvidence, auditPulseTrends, auditHavenFinance } from '../src/lib/nexusGovernanceAudits.ts';
const hash='a'.repeat(64);
const atlas={schema:'cla.nexus.atlas-approval.v1',entries:[{id:'ptit-2026',year:2026,sourceUrl:'https://tuyensinh.ptit.edu.vn',retrievedAt:'2026-11-15',contentSha256:hash,policyVersion:'approve-v1',state:'approved',review:{reviewerId:'qa-editor',at:'2026-11-14'},approval:{reviewerId:'qa-reviewer',at:'2026-11-15'}}]};
const policy={schema:'cla.nexus.orion-policy.v1',policy:{id:'shadow-1',version:'v1',codeVersion:'git-test',mode:'shadow',trigger:{metric:'SCI',threshold:5,minObservations:2},dose:{hoursPerWeek:3,maxWeeks:8},stopRule:{criterion:'overload',threshold:7},humanReview:{required:true,reviewerRole:'teacher'}}};
const scenarios={schema:'cla.nexus.orion-scenarios.v1',scenarios:[{id:'balanced',policyVersion:'v1',engineVersion:'1.0',baseline:5,prediction:6,horizonWeeks:8,isSimulation:true,observedOutcome:null},{id:'focus',policyVersion:'v1',engineVersion:'1.0',baseline:5,prediction:6.4,horizonWeeks:8,isSimulation:true,observedOutcome:null}]};
const pulse={schema:'cla.nexus.pulse-evidence.v1',records:[{resultId:'r-1',inputSnapshotId:'snapshot-sha',engine:{name:'Orion',version:'v1'},datasetVersion:'demo',featureVersion:'v1',modelVersion:'heuristic-v1',recordedDay:'2026-11-15',evidenceRefs:['local-aggregate'],limitations:['No validated clinical or educational outcome'],output:{value:6,probability:null,unit:'0-10'},uncertainty:{type:'not_estimated',value:null}}]};
const trend={schema:'cla.nexus.pulse-trends.v1',series:[{metric:'math',scale:'0-10',samples:[{timepoint:'T0',value:0,observedDay:'2026-09-01',provenance:'student_self_report'},{timepoint:'T1',value:6,observedDay:'2026-10-01',provenance:'student_self_report'},{timepoint:'T2',value:7,observedDay:'2026-11-01',provenance:'student_self_report'}]}]};
const finance={schema:'cla.nexus.haven-finance.v1',estimates:[{id:'qa-study',currency:'SGD',tuition:18000,living:12000,travel:0,fxToVnd:19000,period:'year',scholarship:null,tuitionSourceUrl:'https://example.edu/tuition',tuitionSourceDay:'2026-11-01',fxSourceUrl:'https://example.gov/exchange',fxSourceDay:'2026-11-15'}]};
const kind=(rows,label)=>rows.find(x=>x.name===label)?.status;
const all=[['atlas',auditAtlasApprovals,atlas],['policy',auditOrionPolicy,policy],['scenario',auditOrionScenarios,scenarios],['evidence',auditPulseEvidence,pulse],['trends',auditPulseTrends,trend],['finance',auditHavenFinance,finance]];
for(const [name,fn,valid] of all){
 test(`${name}: no file is NOT TESTED, never implicit PASS`,()=>assert.equal(fn(null)[0].status,'NOT TESTED'));
 test(`${name}: wrong schema fails closed`,()=>assert.equal(fn({...valid,schema:'other'})[0].status,'FAIL'));
 test(`${name}: valid metadata retains unverified scope`,()=>{const rows=fn(valid);assert.ok(rows.some(x=>x.status==='PASS'||x.status==='WARN'));assert.equal(rows.at(-1).status,'NOT TESTED');});
}
test('Atlas: forged same reviewer, malformed URL, impossible date fail',()=>{
 const bad={...atlas,entries:[{...atlas.entries[0],review:{reviewerId:'same',at:'2026-11-15'},approval:{reviewerId:'same',at:'2026-11-15'},sourceUrl:'http://localhost',retrievedAt:'2026-02-30'}]};
 const rows=auditAtlasApprovals(bad); assert.equal(kind(rows,'Nguồn và phiên bản Atlas'),'FAIL');assert.equal(kind(rows,'Tách người rà soát và duyệt'),'FAIL');
});
test('Atlas: repeat IDs fail',()=>assert.equal(auditAtlasApprovals({...atlas,entries:[atlas.entries[0],atlas.entries[0]]})[0].status,'FAIL'));
test('Orion: prevents non-shadow automatic assignment',()=>assert.equal(kind(auditOrionPolicy({...policy,policy:{...policy.policy,mode:'live'}}),'Phiên bản và chế độ thử nghiệm'),'FAIL'));
test('Orion: missing stop rule or human review fails',()=>assert.equal(kind(auditOrionPolicy({...policy,policy:{...policy.policy,humanReview:{required:false,reviewerRole:'teacher'}}}),'Stop rule và giám sát con người'),'FAIL'));
test('Scenario: outcome masquerading as simulation is denied',()=>assert.equal(kind(auditOrionScenarios({...scenarios,scenarios:scenarios.scenarios.map((s,i)=>i?{...s,observedOutcome:8}:s)}),'Replay các kịch bản mô phỏng'),'FAIL'));
test('Scenario: mismatch policy versions cannot be directly compared',()=>assert.equal(kind(auditOrionScenarios({...scenarios,scenarios:scenarios.scenarios.map((s,i)=>i?{...s,policyVersion:'v2'}:s)}),'Điều kiện so sánh công bằng'),'WARN'));
test('Pulse record: invented probability or confidence is rejected',()=>assert.equal(kind(auditPulseEvidence({...pulse,records:[{...pulse.records[0],output:{value:5,probability:0.9,unit:'0-10'}}]}),'Giới hạn dự báo và bất định'),'FAIL'));
test('Pulse record: missing snapshot denied',()=>assert.equal(kind(auditPulseEvidence({...pulse,records:[{...pulse.records[0],inputSnapshotId:''}]}),'Dòng nguồn gốc và snapshot'),'FAIL'));
test('Pulse trend: genuine zero is valid',()=>assert.equal(kind(auditPulseTrends(trend),'Dữ liệu T0/T1/T2 cùng thang đo'),'PASS'));
test('Pulse trend: missing T1 cannot claim improvement',()=>assert.equal(kind(auditPulseTrends({...trend,series:[{...trend.series[0],samples:[trend.series[0].samples[0],trend.series[0].samples[2]]}]}),'Dữ liệu T0/T1/T2 cùng thang đo'),'WARN'));
test('Pulse trend: impossible date and swapped T1/T2 warn',()=>assert.equal(kind(auditPulseTrends({...trend,series:[{...trend.series[0],samples:[trend.series[0].samples[0],{...trend.series[0].samples[1],observedDay:'2026-12-01'},trend.series[0].samples[2]]}]}),'Dữ liệu T0/T1/T2 cùng thang đo'),'WARN'));
test('Haven: zero travel cost allowed but no verified finance claim',()=>assert.equal(kind(auditHavenFinance(finance),'Giá trị và kỳ dự toán'),'PASS'));
test('Haven: negative cost or invalid scholarship source fail',()=>{
 const rows=auditHavenFinance({...finance,estimates:[{...finance.estimates[0],tuition:-1,fxSourceUrl:'javascript:alert(1)'}]});
 assert.equal(kind(rows,'Giá trị và kỳ dự toán'),'FAIL');assert.equal(kind(rows,'Nguồn học phí và tỷ giá'),'FAIL');
});
test('Catalog/manifest/UI map six distinct limited views and no privileged writes',()=>{
 const manifest=JSON.parse(fs.readFileSync('tests/e2e/cp31_nexus_manifest.json','utf8'));
 const items=manifest.groups.flatMap(x=>x.tasks);
 assert.equal(items.length,22);assert.equal(items.filter(x=>x.status==='limited'&&x.diagnostic).length,22);
 const ui=fs.readFileSync('src/page/nexus/AdminDiagnosticsPage.tsx','utf8');
 const catalog=fs.readFileSync('src/data/adminConsoleDirectory.ts','utf8');
 for(const id of ['atlas-approve','orion-policy','orion-scenarios','pulse-evidence','pulse-trends','haven-finance']){
  assert.ok(ui.includes(`"${id}": { title:`));assert.ok(ui.includes(`view === "${id}"`));
  assert.ok(catalog.includes(`href: "/admin/diagnostics?view=${id}", status: "limited"`));
 }
 assert.match(ui,/account\?\.role !== "admin" \|\| account\.active !== true/);
 assert.match(ui,/if \(!stillCurrent\(\)\) return/);
 assert.doesNotMatch(ui,/setDoc\(|updateDoc\(|deleteDoc\(|writeBatch\(/);
});

test('Synthetic example flag cannot be imported as validated evidence',()=>{for(const [_,fn,valid] of all){const rows=fn({...valid,syntheticExampleOnly:true});assert.deepEqual(rows.map(x=>x.status),['NOT TESTED']);}});
