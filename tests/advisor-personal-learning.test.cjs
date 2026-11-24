const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file);
  const mod={exports:{}};cache.set(file,mod.exports);
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('module','exports','require',code)(mod,mod.exports,name=>{
    const resolved=path.resolve(path.dirname(file),name);
    return load(resolved.endsWith('.ts')?resolved:resolved+'.ts');
  });
  return mod.exports;
}
const root=path.resolve(__dirname,'..');
const {answerPersonalLearningAdvice,isPersonalLearningAdviceQuestion}=load(path.join(root,'src/lib/advisorDecisionContext.ts'));
const makeState=(subjects,overrides={})=>({
  data:{terms:[{grade:'grade12',semester:'semester2',subjects}],subjects:[],currentSubjects:[],yearly:{grade10:null,grade11:null,grade12:null},updatedAt:null},
  status:'ready',source:'student_transcripts',userId:'student-A',...overrides
});
const row=(subject,average,status='COMPLETE')=>({subject,average,provisional:average,row:{regular:[],midterm:'',final:''},status});

test('detects Vietnamese improvement and subject-priority questions with or without accents',()=>{
  for(const q of ['Làm sao để tiến bộ hơn?','Em nên tập trung môn nào?','mon nao can cai thien','Tôi cần ưu tiên môn học nào?'])assert.equal(isPersonalLearningAdviceQuestion(q),true);
  assert.equal(isPersonalLearningAdviceQuestion('Điểm chuẩn HUST 2026?'),false);
});
test('ranks only complete subjects from the same latest semester and gives concrete next steps',()=>{
  const answer=answerPersonalLearningAdvice(makeState([
    row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4),row('Ngữ văn',8.1),row('Tiếng Anh',null,'MISSING')
  ]),'student-A').answer;
  assert.match(answer,/Lớp 12 · Học kỳ II/);
  assert.match(answer,/Toán: 5\.8\/10/);
  assert.match(answer,/ưu tiên trước/);
  assert.match(answer,/2 buổi\/tuần/);
  assert.match(answer,/bài kiểm tra mới/);
  assert.doesNotMatch(answer,/CLA-K08|src\/engines|UNKNOWN/);
  assert.doesNotMatch(answer,/Tiếng Anh: 0/);
});
test('does not claim a single weak subject when two subjects are nearly tied',()=>{
  const answer=answerPersonalLearningAdvice(makeState([row('Toán',6.1),row('Vật lý',6.3),row('Hóa học',7.5)]),'student-A').answer;
  assert.match(answer,/Toán và Vật lý/);
  assert.match(answer,/khá sát nhau/);
});
test('refuses to rank incomplete or provisional-only grades',()=>{
  const answer=answerPersonalLearningAdvice(makeState([row('Toán',6.1),row('Vật lý',6.3),row('Hóa học',null,'PARTIAL')]),'student-A').answer;
  assert.match(answer,/chưa có ít nhất 3 môn/);
  assert.doesNotMatch(answer,/Toán: 6\.1/);
});
test('does not fall back to an older semester when the latest semester is incomplete',()=>{
  const state=makeState([row('Toán',6.1),row('Vật lý',6.3),row('Hóa học',null,'PARTIAL')]);
  state.data.terms.unshift({grade:'grade11',semester:'semester2',subjects:[row('Toán',5.1),row('Vật lý',5.3),row('Hóa học',6.0)]});
  const answer=answerPersonalLearningAdvice(state,'student-A').answer;
  assert.match(answer,/chưa có ít nhất 3 môn/);
  assert.doesNotMatch(answer,/Lớp 11|Toán: 5\.1/);
});
test('legacy transcript is explicitly described as historical read-only data',()=>{
  const answer=answerPersonalLearningAdvice(makeState([row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4)],{source:'legacy'}),'student-A').answer;
  assert.match(answer,/bảng điểm lịch sử ở chế độ chỉ đọc/);
});
test('blocks stale, unavailable and cross-account transcript context with specific status guidance',()=>{
  const cases=[
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{userId:'student-B'}),/đang xác minh dữ liệu/],
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{status:'syncing'}),/đang được tải hoặc xác minh/],
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{status:'error'}),/chưa đọc được bảng điểm từ máy chủ/]
  ];
  for(const [state,expected] of cases){
    const answer=answerPersonalLearningAdvice(state,'student-A').answer;
    assert.match(answer,expected);
    assert.doesNotMatch(answer,/Toán: 5/);
  }
});
test('chat reads optional verified context and handles personal advice locally before Gemini',()=>{
  const chat=readFileSync(path.join(root,'src/components/common/FloatingAdvisorChat.tsx'),'utf8');
  const provider=readFileSync(path.join(root,'src/page/seed/hooks/StudentProfileProvider.tsx'),'utf8');
  assert.match(chat,/useOptionalVerifiedStudentProfile/);
  assert.match(chat,/answerPersonalLearningAdvice\(studentContext\?\.transcript/);
  assert.ok(chat.indexOf('answerPersonalLearningAdvice(studentContext')<chat.indexOf('fetch(`${apiBase()}\/api\/gemini-chat'));
  assert.match(provider,/useStudentTranscript\(\)/);
  assert.match(provider,/useOptionalVerifiedStudentProfile/);
  assert.match(chat,/body: JSON\.stringify\(\{ version: 1, message, history: past, pageContext \}\)/);
});
