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
export function remoteAdvisorTurns<T extends {remote?:boolean}>(turns:readonly T[]):T[]{
  let start=turns.length;while(start>0&&turns[start-1].remote===true)start--;
  return turns.slice(start);
}
