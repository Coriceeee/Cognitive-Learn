/** P3: browser-local, opt-in decision context. Not a security boundary or live admission verification. */
import { studentDecisionLedger, type DecisionSnapshot, type DecisionInput } from './studentDecisionSnapshot.ts';
import { EXAM_SUBJECT_LABELS, type ExamProjectionSnapshot } from './examProjectionHandoff.ts';
import { EXAM_PROJECTION_VERSION } from './examProjection.ts';
import { type AdmissionGoal } from './admissionGoalHandoff.ts';
import { optimizeGoalGap, type GapSubject } from './goalGapOptimizer.ts';
import type { SubjectCode } from './admissionTypes.ts';
export type AdvisorDecisionData = {kind:'projection';value:ExamProjectionSnapshot}|{kind:'goal';value:AdmissionGoal}|{kind:'gap';subjects:GapSubject[];target:number};
export type AdvisorDecisionKind = AdvisorDecisionData['kind'];
const deps:Record<AdvisorDecisionKind,readonly DecisionInput[]>={projection:['profile','transcript','projection'],goal:['profile','transcript','goal','sources'],gap:['profile','transcript']};
const route:Record<AdvisorDecisionKind,string>={projection:'/atlas/subjects',goal:'/orion/inputs',gap:'/orion/inputs'};
const TTL=5*60_000;
export type AdvisorDecisionRecord={data:AdvisorDecisionData;pin:DecisionSnapshot;createdAt:number};
export function captureAdvisorDecision(uid:string,data:AdvisorDecisionData,now=Date.now()):AdvisorDecisionRecord|null {
  if(!Number.isFinite(now)) return null;
  const pin=studentDecisionLedger.capture(uid,data.kind==='projection'?'Lumen':data.kind==='goal'?'Atlas':'Orion',deps[data.kind]);
  if(!pin)return null;
  return {data:JSON.parse(JSON.stringify(data)) as AdvisorDecisionData,pin,createdAt:now};
}
export function createAdvisorDecisionStore(check=studentDecisionLedger.check) {
  const entries=new Map<AdvisorDecisionKind,AdvisorDecisionRecord>();
  function register(record:AdvisorDecisionRecord) {
    const copy=JSON.parse(JSON.stringify(record)) as AdvisorDecisionRecord;
    const kind=copy.data.kind;entries.set(kind,copy);
    return ()=>{if(entries.get(kind)===copy)entries.delete(kind);};
  }
  function read(uid:string,kind:AdvisorDecisionKind,path:string,now=Date.now()):AdvisorDecisionData|null {
    const r=entries.get(kind);
    if(!r||!uid||r.pin.owner!==uid||path!==route[kind]||!Number.isFinite(now)||now<r.createdAt||now-r.createdAt>=TTL||check(uid,r.pin,deps[kind])!=='CURRENT')return null;
    return JSON.parse(JSON.stringify(r.data)) as AdvisorDecisionData;
  }
  return {register,read,clear:()=>entries.clear()};
}
export const advisorDecisionStore=createAdvisorDecisionStore();
const norm=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
export type AdvisorLocalIntent=AdvisorDecisionKind|'personal';
export function advisorLocalIntent(message:string):AdvisorLocalIntent|null {
  const q=norm(message);
  if(/khoang cach|con thieu bao nhieu diem|phan bo diem|muc tieu tung mon|thieu may diem/.test(q))return 'gap';
  if(/(diem|kich ban|du bao).*(cua (toi|em|minh)|da chuyen|tu lumen|dang dung)|diem (toi|em|minh) (du bao|du kien)/.test(q))return 'projection';
  if(/(nguyen vong|muc tieu|nganh|truong).*(cua (toi|em|minh)|da chon|da xac nhan)/.test(q))return 'goal';
  if(/(phu hop|co hoi|xac suat|kha nang|nen chon|nen hoc|co dau|co do).*(voi (toi|em|minh)|cua (toi|em|minh))|dua (vao|tren) (ho so|diem|hoc ba)|ho so (cua )?(toi|em|minh)|diem (cua )?(toi|em|minh)|\b(toi|em|minh) co (dau|do)\b/.test(q))return 'personal';
  return null;
}
export type AdvisorLocalAnswer={answer:string;destination?:'/atlas/subjects'|'/orion/inputs'|'/student/profile';linkLabel?:string};
const missing:Record<AdvisorLocalIntent,AdvisorLocalAnswer>={
  projection:{answer:'Chưa có kịch bản Lumen đã xác nhận còn hiệu lực trong màn hình Atlas hiện tại. Chuyển kịch bản từ Lumen và bấm “Dùng kịch bản Lumen” để kiểm tra lại. CLA không suy ra điểm từ hồ sơ thiếu.',destination:'/atlas/subjects',linkLabel:'Mở công cụ điểm thi'},
  goal:{answer:'Chưa có nguyện vọng Atlas đã xác nhận còn hiệu lực trong Orion hiện tại. Chọn nguyện vọng tại Atlas và bấm “Dùng mục tiêu này” ở Orion. Lựa chọn không phải xác nhận đủ điều kiện xét tuyển.',destination:'/orion/inputs',linkLabel:'Mở mục tiêu Orion'},
  gap:{answer:'Chưa có phân bổ điểm mục tiêu đã xác nhận còn hiệu lực. Tại Orion, chọn đủ ba môn, nhập tổng điểm tự đặt rồi bấm “Dùng phân bổ này”. Không dùng điểm chuẩn chưa xác minh làm mục tiêu tự động.',destination:'/orion/inputs',linkLabel:'Mở phân bổ điểm'},
  personal:{answer:'CLA chưa có đủ bằng chứng để kết luận ngành/trường phù hợp hay khả năng đỗ cá nhân. Hãy đối chiếu tổ hợp, phương thức, năm, điều kiện và điểm trên Atlas; chọn nguyện vọng theo ưu tiên thực sự của bạn. Có thể hỏi về kịch bản điểm đã chuyển hoặc khoảng cách điểm trong Orion.',destination:'/atlas/subjects',linkLabel:'Đối chiếu tổ hợp'},
};
const label=(key:string)=>Object.prototype.hasOwnProperty.call(EXAM_SUBJECT_LABELS,key)?EXAM_SUBJECT_LABELS[key as SubjectCode]:null;
export function answerLocalDecision(intent:AdvisorLocalIntent,uid:string,path:string,now=Date.now(),store=advisorDecisionStore):AdvisorLocalAnswer {
  if(intent==='personal')return missing.personal;
  const data=store.read(uid,intent,path,now);
  if(!data)return missing[intent];
  if(data.kind==='projection'&&data.value.version===EXAM_PROJECTION_VERSION){
    const rows=Object.entries(data.value.scores).filter(([k,v])=>label(k)&&typeof v==='string'&&v.trim()&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=10).map(([k,v])=>`${label(k)} ${v}`);
    if(rows.length)return {answer:`Kịch bản bạn đã xác nhận từ Lumen: ${rows.join(' · ')}. Nguồn: trung bình hai bài thi thử (${EXAM_PROJECTION_VERSION}). Chỉ là kịch bản tham khảo tại thời điểm hỏi, không phải điểm chính thức, dự báo ML đã kiểm định hay xác suất đỗ. Môn thiếu không được tính.`,destination:'/atlas/subjects',linkLabel:'Đối chiếu tổ hợp'};
  }
  if(data.kind==='goal')return {answer:`Nguyện vọng bạn đã xác nhận: ${data.value.majorName} — ${data.value.universityName} (${data.value.majorCode}, ${data.value.year}). Đây là lựa chọn của bạn tại thời điểm hỏi, không phải kết luận đủ điều kiện hay xác nhận nguồn tuyển sinh hiện hành. Kiểm tra phương thức và điều kiện chính thức trước khi chốt điểm mục tiêu.`,destination:'/orion/inputs',linkLabel:'Xem mục tiêu học tập'};
  if(data.kind==='gap'){
    const result=optimizeGoalGap(data.subjects,data.target);
    if((result.status==='READY'||result.status==='ALREADY_MET')&&data.subjects.every(s=>label(s.subject)))return {answer:`Tổng hiện tại: ${result.currentTotal}/30. Tổng mục tiêu bạn tự đặt: ${data.target}/30. Còn thiếu ${result.gap} điểm. Mục tiêu từng môn: ${data.subjects.map(s=>`${label(s.subject)} ${result.targets[s.subject]}`).join(' · ')}. Đây là phân bổ số học tại thời điểm hỏi (${result.version}), không cộng ưu tiên, không phải dự báo tăng điểm hay điểm chuẩn.`,destination:'/orion/inputs',linkLabel:'Xem phân bổ'};
  }
  return missing[intent];
}
/** Do not reuse local personalized turns as remote conversation context. */

