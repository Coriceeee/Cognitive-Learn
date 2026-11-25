import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildNationalPathwayCatalogue,matchNationalPathways2026,filterNationalPathways,officialPathwaySchools,safePathwayUrl} from '../src/lib/nationalAdmissionPathways2026.ts';
import {nationalCutoffs} from '../src/lib/nationalAdmissionRegistry.ts';
import {ctuCombinations2026,aguCombinations2026} from '../src/data/publishedAdmissionCombinations2026.ts';
import {hcmusCombinations2026,HCMUS_SCHEME_2026,HCMUS_CUTOFF_2026} from '../src/data/hcmusCombinations2026.ts';
import {hcmusCutoffs2025,HCMUS_CUTOFF_2025} from '../src/data/hcmusCutoffs2025.ts';
import {uitHistoricalCutoffs} from '../src/data/uitHistoricalCutoffs.ts';
import {uitCompositeCutoffs2026,UIT_CUTOFF_2026_SOURCE} from '../src/data/uitCutoffs2026.ts';
import {officialUniversities} from '../src/data/officialAdmissionSources.ts';
const catalogue=buildNationalPathwayCatalogue();
const report=(pair,scores={},target='')=>matchNationalPathways2026(catalogue,pair,scores,target);
test('catalogue spans all current national records without changing cutoff facts',()=>{assert.equal(nationalCutoffs.length,1556);assert.equal(catalogue.length,618);assert.equal(new Set(catalogue.map(p=>p.universityId)).size,20);assert.equal(new Set(catalogue.map(p=>p.id)).size,618);assert.equal(officialPathwaySchools.length,32);assert.equal(catalogue.filter(p=>p.evidence.length).length,412);});
test('CTU and AGU official code additions exactly reconcile with 2026 inventory',()=>{for(const [school,data,len,kind] of [['ctu',ctuCombinations2026,127,'THPT_PUBLISHED'],['agu',aguCombinations2026,43,'COMPOSITE_PUBLISHED']]){const rows=catalogue.filter(p=>p.universityId===school);assert.equal(rows.length,len);assert.deepEqual(rows.map(p=>p.majorCode).sort(),Object.keys(data).sort());for(const p of rows){assert.deepEqual(p.evidence.map(e=>e.code),data[p.majorCode]);assert.ok(p.evidence.every(e=>e.kind===kind));}}});
test('physics English returns multiple schools, not PTIT only',()=>{const r=report(['physics','english']);assert.equal(r.matches.length,288);assert.deepEqual(Object.fromEntries(r.schools.filter(s=>s.matched).map(s=>[s.id,s.matched])),{ctu:98,qnu:37,agu:31,usshhn:29,htu:19,ptit:10,tnue:4,dthu:32,hcmus:28});assert.equal(r.unconfirmedCount,223);});
test('social pair can return entirely non-PTIT schools',()=>{const r=report(['history','geography']);assert.equal(r.matches.length,104);assert.ok(r.matches.every(p=>p.universityId!=='ptit'));assert.equal(r.schools.filter(s=>s.matched).length,8);});
test('no pair or duplicate electives leaves all sourced programmes selectable',()=>{for(const pair of [[],['physics'],['physics','physics'],['math','english']]){const r=report(pair);assert.equal(r.pair,false);assert.equal(r.entries.length,618);assert.ok(r.entries.every(p=>p.status==='NO_PAIR'));assert.equal(filterNationalPathways(r.entries,'','',false).length,618);}});
test('zero is a valid observed score; missing is not',()=>{let r=report(['physics','english'],{math:0,physics:0,english:0});const pick=r.matches.flatMap(p=>p.matches).find(m=>m.code==='A01');assert.equal(pick.observedScore,0);r=report(['physics','english'],{math:8,physics:7});assert.equal(r.matches.flatMap(p=>p.matches).find(m=>m.code==='A01').observedScore,null);});
test('technology streams cannot borrow a generic technology grade',()=>{const r=report(['technologyIndustry','english'],{math:8,english:8,technology:9});const row=r.matches.flatMap(p=>p.matches).find(m=>m.code==='X27');assert.ok(row);assert.equal(row.observedScore,null);});
test('AGU composite and HUST base evidence never become THPT eligibility',()=>{const r=report(['physics','chemistry'],{math:9,physics:9,chemistry:9});assert.ok(r.matches.some(p=>p.universityId==='agu'));assert.ok(r.matches.some(p=>p.universityId==='hust'));assert.ok(r.matches.filter(p=>p.universityId==='agu').flatMap(p=>p.matches).every(m=>m.kind==='COMPOSITE_PUBLISHED'));assert.ok(r.matches.filter(p=>p.universityId==='hust').flatMap(p=>p.matches).every(m=>m.kind==='BASE_COMBINATION'));assert.ok(r.matches.every(p=>!('probability' in p)&&!('eligibility' in p)));});
test('search admits unconfirmed programmes and keeps school identity',()=>{const r=report(['physics','english']);const u=r.entries.find(p=>p.status==='UNCONFIRMED');assert.ok(filterNationalPathways(r.entries,u.majorCode,u.universityId,false).some(p=>p.id===u.id));assert.ok(!filterNationalPathways(r.entries,u.majorCode,u.universityId,true).some(p=>p.id===u.id));assert.ok(catalogue.filter(p=>p.majorCode==='7480201').length>1);assert.ok(filterNationalPathways(r.entries,'CNTT','ctu',false).length>0);});
const uni={id:'example',name:'Trường mẫu',website:'https://example.edu.vn',verified:true};
const source={id:'s',universityId:'example',sourceYear:2026,status:'verified',sourceType:'admission_scheme',sourceUrl:'https://example.edu.vn/admission',updatedAt:'2026-11-18'};
const prog={id:'p',universityId:'example',majorName:'Khoa học',majorCode:'9999999',sourceYear:2026,status:'verified',sourceIds:['s'],methods:['THPT'],combinations:['A01']};
test('reviewed record must have matching school, year, verified source and official host',()=>{const build=(p=prog,s=source,u=uni)=>buildNationalPathwayCatalogue([p],[s],{example:u});assert.equal(build().length,619);for(const s of [{...source,universityId:'wrong'},{...source,sourceYear:2025},{...source,status:'pending'},{...source,sourceType:'manual'},{...source,sourceUrl:'https://evil.example/admission'},{...source,sourceUrl:'https://a:b@example.edu.vn/admission'}])assert.equal(build(prog,s).length,618);assert.equal(build({...prog,sourceYear:2025}).length,618);assert.equal(build(prog,source,{...uni,verified:false}).length,618);});
test('reviewed programme does not invent THPT evidence for other methods',()=>{const p=buildNationalPathwayCatalogue([{...prog,methods:['HOC_BA']}],[source],{example:uni}).find(p=>p.universityId==='example');assert.equal(p.evidence.length,0);assert.equal(p.campus,'Chưa rõ cơ sở');assert.equal(safePathwayUrl('javascript:alert(1)'),null);});

