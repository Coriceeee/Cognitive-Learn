import { interestDomains, type InterestDomainId, type SchoolEvidence } from './atlasPersonalMatching.ts';
import type { SubjectCode } from './admissionTypes.ts';

export const CAREER_EXPLORATION_VERSION = 'career-exploration-rubric-v1';
// Illustrative school-subject links, not admissions criteria or occupational requirements.
const rubric: Record<InterestDomainId, {subjects: readonly SubjectCode[]; action: string}> = {
 technology:{subjects:['math','informatics'],action:'Thử xây một chương trình nhỏ và giải thích cách hoạt động.'},
 engineering:{subjects:['math','physics'],action:'Thử thiết kế và kiểm tra một mô hình kỹ thuật.'},
 health:{subjects:['biology','chemistry'],action:'Tìm hiểu một chủ đề sinh học và nghề chăm sóc sức khỏe.'},
 business:{subjects:['math','civicEducation'],action:'Lập ngân sách và phân tích một tình huống kinh doanh.'},
 humanities:{subjects:['literature','history'],action:'Thử viết bài phân tích hoặc thực hiện một dự án ngôn ngữ.'},
 education:{subjects:[],action:'Thử soạn một bài giảng nhỏ về môn bạn yêu thích.'},
 science:{subjects:['math','physics','chemistry'],action:'Đặt giả thuyết và thiết kế một thí nghiệm an toàn.'},
 law:{subjects:['literature','civicEducation'],action:'Đọc một tình huống pháp lý và trình bày các lập luận.'},
 creative:{subjects:[],action:'Phát triển một sản phẩm sáng tạo hoặc hồ sơ tác phẩm nhỏ.'},
};
export const careerSubjectLabels:Record<SubjectCode,string>={math:'Toán',literature:'Ngữ văn',english:'Tiếng Anh',physics:'Vật lý',chemistry:'Hóa học',biology:'Sinh học',history:'Lịch sử',geography:'Địa lý',civicEducation:'Giáo dục kinh tế và pháp luật',informatics:'Tin học',technology:'Công nghệ'};
export type InterestRatings = Partial<Record<InterestDomainId, number>>;
const valid = (x:unknown,max:number):x is number => typeof x==='number' && Number.isFinite(x) && x>=0 && x<=max;
const round = (n:number)=>Math.round(n*100)/100;
/** Local decision aid. Two axes are intentionally not merged into a career suitability probability. */
export function exploreCareer(ratings:InterestRatings,evidence:SchoolEvidence|null,interestWeight:number|null){
 const weight=valid(interestWeight,100)?interestWeight:null;
 const verified=!!evidence && !!evidence.termId.trim() && !!evidence.termLabel.trim() && ['student_transcripts','legacy'].includes(evidence.source);
 const rows=interestDomains.map(d=>{
  const r=rubric[d.id]; const raw=ratings[d.id];
  const interest=valid(raw,4)&&Number.isInteger(raw)?raw*25:null;
  const subjects=r.subjects.map(code=>({code,score:verified&&valid(evidence?.scores[code],10)?evidence!.scores[code]!:null}));
  const academic=subjects.length&&subjects.every(s=>s.score!==null)?round(subjects.reduce((s,x)=>s+x.score!,0)/subjects.length*10):null;
  const status=subjects.length===0?'NOT_APPLICABLE':academic!==null?'COMPLETE':'INSUFFICIENT_DATA';
  const preferenceIndex=weight!==null&&interest!==null&&academic!==null?round(interest*weight/100+academic*(100-weight)/100):null;
  return {id:d.id,label:d.label,interest,academic,subjects,status,preferenceIndex,interestContribution:preferenceIndex===null?null:round(interest!*weight!/100),academicContribution:preferenceIndex===null?null:round(academic!*(100-weight!)/100),action:r.action,termLabel:verified?evidence!.termLabel:null,source:verified?evidence!.source:null};
 });
 const comparable=rows.filter(r=>r.preferenceIndex!==null);
 const highest=comparable.length?Math.max(...comparable.map(r=>r.preferenceIndex!)):null;
 return {version:CAREER_EXPLORATION_VERSION,weight,rows,comparableCount:comparable.length,highestPreferenceIds:comparable.filter(r=>r.preferenceIndex===highest).map(r=>r.id),probability:null,limitations:['Rubric khám phá do CLA đề xuất; chưa kiểm định tâm trắc hoặc dự báo thành công nghề nghiệp.','Điểm học kỳ không phải năng lực nghề, điều kiện tuyển sinh hay điểm thi. Không loại ngành khi thiếu môn.','Không dùng SCI/MAS/CSL, tài chính hoặc thuộc tính nhạy cảm để xếp hạng nghề.']};
}