import type { TranscriptView } from '../page/seed/services/transcriptData';
import type { StudentProfile } from '../page/seed/types';
import type { CognitiveResult } from '../engines/cognitive/cognitiveEngine';
import type { DynamicStudentState } from './dynamicStudentState';
import type { TemporalStudentReport } from './temporalStudentIntelligence';


export function isPersonalLearningAdviceQuestion(message: string): boolean {
  const q = norm(message);
  return /\b(tien bo|cai thien|tap trung mon|tap trung vao|neu tap trung|mon nao|mon nay|mon do|mon hoc nao|yeu mon|hoc mon nao|on mon|uu tien mon|mon nao can|nen tap trung|diem mon nao|ke hoach hoc tap|lap ke hoach|lich hoc|thoi khoa bieu|phan bo thoi gian|hoc bao nhieu|ke hoach cua em|lo trinh hoc)\b/.test(q);
}

type LearningTranscriptState = {
  data: TranscriptView | null;
  status: 'loading'|'syncing'|'signed-out'|'empty'|'ready'|'error';
  source: 'student_transcripts'|'legacy'|null;
  userId: string|null;
};

type PersonalLearningContext = {
  transcript?: LearningTranscriptState | null;
  profile?: StudentProfile;
  cognitive?: CognitiveResult;
  dynamicState?: DynamicStudentState | null;
  temporalReport?: TemporalStudentReport | null;
  hasProfile?: boolean;
  loading?: boolean;
  syncing?: boolean;
};

