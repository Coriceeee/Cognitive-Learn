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
const makeContext=(transcript,extras={})=>({transcript,...extras});
const row=(subject,average,status='COMPLETE')=>({subject,average,provisional:status==='PARTIAL'?6.5:average,row:{regular:[],midterm:'',final:''},status});

test('detects Vietnamese improvement and subject-priority questions with or without accents',()=>{
  for(const q of ['Làm sao để tiến bộ hơn?','Em nên tập trung môn nào?','mon nao can cai thien','Tôi cần ưu tiên môn học nào?','Lập kế hoạch học tập cho em','Cho em lịch học tuần này'])assert.equal(isPersonalLearningAdviceQuestion(q),true);
  assert.equal(isPersonalLearningAdviceQuestion('Điểm chuẩn HUST 2026?'),false);
});
test('ranks only complete subjects from the same latest semester and gives concrete next steps',()=>{
  const answer=answerPersonalLearningAdvice(makeContext(makeState([
    row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4),row('Ngữ văn',8.1),row('Tiếng Anh',null,'MISSING')
  ])),'student-A').answer;
  assert.match(answer,/Lớp 12 · Học kỳ II/);
  assert.match(answer,/Toán: 5\.8\/10/);
  assert.match(answer,/ưu tiên trước/);
  assert.match(answer,/Kế hoạch tuần được tính từ dữ liệu của bạn/);
  assert.match(answer,/chưa có số giờ học\/tuần đã xác minh/);
  assert.match(answer,/Cuối tuần làm một bài kiểm tra ngắn/);
  assert.doesNotMatch(answer,/CLA-K08|src\/engines|UNKNOWN/);
  assert.doesNotMatch(answer,/Tiếng Anh: 0/);
});
test('does not claim a single weak subject when two subjects are nearly tied',()=>{
  const answer=answerPersonalLearningAdvice(makeContext(makeState([row('Toán',6.1),row('Vật lý',6.3),row('Hóa học',7.5)])),'student-A').answer;
  assert.match(answer,/Toán: 6\.1\/10; Vật lý: 6\.3\/10/);
  assert.match(answer,/xếp theo điểm hiện tại từ thấp lên cao/);
});
test('refuses to rank incomplete or provisional-only grades',()=>{
  const answer=answerPersonalLearningAdvice(makeContext(makeState([row('Toán',null,'PARTIAL'),row('Vật lý',null,'PARTIAL'),row('Hóa học',null,'PARTIAL')])),'student-A').answer;
  assert.match(answer,/chỉ có điểm tạm tính/);
  assert.doesNotMatch(answer,/Toán: 6\.1/);
});
test('does not fall back to an older semester when the latest semester is incomplete',()=>{
  const state=makeState([row('Toán',null,'PARTIAL'),row('Vật lý',null,'PARTIAL'),row('Hóa học',null,'PARTIAL')]);
  state.data.terms.unshift({grade:'grade11',semester:'semester2',subjects:[row('Toán',5.1),row('Vật lý',5.3),row('Hóa học',6.0)]});
  const answer=answerPersonalLearningAdvice(makeContext(state),'student-A').answer;
  assert.match(answer,/chỉ có điểm tạm tính/);
  assert.doesNotMatch(answer,/Lớp 11|Toán: 5\.1/);
});
test('legacy transcript is explicitly described as historical read-only data',()=>{
  const answer=answerPersonalLearningAdvice(makeContext(makeState([row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4)],{source:'legacy'})),'student-A').answer;
  assert.match(answer,/hồ sơ lịch sử ở chế độ chỉ đọc/);
});
test('blocks stale, unavailable and cross-account transcript context with specific status guidance',()=>{
  const cases=[
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{userId:'student-B'}),/đang xác minh dữ liệu/],
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{status:'syncing'}),/đang được tải hoặc xác minh/],
    [makeState([row('Toán',5),row('Vật lý',6),row('Hóa học',7)],{status:'error'}),/chưa đọc được bảng điểm từ máy chủ/]
  ];
  for(const [state,expected] of cases){
    const answer=answerPersonalLearningAdvice(makeContext(state),'student-A').answer;
    assert.match(answer,expected);
    assert.doesNotMatch(answer,/Toán: 5/);
  }
});
test('weekly hours and completion rate drive the actual schedule allocation',()=>{
  const transcript=makeState([row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4),row('Ngữ văn',8.1)]);
  const context=makeContext(transcript,{
    hasProfile:true,loading:false,syncing:false,
    profile:{studyHoursPerWeek:10,practiceTestsPerWeek:2,planCompletionRate:40,motivationLevel:30,learningStrategy:35,targetMajor:'CNTT'},
    dynamicState:{scope:'student',behavior:{hours:10,practice:2,completion:40,motivation:30}}
  });
  const answer=answerPersonalLearningAdvice(context,'student-A').answer;
  assert.match(answer,/10\.0 giờ\/tuần/);
  assert.match(answer,/7\.5 giờ\/tuần/);
  assert.match(answer,/Toán 3\.7 giờ/);
  assert.match(answer,/Vật lý 3\.0 giờ/);
  assert.match(answer,/Hóa học 0\.8 giờ/);
  assert.match(answer,/hoàn thành kế hoạch hiện ghi nhận 40%/);
  assert.match(answer,/2\.0 bài thi thử\/tuần/);
  assert.match(answer,/động lực tự báo cáo là 30\/100/);
  assert.match(answer,/chiến lược học tập tự báo cáo là 35\/100/);
  assert.match(answer,/CNTT/);
});
test('a recorded zero-hour week does not silently create a timetable',()=>{
  const context=makeContext(makeState([row('Toán',5.8),row('Vật lý',6.2)]),{
    hasProfile:true,loading:false,syncing:false,
    profile:{studyHoursPerWeek:0,practiceTestsPerWeek:0,planCompletionRate:0,motivationLevel:0},
    dynamicState:{scope:'student',behavior:{hours:0,practice:0,completion:0,motivation:0}}
  });
  const answer=answerPersonalLearningAdvice(context,'student-A').answer;
  assert.match(answer,/ghi nhận 0 giờ học\/tuần/);
  assert.doesNotMatch(answer,/khoảng \d+\.\d giờ mỗi tuần/);
});
test('missing study-hour measurement never invents hours or sessions',()=>{
  const answer=answerPersonalLearningAdvice(makeContext(makeState([row('Toán',5.8),row('Vật lý',6.2)])),'student-A').answer;
  assert.match(answer,/chưa có số giờ học\/tuần đã xác minh/);
  assert.doesNotMatch(answer,/buổi\/tuần|\d+\.\d giờ mỗi tuần/);
});
test('previous-term subject changes are reported from the transcript rather than guessed',()=>{
  const transcript=makeState([row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4)]);
  transcript.data.terms.unshift({grade:'grade11',semester:'semester2',subjects:[row('Toán',6.3),row('Vật lý',6.0),row('Hóa học',7.4)]});
  const answer=answerPersonalLearningAdvice(makeContext(transcript),'student-A').answer;
  assert.match(answer,/Toán giảm 0\.5 điểm/);
  assert.match(answer,/Vật lý tăng 0\.2 điểm/);
});
test('verified temporal completion trend also adjusts the weekly workload',()=>{
  const context=makeContext(makeState([row('Toán',5.8),row('Vật lý',6.2),row('Hóa học',7.4)]),{
    hasProfile:true,loading:false,syncing:false,
    profile:{studyHoursPerWeek:8,practiceTestsPerWeek:0,planCompletionRate:75,motivationLevel:60},
    dynamicState:{scope:'student',behavior:{hours:8,practice:0,completion:75,motivation:60}},
    temporalReport:{status:'DESCRIPTIVE',series:[{metric:'planCompletionRate',status:'DESCRIPTIVE',delta:-12.5,spanDays:14}]}
  });
  const answer=answerPersonalLearningAdvice(context,'student-A').answer;
  assert.match(answer,/8\.0 giờ\/tuần/);
  assert.match(answer,/6\.8 giờ\/tuần/);
  assert.match(answer,/tỷ lệ hoàn thành giảm 12\.5 điểm/);
});
test('measured cognitive proxies adapt the plan but remain explicitly labelled as proxies',()=>{
  const context=makeContext(makeState([row('Toán',5.8),row('Vật lý',6.2)]),{
    cognitive:{scoreAvailable:true,missingDimensions:[],SCI:45,CSL:50,GVI:70,FRI:65,dimensions:[
      {code:'SCI',available:true},{code:'CSL',available:true},{code:'GVI',available:true},{code:'FRI',available:true}
    ]}
  });
  const answer=answerPersonalLearningAdvice(context,'student-A').answer;
  assert.match(answer,/SCI proxy \(45\/100\)/);
  assert.match(answer,/CSL proxy \(50\/100\)/);
  assert.match(answer,/GVI proxy \(70\/100\)/);
  assert.match(answer,/FRI proxy \(65\/100\)/);
  assert.match(answer,/quy tắc lập kế hoạch thử nghiệm/);
});
test('chat offers a personal plan entry point and keeps plan follow-ups local',()=>{
  const chat=readFileSync(path.join(root,'src/components/common/FloatingAdvisorChat.tsx'),'utf8');
  const suggestions=readFileSync(path.join(root,'src/lib/advisorChatPolicy.ts'),'utf8');
  assert.match(suggestions,/Lập kế hoạch học tập theo dữ liệu của tôi/);
  assert.match(chat,/privateIntent: "learning"/);
  assert.match(chat,/previousPrivate === "learning" && privateFollowup/);
  assert.match(chat,/không gửi dữ liệu cá nhân sang Gemini/);
});
test('chat reads optional verified context and handles personal advice locally before Gemini',()=>{
  const chat=readFileSync(path.join(root,'src/components/common/FloatingAdvisorChat.tsx'),'utf8');
  const provider=readFileSync(path.join(root,'src/page/seed/hooks/StudentProfileProvider.tsx'),'utf8');
  assert.match(chat,/useOptionalVerifiedStudentProfile/);
  assert.match(chat,/answerPersonalLearningAdvice\(studentContext, uid\)/);
  assert.ok(chat.indexOf('answerPersonalLearningAdvice(studentContext')<chat.indexOf('fetch(`${apiBase()}\/api\/gemini-chat'));
  assert.match(provider,/useStudentTranscript\(\)/);
  assert.match(provider,/useOptionalVerifiedStudentProfile/);
  const chatStyles=readFileSync(path.join(root,'src/styles/22-cla-chat-readability.css'),'utf8');
  assert.match(chatStyles,/white-space: pre-wrap/);
  assert.match(chat,/body: JSON\.stringify\(\{ version: 1, message, history: past, pageContext \}\)/);
});
