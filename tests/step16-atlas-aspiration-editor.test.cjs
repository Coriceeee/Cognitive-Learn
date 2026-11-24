'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const src=(name)=>fs.readFileSync(path.join(root,name),'utf8');
function loadTs(file,stubs={}){
  const code=ts.transpileModule(src(file),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',code)(mod,mod.exports,(name)=>{
    if(name in stubs)return stubs[name];
    throw new Error('Unexpected dependency '+name);
  });
  return mod.exports;
}
const policy={ADMISSION_POLICY_2026:{year:2026,maxAspirations:15,teacherTrainingLastPriority:5,document:'06/2026/TT-BGDĐT'}};
const draft=loadTs('src/lib/atlasAspirationDraft2026.ts',{'./aspirationPlanner':policy});
function manual(n,code='7480201',teacher=false){return draft.createManualDraftChoice('Trường '+n,'Ngành '+n,code,teacher);}
function ptit(overrides={}){return {programId:'ptit-bvh-2026-7480201',universityName:'PTIT',majorName:'Công nghệ thông tin',majorCode:'7480201',year:2026,campus:'BVH',officialSource:'https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/',combinations:[{code:'X26'}],...overrides};}

test('16.01 manual choice requires university, major and code',()=>{assert.equal(draft.createManualDraftChoice('','Ngành','123'),null);assert.equal(draft.createManualDraftChoice('A','', '123'),null);assert.equal(draft.createManualDraftChoice('A','B',''),null)});
test('16.02 retains user entered data provenance and no source URL',()=>{const item=manual('A');assert.equal(item.origin,'student_entered');assert.equal(item.sourceUrl,null);assert.equal(item.year,2026)});
test('16.03 trusted PTIT sample contains official source and 2026 only',()=>{const c=draft.createPtitDraftChoice(ptit());assert.equal(c.origin,'ptit_bvh_source_2026');assert.deepEqual(c.combinations,['X26'])});
test('16.04 rejects stale year and invalid campus even with PTIT host',()=>{assert.equal(draft.createPtitDraftChoice(ptit({year:2025})),null);assert.equal(draft.createPtitDraftChoice(ptit({campus:'BVS'})),null)});
test('16.05 rejects foreign and http source',()=>{assert.equal(draft.createPtitDraftChoice(ptit({officialSource:'https://evil.example/de-an-tuyen-sinh/2026'})),null);assert.equal(draft.createPtitDraftChoice(ptit({officialSource:'http://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/2026'})),null)});
test('16.06 rejects source bearing credentials or wrong path',()=>{assert.equal(draft.createPtitDraftChoice(ptit({officialSource:'https://a:b@tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/2026'})),null);assert.equal(draft.createPtitDraftChoice(ptit({officialSource:'https://tuyensinh.ptit.edu.vn/anything/2026'})),null)});
test('16.07 rejects mismatch between PTIT id and major code',()=>{assert.equal(draft.createPtitDraftChoice(ptit({majorCode:'12345'})),null)});
test('16.08 add appends and NEVER sorts by marks or risk levels',()=>{const a=manual('A');const b=manual('B');const state=draft.addDraftChoice([a],b);assert.deepEqual(state.items.map(x=>x.id),[a.id,b.id]);assert.equal(state.error,null)});
test('16.09 duplicate id is rejected',()=>{const a=manual('A');const state=draft.addDraftChoice([a],a);assert.ok(state.error);assert.equal(state.items.length,1)});
test('16.10 duplicate school + major code rejected even if ID varies',()=>{const a=manual('A');const b={...a,id:'fake-new-id'};assert.ok(draft.addDraftChoice([a],b).error)});
test('16.11 maximum 15 preferences, 16th rejected without mutation',()=>{const all=Array.from({length:15},(_,i)=>manual(i.toString()));const r=draft.addDraftChoice(all,manual('last'));assert.ok(r.error);assert.equal(r.items.length,15);assert.equal(all.length,15)});
test('16.12 moving up/down preserves contents and only changes one step',()=>{const a=manual('A'),b=manual('B'),c=manual('C');assert.deepEqual(draft.moveDraftChoice([a,b,c],c.id,-1).map(x=>x.id),[a.id,c.id,b.id]);assert.deepEqual(draft.moveDraftChoice([a,b,c],a.id,1).map(x=>x.id),[b.id,a.id,c.id])});
test('16.13 boundary and unknown move are no-op',()=>{const a=manual('A'),b=manual('B');for(const [id,d] of [[a.id,-1],[b.id,1],['x',1]])assert.deepEqual(draft.moveDraftChoice([a,b],id,d).map(x=>x.id),[a.id,b.id])});
test('16.14 removal preserves preference ordering',()=>{const a=manual('A'),b=manual('B'),c=manual('C');assert.deepEqual(draft.removeDraftChoice([a,b,c],b.id).map(x=>x.id),[a.id,c.id])});
test('16.15 teacher NV6 warns, does not move or remove it',()=>{const all=Array.from({length:5},(_,i)=>manual(String(i)));all.push(manual('Ped','7140201',true));const r=draft.reviewAspirationDraft(all);assert.ok(r.blocking.some(x=>x.includes('NV6')));assert.equal(all[5].teacherTraining,true)});
test('16.16 teacher NV5 allowed at boundary',()=>{const all=Array.from({length:4},(_,i)=>manual(String(i)));all.push(manual('Ped','7140201',true));assert.equal(draft.reviewAspirationDraft(all).blocking.length,0)});
test('16.17 teacher-training code and name recognized conservatively',()=>{assert.equal(draft.looksLikeTeacherTraining('7140201','A'),true);assert.equal(draft.looksLikeTeacherTraining('7480201','Sư phạm Tin học'),true);assert.equal(draft.looksLikeTeacherTraining('7480201','Công nghệ thông tin'),false)});
test('16.18 self-entered schools always show verification caution',()=>{assert.match(draft.reviewAspirationDraft([manual('A')]).cautions.join(' '),/chưa đối chiếu/)});
test('16.19 empty draft is explicitly a draft',()=>{const r=draft.reviewAspirationDraft([]);assert.ok(r.cautions.join(' ').includes('trống'))});
test('16.20 export contains no personal scores, UID, or official-submission claim',()=>{const r=draft.makeAspirationDraftExport([manual('A')]);assert.equal(r.officialSubmission,false);const json=JSON.stringify(r);assert.ok(!json.includes('score'));assert.ok(!json.includes('uid'));assert.equal(r.entries[0].order,1)});
test('16.21 exported orders match reordered user list',()=>{const a=manual('A'),b=manual('B');const result=draft.makeAspirationDraftExport(draft.moveDraftChoice([a,b],b.id,-1));assert.equal(result.entries[0].majorName,b.majorName)});
test('16.22 UI is available without official THPT scores and no auto-selection',()=>{const panel=src('src/page/atlas/components/AtlasAdmissionEnginePanel.tsx');const ui=src('src/page/atlas/components/AtlasAspirationDraftEditor.tsx');assert.ok(panel.includes('<AtlasAspirationDraftEditor entries={selectedNational.entries} sourceRevision={sourceRevision} />'));assert.ok(ui.includes('useState<AspirationDraftChoice[]>([])'));assert.ok(ui.includes('Không tự động lưu lên server'))});
test('16.23 UI displays warnings rather than reordering teacher program',()=>{const ui=src('src/page/atlas/components/AtlasAspirationDraftEditor.tsx');assert.ok(ui.includes('review.blocking.map'));assert.ok(ui.includes('Hệ thống không tự đổi chỗ'));assert.ok(ui.includes('moveDraftChoice'))});
test('16.24 workspace linked to 2026 policy, no direct save to Firebase',()=>{const ui=src('src/page/atlas/components/AtlasAspirationDraftEditor.tsx');assert.ok(ui.includes('ADMISSION_POLICY_2026'));assert.ok(!ui.includes('setDoc('));assert.ok(!ui.includes('addDoc('))});
test('16.25 Vercel serves all explicit React route paths including consent/companion, preserving API functions',()=>{
 const vercel=JSON.parse(src('vercel.json'));
 const sources=new Map(vercel.rewrites.map(x=>[x.source,x.destination]));
 const app=src('src/App.tsx');
 const routes=[...app.matchAll(/path === "(\/[^"]*)"/g)].map(m=>m[1]).filter(x=>x!=='/');
 for(const route of routes)assert.equal(sources.get(route),'/index.html',`Missing Vercel rewrite: ${route}`);
 assert.equal(vercel.functions['api/*.ts'].maxDuration,45);
 assert.ok(!sources.has('/api/:path*'));
});
test('16.26 CSS asset and test command present',()=>{assert.ok(src('src/styles.css').includes('29-atlas-aspiration-editor.css'));const pkg=JSON.parse(src('package.json'));assert.ok(pkg.scripts['test:aspiration-draft'])});