test('HCMUS 2026 programme list and combined-method cutoffs reconcile with official sources',()=>{
 const rows=catalogue.filter(p=>p.universityId==='hcmus');
 assert.equal(Object.keys(hcmusCombinations2026).length,39);
 assert.equal(rows.length,39);
 assert.deepEqual(rows.map(p=>p.majorCode).sort(),Object.keys(hcmusCombinations2026).sort());
 for(const p of rows){
  assert.deepEqual(p.evidence.map(e=>e.code),hcmusCombinations2026[p.majorCode]);
  assert.ok(p.evidence.length>0&&p.evidence.every(e=>e.kind==='COMPOSITE_PUBLISHED'));
  assert.equal(p.sourceUrl,HCMUS_SCHEME_2026);
  assert.match(p.schemeNote,/không phải điểm THPT thô/);
 }
 const ai=rows.find(p=>p.majorCode==='7480107');
 assert.equal(ai?.majorName,'Trí tuệ nhân tạo');
 const cutoff=nationalCutoffs.find(row=>row.universityId==='hcmus'&&row.code==='7480107'&&row.year===2026);
 assert.equal(cutoff?.cutoff,28.68);
 assert.equal(cutoff?.method,'HCMUS_COMPOSITE');
 assert.equal(cutoff?.source,HCMUS_CUTOFF_2026);
 assert.match(cutoff?.note ?? '',/công bố đã gồm điểm cộng và điểm ưu tiên/);
 assert.equal(rows.some(p=>p.evidence.some(e=>e.kind==='THPT_PUBLISHED')),false);
});

