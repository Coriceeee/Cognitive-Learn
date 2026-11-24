/** Six-module Learning Network menu contract. Checks source structure, not browser rendering. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('src/page/seed/StudentPage.tsx');
const component=read('src/page/seed/components/LearningCircuit.tsx');
const css=read('src/styles/50-cp87-circuit-primary.css');
const styleEntry=read('src/styles.css');

test('student dashboard keeps the original six-module Learning Network immediately after greeting',()=>{
  const hero=page.indexOf('className="student-dash-hero cla-observatory-intro"');
  const menu=page.indexOf('<LearningCircuit profilePath={profilePath} />');
  assert.ok(hero>0 && menu>hero);
  assert.equal((page.match(/<LearningCircuit profilePath=\{profilePath\} \/>/g)||[]).length,1);
  assert.match(component,/COGNITIVE LEARN \/ LEARNING NETWORK/);
  assert.match(component,/Một hành trình\. Sáu hệ trí tuệ\./);
  assert.match(component,/Di chuyển giữa các trạm theo mục tiêu của bạn/);
});

test('the menu retains all six original module labels, order and destinations',()=>{
  const expected=[
    ['SEED','Bản sắc học tập','/student/profile','x:16,y:26'],
    ['LUMEN','Dấu vân tay trí tuệ','/lumen','x:49,y:18'],
    ['ATLAS','Bản đồ tương lai','/atlas','x:81,y:30'],
    ['ORION','Kiến trúc tương lai','/orion','x:81,y:73'],
    ['PULSE','Đường cong tiến hóa','/pulse','x:49,y:84'],
    ['HAVEN','Hành trang thế giới','/haven','x:17,y:72'],
  ];
  let cursor=-1;
  for(const [code,title,href,position] of expected){
    const at=component.indexOf('code:"'+code+'"');
    assert.ok(at>cursor,code+' order');
    const next=component.indexOf('code:"',at+6);
    const block=component.slice(at,next<0?component.length:next);
    assert.ok(block.includes('title:"'+title+'"'),title);
    assert.ok(block.includes('href:"'+href+'"'),href);
    assert.ok(block.includes(position),position);
    cursor=at;
  }
  assert.equal((component.match(/code:"(?:SEED|LUMEN|ATLAS|ORION|PULSE|HAVEN)"/g)||[]).length,6);
  assert.match(component,/href=\{item\.code==="SEED"\?profilePath:item\.href\}/);
});

test('the map preserves the central CLA Learning Loop, curved route and mobile fallback',()=>{
  assert.match(component,/className="cla-circuit-map"/);
  assert.match(component,/className="cla-circuit-wires"/);
  assert.match(component,/LEARNING LOOP/);
  assert.match(component,/className="cla-circuit-mobile"/);
  assert.match(component,/aria-label="Sáu không gian học tập"/);
  assert.match(css,/\.student-dash \.cla-circuit-stage\s*\{\s*display: block/);
  assert.match(css,/\.student-dash \.cla-circuit-detail \{ display: none; \}/);
  assert.match(css,/@media \(max-width: 760px\)/);
  assert.match(styleEntry,/50-cp87-circuit-primary\.css/);
});

test('the previous four-step replacement is not rendered as the main menu',()=>{
  assert.doesNotMatch(component,/cla-primary-journey/);
  assert.doesNotMatch(component,/BƯỚC CHÍNH/);
});