const gradeLabel = (grade: string) => grade === 'grade10' ? 'Lớp 10' : grade === 'grade11' ? 'Lớp 11' : 'Lớp 12';
const semesterLabel = (semester: string) => semester === 'semester1' ? 'Học kỳ I' : 'Học kỳ II';
const finiteIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const hourLabel = (value: number) => (Math.round(value * 10) / 10).toFixed(1) + ' giờ';
const observedCognitive = (result: CognitiveResult | undefined, code: 'SCI'|'CSL'|'GVI'|'FRI'): number | null => {
  if (result?.scoreAvailable !== true || result.missingDimensions?.includes(code)) return null;
  const dimension = result.dimensions?.find(item => item.code === code);
  const value = result[code];
  return dimension?.available === true && finiteIn(value, 0, 100) ? value : null;
};

/** Build a weekly study plan from this account's verified transcript and observed study capacity.
 * Time is never invented: when weekly study hours are missing, the response gives priorities but no hour allocation.
 * Load adjustment thresholds are transparent planning heuristics, not validated intervention effects.
 */
export function answerPersonalLearningAdvice(context: PersonalLearningContext | null, uid: string): AdvisorLocalAnswer {
  const state = context?.transcript ?? null;
  if (!state || state.userId !== uid) {
    return {
      answer: 'Mình đang xác minh dữ liệu của tài khoản hiện tại nên chưa thể lập kế hoạch cá nhân. Hãy đợi hồ sơ tải xong rồi hỏi lại nhé.',
      destination: '/student/transcript',
      linkLabel: 'Mở bảng điểm',
    };
  }
  if (state.status === 'loading' || state.status === 'syncing') {
    return {
      answer: 'Bảng điểm của bạn đang được tải hoặc xác minh với máy chủ. Mình sẽ chưa xếp hạng môn học hay lập lịch từ dữ liệu chưa xác nhận; bạn thử gửi lại sau khi đồng bộ nhé.',
      destination: '/student/transcript',
      linkLabel: 'Kiểm tra trạng thái bảng điểm',
    };
  }
  if (state.status === 'error') {
    return {
      answer: 'Hiện mình chưa đọc được bảng điểm từ máy chủ nên không muốn đoán môn nào cần ưu tiên. Bạn hãy kiểm tra kết nối và trạng thái đồng bộ trong Seed rồi thử lại.',
      destination: '/student/transcript',
      linkLabel: 'Kiểm tra bảng điểm',
    };
  }
  if (state.status !== 'ready' || !state.data) {
    return {
      answer: 'Hồ sơ hiện chưa có bảng điểm đã xác minh. Bạn hãy nhập hoặc đồng bộ điểm trong Seed; khi có dữ liệu, mình sẽ xác định môn ưu tiên và xây kế hoạch theo quỹ thời gian thực tế.',
      destination: '/student/transcript',
      linkLabel: 'Bổ sung bảng điểm',
    };
  }

  // Use the newest term with any recorded grade. Never fall back to an older term
  // just because the newest term has incomplete marks.
  const terms = state.data.terms;
  let termIndex = -1;
  for (let i = terms.length - 1; i >= 0; i--) {
    if (terms[i].subjects.some(row => row.average !== null || row.provisional !== null)) {
      termIndex = i;
      break;
    }
  }
  if (termIndex < 0) {
    return {
      answer: 'Bảng điểm chưa có điểm quan sát được trong học kỳ nào. Mình chưa thể xác định môn ưu tiên; hãy nhập điểm học kỳ trong Seed trước nhé.',
      destination: '/student/transcript',
      linkLabel: 'Hoàn thiện bảng điểm',
    };
  }

  const term = terms[termIndex];
  const ranked = term.subjects
    .filter(row => finiteIn(row.average, 0, 10))
    .map(row => ({ subject: row.subject, score: row.average as number }))
    .sort((a, b) => a.score - b.score);
  if (!ranked.length) {
    return {
      answer: 'Học kỳ mới nhất có dữ liệu là ' + gradeLabel(term.grade) + ' · ' + semesterLabel(term.semester) + ', nhưng hiện chỉ có điểm tạm tính hoặc dữ liệu chưa hoàn chỉnh. Mình sẽ không dùng điểm tạm tính để xếp hạng. Hãy hoàn thiện điểm trung bình học kỳ rồi hỏi lại nhé.',
      destination: '/student/transcript',
      linkLabel: 'Hoàn thiện bảng điểm',
    };
  }

  const withTrend = ranked.map(item => {
    let previous: number | null = null;
    for (let i = termIndex - 1; i >= 0; i--) {
      const row = terms[i].subjects.find(candidate => candidate.subject === item.subject);
      if (row?.average !== null && row?.average !== undefined && finiteIn(row.average, 0, 10)) {
        previous = row.average;
        break;
      }
    }
    return { ...item, change: previous === null ? null : Math.round((item.score - previous) * 10) / 10 };
  });
  const priorities = withTrend.slice(0, Math.min(3, withTrend.length));
  const period = gradeLabel(term.grade) + ' · ' + semesterLabel(term.semester);
  const scoreList = priorities.map(item => item.subject + ': ' + item.score.toFixed(1) + '/10').join('; ');
  const trendText = priorities.flatMap(item => item.change === null ? [] : [
    item.change > 0 ? item.subject + ' tăng ' + item.change.toFixed(1) + ' điểm so với học kỳ có dữ liệu trước đó'
      : item.change < 0 ? item.subject + ' giảm ' + Math.abs(item.change).toFixed(1) + ' điểm so với học kỳ có dữ liệu trước đó'
      : item.subject + ' giữ nguyên điểm so với học kỳ có dữ liệu trước đó'
  ]).join('; ');
  const focusAdvice = priorities.length === 1
    ? priorities[0].subject + ' là môn duy nhất hiện có điểm trung bình hoàn chỉnh trong học kỳ mới nhất; chưa đủ dữ liệu để so sánh với các môn khác.'
    : 'Theo điểm trung bình hoàn chỉnh trong cùng học kỳ, ' + priorities.map(item => item.subject).join(', ') + ' là nhóm môn nên ưu tiên rà soát trước. Thứ tự được xếp theo điểm hiện tại từ thấp lên cao, không phải theo độ quan trọng của tổ hợp xét tuyển.';

  const profileReady = context?.hasProfile === true && context.loading !== true && context.syncing !== true;
  const profile = profileReady ? context?.profile : undefined;
  const behavior = profileReady ? context?.dynamicState?.behavior : undefined;
  const profileHours = profile && finiteIn(profile.studyHoursPerWeek, 0.01, 168) ? profile.studyHoursPerWeek : null;
  const hours = behavior?.hours !== null && behavior?.hours !== undefined
    ? (finiteIn(behavior.hours, 0, 168) ? behavior.hours : null)
    : profileHours;
  const practice = behavior?.practice !== null && behavior?.practice !== undefined
    ? (finiteIn(behavior.practice, 0, 100) ? behavior.practice : null)
    : profile && finiteIn(profile.practiceTestsPerWeek, 0.01, 100) ? profile.practiceTestsPerWeek : null;
  const completion = behavior?.completion !== null && behavior?.completion !== undefined
    ? (finiteIn(behavior.completion, 0, 100) ? behavior.completion : null)
    : profile && finiteIn(profile.planCompletionRate, 0.01, 100) ? profile.planCompletionRate : null;
  const motivation = behavior?.motivation !== null && behavior?.motivation !== undefined
    ? (finiteIn(behavior.motivation, 0, 100) ? behavior.motivation : null)
    : profile && finiteIn(profile.motivationLevel, 0.01, 100) ? profile.motivationLevel : null;

  let loadFactor = 1;
  const loadReasons: string[] = [];
  if (completion !== null && completion < 50) {
    loadFactor = Math.min(loadFactor, 0.75);
    loadReasons.push('Tỷ lệ hoàn thành kế hoạch hiện ghi nhận ' + completion.toFixed(0) + '%, nên CLA tạm giảm 25% khối lượng so với quỹ giờ tự báo cáo.');
  } else if (completion !== null && completion < 70) {
    loadFactor = Math.min(loadFactor, 0.9);
    loadReasons.push('Tỷ lệ hoàn thành hiện ghi nhận ' + completion.toFixed(0) + '%, nên CLA tạm giảm 10% khối lượng để dễ duy trì.');
  }
  const abandonment = profileReady && profile && finiteIn(profile.taskAbandonmentRate, 0, 100) ? profile.taskAbandonmentRate : null;
  const contextSwitch = profileReady && profile && finiteIn(profile.contextSwitchRate, 0, 100) ? profile.contextSwitchRate : null;
  const goalSwitch = profileReady && profile && finiteIn(profile.goalSwitchFrequency, 0, 1000) ? profile.goalSwitchFrequency : null;
  if (abandonment !== null && abandonment >= 50) {
    loadFactor = Math.min(loadFactor, 0.85);
    loadReasons.push('Tỷ lệ bỏ dở nhiệm vụ tự báo cáo là ' + abandonment.toFixed(0) + '%, nên chia nhỏ đầu việc và tránh tăng tải.');
  }
  const temporal = profileReady ? context?.temporalReport ?? null : null;
  const completionTrend = temporal?.status === 'DESCRIPTIVE'
    ? temporal.series.find(item => item.metric === 'planCompletionRate' && item.status === 'DESCRIPTIVE')?.delta ?? null
    : null;
  if (completionTrend !== null && finiteIn(completionTrend, -100, 100) && completionTrend <= -10) {
    loadFactor = Math.min(loadFactor, 0.85);
    loadReasons.push('Chuỗi quan sát lịch sử ghi nhận tỷ lệ hoàn thành giảm ' + Math.abs(completionTrend).toFixed(1) + ' điểm; CLA giữ khối lượng thận trọng thay vì tăng tải.');
  }
  const plannedHours = hours !== null && hours > 0 ? hours * loadFactor : null;
  const selectedMax = priorities[priorities.length - 1].score;
  const weights = priorities.map(item => Math.max(0.5, selectedMax - item.score + 0.5));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let allocatedHours = 0;
  const allocation = priorities.map((item, index) => {
    const hoursForSubject = plannedHours === null ? null : index === priorities.length - 1
      ? Math.round((plannedHours - allocatedHours) * 10) / 10
      : Math.round((plannedHours * weights[index] / weightTotal) * 10) / 10;
    if (hoursForSubject !== null) allocatedHours += hoursForSubject;
    return { ...item, hours: hoursForSubject };
  });

  const planLines: string[] = [];
  if (hours !== null && hours > 0 && plannedHours !== null) {
    planLines.push('Quỹ học hiện tại bạn tự báo cáo: ' + hours.toFixed(1) + ' giờ/tuần. CLA đề xuất phân bổ khoảng ' + plannedHours.toFixed(1) + ' giờ/tuần cho nhóm môn ưu tiên' + (loadFactor < 1 ? ' (hệ số điều chỉnh ' + loadFactor.toFixed(2) + ')' : '') + '.');
  } else if (hours === 0) {
    planLines.push('Hồ sơ hiện ghi nhận 0 giờ học/tuần. Mình chưa tự đặt số giờ thay bạn; hãy cập nhật quỹ thời gian học thực tế trong Seed để CLA chia lịch.');
  } else {
    planLines.push('Hồ sơ chưa có số giờ học/tuần đã xác minh, nên mình chỉ xác định thứ tự ưu tiên, chưa tự gán số buổi hoặc thời lượng. Hãy bổ sung thời gian học thực tế trong Seed để nhận lịch phân bổ cụ thể.');
  }

  const adaptation: string[] = [];
  if (completion !== null && completion >= 70) adaptation.push('Tỷ lệ hoàn thành kế hoạch đang ở mức ' + completion.toFixed(0) + '%; trước mắt giữ nhịp hiện tại, chưa tự tăng khối lượng.');
  if (completionTrend !== null && finiteIn(completionTrend, -100, 100) && completionTrend >= 10) adaptation.push('Chuỗi quan sát lịch sử ghi nhận tỷ lệ hoàn thành tăng ' + completionTrend.toFixed(1) + ' điểm; duy trì cách học hiện tại và xác nhận bằng chu kỳ tiếp theo trước khi tăng tải.');
  if (motivation !== null && motivation < 40) adaptation.push('Mức động lực tự báo cáo là ' + motivation.toFixed(0) + '/100; chia mỗi môn thành các đầu việc nhỏ, có điểm kết thúc rõ ràng.');
  if (contextSwitch !== null && contextSwitch >= 50) adaptation.push('Tần suất chuyển ngữ cảnh tự báo cáo là ' + contextSwitch.toFixed(0) + '%; học từng môn trong một phiên riêng, hạn chế đổi môn giữa chừng.');
  if (goalSwitch !== null && goalSwitch >= 3) adaptation.push('Bạn ghi nhận ' + goalSwitch.toFixed(0) + ' lần đổi mục tiêu/tháng; giữ nguyên mục tiêu học trong chu kỳ tuần này và ghi lý do trước khi đổi.');
  if (practice !== null && practice > 0) adaptation.push('Bạn đang tự báo cáo ' + practice.toFixed(1) + ' bài thi thử/tuần; kế hoạch giữ mức luyện hiện tại và ưu tiên bài kiểm tra cho ' + priorities[0].subject + ' trước.');
  else if (practice === 0) adaptation.push('Hồ sơ ghi nhận hiện chưa có bài thi thử/tuần; ưu tiên bài tập theo chuyên đề và rà lỗi trước khi thêm đề thi thử toàn diện.');

  const sci = observedCognitive(context?.cognitive, 'SCI');
  const csl = observedCognitive(context?.cognitive, 'CSL');
  const gvi = observedCognitive(context?.cognitive, 'GVI');
  const fri = observedCognitive(context?.cognitive, 'FRI');
  if (sci !== null && sci < 60) adaptation.push('SCI proxy (' + sci + '/100) đang dưới ngưỡng gợi ý thử nghiệm; chia mục tiêu tuần thành 2–3 đầu việc nhỏ và ghi nhận việc hoàn thành.');
  if (csl !== null && csl < 60) adaptation.push('CSL proxy (' + csl + '/100) phản ánh tín hiệu về chiến lược học tập tự báo cáo; thử giữ một khung giờ học ổn định để quan sát khả năng duy trì.');
  if (gvi !== null && gvi >= 60) adaptation.push('GVI proxy (' + gvi + '/100) là tín hiệu thay đổi mục tiêu; ghi lý do trước khi điều chỉnh và tránh đổi trọng tâm liên tục trong tuần.');
  if (fri !== null && fri >= 60) adaptation.push('FRI proxy (' + fri + '/100) là tín hiệu hành vi cần rà soát; không tăng tải chỉ vì muốn học nhanh hơn, hãy kiểm tra lịch học và thời gian nghỉ.');
  if (abandonment !== null && abandonment >= 50) adaptation.push('Vì tỷ lệ bỏ dở nhiệm vụ tương đối cao theo tự báo cáo, mỗi phiên chỉ nên chốt một kết quả nhỏ có thể kiểm tra.');
  if (context?.dynamicState?.scope === 'demo') adaptation.push('Lưu ý: hồ sơ đang ở phạm vi DEMO; kế hoạch chỉ minh họa theo dữ liệu demo, không đại diện cho kết quả học tập thực đã xác minh.');

  const nextStep = practice !== null && practice > 0
    ? 'Dùng một trong các bài luyện hiện có để kiểm tra lại ' + priorities[0].subject + ', rồi so sánh điểm với lần gần nhất.'
    : 'Sau khi ôn xong mỗi phần của ' + priorities[0].subject + ', làm một bài kiểm tra ngắn theo chuyên đề và ghi lại nhóm lỗi.';
  const trendLine = trendText ? '\n\nDiễn biến so với học kỳ có dữ liệu trước: ' + trendText + '.' : '';
  const profileGoal = profile?.targetMajor && profile.targetMajor !== '--'
    ? ' Mục tiêu ngành đã ghi nhận: ' + profile.targetMajor + '; hiện chưa có dữ liệu trọng số môn xét tuyển đã xác minh trong ngữ cảnh này, nên CLA không tự gán độ quan trọng cho môn.'
    : '';
  const dataLimit = 'Chưa có dữ liệu điểm theo chương, dạng bài hoặc câu sai; vì vậy CLA chưa thể chỉ định chính xác chương cần ôn. Hồ sơ cũng chưa có lịch rảnh theo từng ngày/khung giờ, nên kế hoạch chỉ phân bổ quỹ giờ theo môn, chưa tự gán thứ hoặc giờ học. Điểm học kỳ không tự chứng minh nguyên nhân yếu hay dự báo điểm thi.';
  const legacyNote = state.source === 'legacy'
    ? ' Bảng điểm đang lấy từ hồ sơ lịch sử ở chế độ chỉ đọc; hãy chuẩn hóa hồ sơ trong Seed trước khi xem đây là dữ liệu hiện hành.'
    : '';

  return {
    answer: 'Mình đã đối chiếu bảng điểm đã đồng bộ ở ' + period + '.\n\nMÔN CẦN ƯU TIÊN\n' + scoreList + '. ' + focusAdvice + trendLine + '\n\nKẾ HOẠCH TUẦN ĐƯỢC TÍNH TỪ DỮ LIỆU CỦA BẠN\n' + planLines.join('\n') + '\n' + allocation.map(item => '- ' + item.subject + ': ' + item.score.toFixed(1) + '/10' + (item.change === null ? '' : ' (' + (item.change > 0 ? '+' : '') + item.change.toFixed(1) + ' so với kỳ có dữ liệu trước)') + (item.hours === null ? '' : ' · khoảng ' + hourLabel(item.hours) + ' mỗi tuần')).join('\n') + '\n\nĐIỀU CHỈNH THEO THÓI QUEN ĐÃ GHI NHẬN\n' + ([...loadReasons, ...adaptation].length ? [...loadReasons, ...adaptation].join('\n') : 'Chưa có đủ dữ liệu hành vi để điều chỉnh thêm; kế hoạch hiện chỉ dựa trên bảng điểm.') + '\n\nCÁCH TRIỂN KHAI: ưu tiên môn có điểm thấp nhất trước; với từng môn, ôn phần đã mất điểm, luyện theo chuyên đề và ghi lại lỗi để kiểm tra lại. ' + nextStep + '\n\n' + dataLimit + profileGoal + legacyNote + '\n\nGiờ phân bổ được tính theo khoảng cách điểm giữa các môn trong nhóm ưu tiên; các hệ số điều chỉnh là quy tắc lập kế hoạch thử nghiệm của CLA, không phải kết quả can thiệp đã được kiểm định.',
    destination: '/student/transcript',
    linkLabel: 'Xem bảng điểm chi tiết',
  };
}

export function remoteAdvisorTurns<T extends {remote?:boolean}>(turns:readonly T[]):T[]{
  let start=turns.length;while(start>0&&turns[start-1].remote===true)start--;
  return turns.slice(start);
}