test('HCMUS 2025 historical cutoffs preserve method and scale without imputing missing combinations',()=>{
 assert.equal(hcmusCutoffs2025.length,72);
 const thpt=hcmusCutoffs2025.filter(r=>r.method==='HCMUS_2025_THPT_A00');
 const dgnl=hcmusCutoffs2025.filter(r=>r.method==='HCMUS_2025_DGNL');
 const cert=hcmusCutoffs2025.filter(r=>r.method==='HCMUS_2025_CERT_THPT');
 assert.equal(thpt.length,31);assert.equal(dgnl.length,31);assert.equal(cert.length,10);
 assert.ok(thpt.every(r=>r.scale===30&&r.year===2025&&r.source===HCMUS_CUTOFF_2025));
 assert.ok(dgnl.every(r=>r.scale===1200&&r.cutoff<=1200));
 assert.ok(cert.every(r=>r.scale===30));
 const aiThpt=thpt.find(r=>r.code==='7480107'),aiDgnl=dgnl.find(r=>r.code==='7480107');
 assert.equal(aiThpt?.cutoff,29.39);assert.equal(aiDgnl?.cutoff,1092);
 assert.equal(cert.some(r=>r.code==='7480107'),false);
 const tt=cert.find(r=>r.code==='7480101_TT');assert.equal(tt?.cutoff,29.98);
 const school=officialUniversities.find(u=>u.id==='hcmus');
 assert.equal(school?.years.find(y=>y.year===2025)?.cutoffUrl,HCMUS_CUTOFF_2025);
 const history=nationalCutoffs.filter(r=>r.universityId==='hcmus'&&r.code==='7480107');
 assert.deepEqual(history.filter(r=>r.year===2025).map(r=>r.method).sort(),['HCMUS_2025_DGNL','HCMUS_2025_THPT_A00']);
 assert.ok(!history.some(r=>r.year===2025&&r.method==='HCMUS_2025_THPT'));
});

test('UIT 2024-2025 published THPT and DGNL cutoffs retain their exact method scales and programme codes',()=>{
 assert.equal(uitHistoricalCutoffs.length,54);
 const rows=(year,method)=>uitHistoricalCutoffs.filter(r=>r.year===year&&r.method===method);
 assert.equal(rows(2024,'UIT_2024_THPT').length,13);
 assert.equal(rows(2024,'UIT_2024_DGNL').length,13);
 assert.equal(rows(2025,'UIT_2025_THPT').length,14);
 assert.equal(rows(2025,'UIT_2025_DGNL').length,14);
 assert.ok(rows(2024,'UIT_2024_THPT').every(r=>r.scale===30));
 assert.ok(rows(2024,'UIT_2024_DGNL').every(r=>r.scale===1200));
 assert.ok(rows(2025,'UIT_2025_THPT').every(r=>r.scale===30));
 assert.ok(rows(2025,'UIT_2025_DGNL').every(r=>r.scale===1200));
 const ai=(year,method)=>rows(year,method).find(r=>r.code==='7480107')?.cutoff;
 assert.equal(ai(2024,'UIT_2024_THPT'),28.3);
 assert.equal(ai(2024,'UIT_2024_DGNL'),980);
 assert.equal(ai(2025,'UIT_2025_THPT'),29.60);
 assert.equal(ai(2025,'UIT_2025_DGNL'),1098);
 assert.ok(uitHistoricalCutoffs.every(r=>r.source.startsWith('https://tuyensinh.uit.edu.vn/')));
 assert.ok(rows(2025,'UIT_2025_THPT').every(r=>/điểm cộng và điểm ưu tiên/.test(r.note)));
 const school=officialUniversities.find(u=>u.id==='uit');
 assert.equal(school?.years.find(y=>y.year===2024)?.detailsStatus,'institution_method_verified');
 assert.equal(school?.years.find(y=>y.year===2025)?.detailsStatus,'institution_method_verified');
});

test('UIT 2026 composite cutoff table preserves official 100-point scale and programme variants',()=>{
 assert.equal(uitCompositeCutoffs2026.length,19);
 assert.ok(uitCompositeCutoffs2026.every(r=>r.year===2026&&r.scale===100&&r.source===UIT_CUTOFF_2026_SOURCE));
 assert.equal(uitCompositeCutoffs2026.find(r=>r.code==='7480107')?.cutoff,100);
 assert.equal(uitCompositeCutoffs2026.find(r=>r.code==='7480101TA')?.cutoff,85);
 assert.equal(uitCompositeCutoffs2026.find(r=>r.code==='75202A1TA')?.cutoff,80);
 assert.ok(uitCompositeCutoffs2026.every(r=>/thang 100/.test(r.note)&&/điểm cộng và điểm ưu tiên/.test(r.note)));
 const aiHistory=nationalCutoffs.filter(r=>r.universityId==='uit'&&r.code==='7480107');
 assert.deepEqual(aiHistory.filter(r=>r.year===2026).map(r=>[r.method,r.scale,r.cutoff]),[['UIT_2026_COMPOSITE',100,100]]);
 assert.deepEqual(aiHistory.filter(r=>r.year===2025).map(r=>[r.method,r.scale,r.cutoff]).sort(),[['UIT_2025_DGNL',1200,1098],['UIT_2025_THPT',30,29.6]].sort());
 assert.deepEqual(aiHistory.filter(r=>r.year===2024).map(r=>[r.method,r.scale,r.cutoff]).sort(),[['UIT_2024_DGNL',1200,980],['UIT_2024_THPT',30,28.3]].sort());
});
