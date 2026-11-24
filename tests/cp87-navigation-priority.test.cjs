/** Student-facing journey contract for the current focused dashboard. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('src/page/seed/StudentPage.tsx');
const journey=read('src/page/seed/components/LearningCircuit.tsx');
const styles=read('src/styles/54-cla-student-journey.css');
const styleEntry=read('src/styles.css');

test('student home presents the four primary admissions steps in the intended order',()=>{
  const expected=[
    ['01','SEED','Hồ sơ học tập','/student/profile'],
    ['02','LUMEN','Phân tích năng lực','/lumen'],
    ['03','ATLAS','Ngành và trường','/atlas'],
    ['04','ORION','Lộ trình nguyện vọng','/orion'],
  ];
  let cursor=-1;
  for(const [number,code,title,href] of expected){
    const start=journey.indexOf(`number: "${number}"`);
    const next=journey.indexOf(`number: "${String(Number(number)+1).padStart(2,'0')}"`,start+1);
    const end=next<0?journey.length:next;
    const step=journey.slice(start,end);
    assert.ok(start>cursor,code);
    assert.ok(step.includes(`code: "${code}"`),code);
    assert.ok(step.includes(`title: "${title}"`),title);
    assert.ok(step.includes(`href: "${href}"`),href);
    cursor=start;
  }
  assert.equal((journey.match(/number: "0[1-4]"/g)||[]).length,4);
});

test('student home removes duplicate six-module navigation and secondary task rail',()=>{
  assert.match(page,/<LearningCircuit profilePath=\{profilePath\} \/>/);
  assert.match(page,/{view !== "\/student" && <ModuleSectionNav moduleKey="seed" \/>}/);
  assert.doesNotMatch(page,/<StudentActionSignalRail/);
  assert.doesNotMatch(page,/<StudentJourneyBridge/);
  assert.doesNotMatch(page,/student-dash-extra-links/);
});

test('detailed cognitive analytics are retained but progressively disclosed',()=>{
  assert.match(page,/<details className="cla-student-analysis-details">/);
  assert.match(page,/<StudentDecisionCanvas /);
  assert.match(page,/<ExamHorizon \/>/);
});

test('the journey remains accessible and responsive without replacing existing route architecture',()=>{
  assert.match(journey,/aria-labelledby="cla-primary-journey-title"/);
  assert.match(journey,/steps\.map/);
  assert.match(journey,/href="\/pulse"/);
  assert.match(journey,/href="\/haven"/);
  assert.match(styles,/@media \(max-width: 900px\)/);
  assert.match(styles,/@media \(max-width: 560px\)/);
  assert.match(styles,/:focus-visible/);
  assert.match(styleEntry,/54-cla-student-journey\.css/);
  assert.match(read('src/App.tsx'),/path === "\/student"/);
  assert.match(read('src/lib/routeModules.ts'),/student: \(\) => import\('\.\.\/page\/seed\/StudentPage'\)/);
});
