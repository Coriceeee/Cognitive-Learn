/** CP87 structural UX contract. Does not assert a browser screenshot or E2E success. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const page=read('src/page/seed/StudentPage.tsx');
const css=read('src/styles/50-cp87-circuit-primary.css');
const component=read('src/page/seed/components/LearningCircuit.tsx');
const cp86=JSON.parse(read('CP86_SOURCE_MANIFEST.json'));

test('CP87 keeps the exact original loop component, module routes and six nodes',()=>{
 const original=cp86.files.find(x=>x.path==='src/page/seed/components/LearningCircuit.tsx');
 assert.ok(original);
 assert.equal(sha('src/page/seed/components/LearningCircuit.tsx'),original.sha256);
 assert.equal((component.match(/code:"(?:SEED|LUMEN|ATLAS|ORION|PULSE|HAVEN)"/g)||[]).length,6);
 assert.match(component,/className="cla-circuit-stage"/);
 assert.match(component,/className="cla-circuit-detail"/);
 assert.match(component,/className="cla-circuit-mobile"/);
});

test('CP87 puts the primary six-module circuit directly after the greeting, ahead of secondary content',()=>{
 const hero=page.indexOf('className="student-dash-hero cla-observatory-intro"');
 const circuit=page.indexOf('<LearningCircuit profilePath={profilePath} />');
 const links=page.indexOf('className="student-dash-extra-links"');
 const subnav=page.indexOf('<ModuleSectionNav moduleKey="seed" />');
 const exam=page.indexOf('<ExamHorizon />');
 const chart=page.indexOf('<StudentDecisionCanvas ');
 const signal=page.indexOf('<StudentActionSignalRail');
 const bridge=page.indexOf('<StudentJourneyBridge');
 assert.ok(hero>0 && hero<circuit && circuit<links && links<subnav);
 assert.ok(subnav<exam && exam<chart && chart<signal && signal<bridge);
 assert.equal(page.split('<LearningCircuit profilePath={profilePath} />').length-1,1);
 assert.equal(page.split('<ModuleSectionNav moduleKey="seed" />').length-1,1);
});

test('CP87 retains compact desktop circle and accessible mobile destinations, without changing routes',()=>{
 assert.match(css,/\.cla-circuit-map \{ min-height: 416px;/);
 assert.match(css,/@media \(max-width: 760px\)/);
 assert.match(css,/\.cla-circuit-mobile > a/);
 assert.match(read('src/styles.css'),/50-cp87-circuit-primary\.css/);
 for(const dest of ['/lumen','/atlas','/orion','/pulse','/haven']) assert.ok(component.includes('href:"'+dest+'"'));
});

test('Current CP93 source verifies against its manifest; CP87 circuit and historical evidence unchanged',()=>{
 // CP89 is a historical release: CP90-CP93 legitimately modify files it pinned.
 // Verify the active checkout against CP92 instead of falsely requiring CP89 hashes.
 const current=spawnSync(process.execPath,[path.join(root,'tools/verify-cp93-snapshot.cjs')],{
   cwd:root,encoding:'utf8',timeout:30000
 });
 assert.equal(current.error,undefined,current.error?.message);
 assert.equal(current.status,0,`CP93 immutable source verification failed:\n${current.stdout}\n${current.stderr}`);
 for(const rel of ['firestore.rules.CANDIDATE_CP21','src/lib/nexusEvidenceBaseline.ts','CP81_SOURCE_MANIFEST.json','CP86_SOURCE_MANIFEST.json']){
   const historical=cp86.files.find(x=>x.path===rel);
   if(historical)assert.equal(sha(rel),historical.sha256,rel);
 }
});