test('16.27 import/export preserves ordering but downgrades claims to unverified',()=>{
 const original=draft.makeAspirationDraftExport([draft.createPtitDraftChoice(ptit()),manual('B')]);
 const result=draft.importAspirationDraftExport(original);
 assert.equal(result.error,null);assert.equal(result.items.length,2);
 assert.equal(result.items[0].origin,'student_entered');assert.equal(result.items[0].sourceUrl,null);
 assert.equal(result.items[0].majorName,'Công nghệ thông tin');
});
test('16.28 import rejects wrong schema, old year, or excessive entries',()=>{
 for(const payload of [{schema:'evil',year:2026,entries:[]},{schema:'cla-atlas-aspiration-draft-v1',year:2025,entries:[]},
  {schema:'cla-atlas-aspiration-draft-v1',year:2026,entries:new Array(16).fill({})}])
  assert.ok(draft.importAspirationDraftExport(payload).error);
});
test('16.29 invalid or repeated file entries are rejected atomically',()=>{
 const payload=draft.makeAspirationDraftExport([manual('A')]);
 assert.ok(draft.importAspirationDraftExport({...payload,entries:[payload.entries[0],payload.entries[0]]}).error);
 assert.ok(draft.importAspirationDraftExport({...payload,entries:[{school:1}]}).error);
});
test('16.30 import UI explicitly warns that source claims are not trusted',()=>{
 const ui=src('src/page/atlas/components/AtlasAspirationDraftEditor.tsx');
 assert.ok(ui.includes('CHƯA XÁC MINH'));assert.ok(ui.includes('Nhập lại bản nháp đã xuất'));
 assert.ok(ui.includes('file.size>100_000'));
});
test('16.31 national draft uses source registry identity across schools and rejects missing/stale/insecure entries',()=>{const p={id:'ctu-1',universityId:'ctu',universityName:'Đại học Cần Thơ',campus:'Cần Thơ',majorCode:'7480201',majorName:'Công nghệ thông tin',year:2026,sourceUrl:'https://tuyensinh.ctu.edu.vn/program',sourceKind:'scheme',status:'MATCH',matches:[{code:'A01'}]};const q={...p,id:'agu-1',universityId:'agu',universityName:'Đại học An Giang',sourceUrl:'https://tuyensinh.agu.edu.vn/program',status:'UNCONFIRMED',matches:[]};const a=draft.createNationalDraftChoice(p.id,[p,q]),b=draft.createNationalDraftChoice(q.id,[p,q]);assert.equal(a.origin,'national_source_2026');assert.deepEqual(a.combinations,['A01']);assert.equal(b.matchStatus,'UNCONFIRMED');assert.equal(draft.addDraftChoice([a],b).items.length,2);assert.equal(draft.createNationalDraftChoice('missing',[p,q]),null);assert.equal(draft.createNationalDraftChoice(p.id,[{...p,year:2025}]),null);assert.equal(draft.createNationalDraftChoice(p.id,[{...p,sourceUrl:'http://example.com'}]),null);});
