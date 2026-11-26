'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('first-time students see the core Seed → Lumen → Atlas journey',()=>{
  const page=read('src/page/seed/StudentPage.tsx');
  const circuit=read('src/page/seed/components/LearningCircuit.tsx');
  assert.match(page,/Bắt đầu từ hồ sơ và bảng điểm/);
  assert.match(circuit,/const \[active, setActive\] = useState\(0\)/);
  assert.match(circuit,/Lần đầu sử dụng, hãy bắt đầu từ SEED → LUMEN → ATLAS → ORION/);
  assert.match(circuit,/Phân tích 7 chỉ số Cognitive thử nghiệm/);
  assert.match(circuit,/Dùng điểm ước lượng để khám phá tổ hợp xét tuyển; tra cứu ngành và trường theo sở thích, hồ sơ học tập và dữ liệu tuyển sinh có nguồn/);\n  assert.match(circuit,/Không suy ra xác suất đỗ/);\n  assert.match(circuit,/trung bình của hai bài thi thử/);
});

test('the six approved module labels, order and destinations remain unchanged',()=>{
  const circuit=read('src/page/seed/components/LearningCircuit.tsx');
  const expected=[
    ['SEED','Bản sắc học tập','/student/profile'],
    ['LUMEN','Dấu vân tay trí tuệ','/lumen'],
    ['ATLAS','Bản đồ tương lai','/atlas'],
    ['ORION','Kiến trúc tương lai','/orion'],
    ['PULSE','Đường cong tiến hóa','/pulse'],
    ['HAVEN','Hành trang thế giới','/haven'],
  ];
  let cursor=-1;
  for(const [code,title,href] of expected){
    const at=circuit.indexOf('code:"'+code+'"');
    assert.ok(at>cursor,code+' order');
    const next=circuit.indexOf('code:"',at+6);
    const block=circuit.slice(at,next<0?circuit.length:next);
    assert.ok(block.includes('title:"'+title+'"'),title);
    assert.ok(block.includes('href:"'+href+'"'),href);
    cursor=at;
  }
  assert.equal((circuit.match(/code:"(?:SEED|LUMEN|ATLAS|ORION|PULSE|HAVEN)"/g)||[]).length,6);
});
