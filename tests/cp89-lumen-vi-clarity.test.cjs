'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const hash=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const original=JSON.parse(read('CP88_SOURCE_MANIFEST.json'));
function unchanged(rel){const item=original.files.find(x=>x.path===rel);assert.ok(item,rel);assert.equal(hash(rel),item.sha256,rel);}
test('CP89 keeps calculation rules, Firebase authorization and historical manifests unchanged',()=>{
  for(const rel of ['src/lib/cognitiveAdapter.ts','src/lib/cognitiveCompositeFormula.ts','src/engines/cognitive/cognitiveEngine.ts','firestore.rules.CANDIDATE_CP21','src/page/seed/hooks/StudentProfileProvider.tsx','CP86_SOURCE_MANIFEST.json']) unchanged(rel);
});
test('CP89 explains seven indicators with source, interpretation and next actions',()=>{
 const guide=read('src/page/lumen/components/LumenIndexGuide.tsx');
 assert.equal((guide.match(/code: "(?:SCI|MAS|CSL|CRI|GVI|BDI|FRI)"/g)||[]).length,7);
 for(const fragment of ['Dữ liệu/cách tính','Ghi chú từ bộ tính','Bước tiếp theo','Chưa có dữ liệu','0,5 × SCI + 0,3 × MAS + 0,2 × CSL','0,3 × SCI + 0,25 × MAS + 0,2 × CSL + 0,25 × CRI','không phải 7 loại trí thông minh'])assert.ok(guide.includes(fragment),fragment);
});
test('CP89 locates guide on overview and detailed indices while keeping one radar per section',()=>{
 const page=read('src/page/lumen/LumenPage.tsx');
 assert.match(page,/<LumenIndexGuide cognitive=\{cognitive\} compact \/>/);
 assert.match(page,/view === "\/lumen\/indices".*?<LumenIndexGuide cognitive=\{cognitive\} \/>/s);
 assert.ok(!page.includes('<CognitiveScoreGrid'));
 assert.match(read('src/styles.css'),/51-cp89-lumen-clarity\.css/);
});
test('CP89 removes unexplained English labels from primary Lumen sections',()=>{
 const files=['src/page/lumen/components/LumenSignalAtlas.tsx','src/page/lumen/components/LumenEvidencePanel.tsx','src/page/lumen/components/LumenInsightPanel.tsx','src/page/seed/components/LearningIntelligencePanel.tsx','src/page/seed/components/CognitiveGrowthPanel.tsx'];
 const s=files.map(read).join('\n');
 for(const phrase of ['Evidence status','Career Focus','Career Journey','Future Prediction','Current State','Core strength','Longitudinal Growth','OBSERVATION FIRST','DATA OBSERVABILITY','PROFILE GEOMETRY','RISK / BEHAVIOR PROXIES'])assert.ok(!s.includes(phrase),phrase);
 for(const phrase of ['Kỹ sư phần mềm','Điểm kịch bản thử nghiệm','Dữ liệu nào đã được kiểm chứng?','Mức độ đầy đủ của dữ liệu','Chênh lệch điểm tổng hợp'])assert.ok(s.includes(phrase),phrase);
});
test('CP89 historical manifest is unchanged; CP90 active source verifies through its own manifest',()=>{
 const previous=require('../tools/verify-cp89-snapshot.cjs').verifyRelease(root);
 assert.equal(previous.ok,false,'CP89 snapshot must not claim an edited CP90 checkout is CP89');
 const result=require('../tools/verify-cp90-snapshot.cjs').verifyRelease(root);
 assert.equal(result.ok,true,result.errors.join('\n'));
});
