import type {DynamicStudentState} from './dynamicStudentState.ts';
import type {TemporalStudentReport} from './temporalStudentIntelligence.ts';
import {diagnoseTemporal,TEMPORAL_DIAGNOSTICS_VERSION} from './temporalDiagnostics.ts';
export const HOLISTIC_ROADMAP_VERSION='cla-holistic-roadmap-v1';
export type RoadmapTask={id:string;title:string;reason:string;link:string;week:number;source:string};
/** Review agenda only. No automatic edits, hard deadlines, diagnosis, or admission claims. */
export function buildHolisticRoadmap(state:DynamicStudentState|null, temporal:TemporalStudentReport|null,weeks:number,options:{abroad:boolean;scholarship:boolean;reconsiderGoal:boolean}):{version:string;tasks:RoadmapTask[];reason:string;sourceVersion:string|null} {
 const empty={version:HOLISTIC_ROADMAP_VERSION,tasks:[] as RoadmapTask[],reason:'MISSING_STATE_OR_HORIZON',sourceVersion:null};
 if(!state||!Number.isInteger(weeks)||weeks<1||weeks>104)return empty;
 const tasks:RoadmapTask[]=[]; const add=(id:string,title:string,reason:string,link:string,week:number,source='Seed · '+state.sourceVersion)=>tasks.push({id,title,reason,link,week:Math.max(1,Math.min(weeks,week)),source});
 const middle=Math.max(1,Math.ceil(weeks/2));
 const acute=temporal?.status==='DESCRIPTIVE'?temporal.series.filter(s=>s.metric==='studyHoursPerWeek'||s.metric==='planCompletionRate'||s.metric==='motivationLevel').flatMap(s=>{const d=diagnoseTemporal(s);return (d.latest?.flag||d.change||d.direction==='DOWN')?[s.metric]:[]}):[];
 if(acute.length) add('review-behavior','Xem lại khả năng duy trì kế hoạch','Có biến động mô tả ở dữ liệu tự báo cáo; xem nguyên nhân và cân nhắc giữ/giảm tải. Không suy ra quá tải hoặc tác động.', '/orion',1,`Lumen · ${TEMPORAL_DIAGNOSTICS_VERSION} · ${acute.join(', ')}`);
 if(!state.goals.major||!state.goals.university||options.reconsiderGoal)add('review-goals','Xác định lại ngành và trường mục tiêu',options.reconsiderGoal?'Bạn muốn xem xét lại ưu tiên.':'Hồ sơ chưa có đủ ngành và trường mục tiêu.','/atlas/recommendations',1);
 add('review-academic','Đối chiếu điểm từng môn và mục tiêu',state.academic.overall===null?'GPA tổng hợp chưa có; bổ sung và kiểm tra điểm gốc.':'Có GPA tổng hợp; dùng bảng điểm từng môn để lập chiến lược.','/student/transcript',1);
 add('verify-admission','Kiểm tra điều kiện tuyển sinh và phương án dự phòng','Đối chiếu ngành, trường, năm và phương thức với nguồn chính thức; không coi kết quả gợi ý là đủ điều kiện.','/atlas/vietnam',1,'Yêu cầu rà soát · chưa xác minh tuyển sinh');
 add('plan-strategy','Mô phỏng chiến lược trong thời hạn còn lại','So sánh Pareto, độ bền lựa chọn và ngân sách thời gian trước khi xác nhận.', '/orion/scenarios',middle,'Orion · kế hoạch do học sinh lựa chọn');
 if(state.finance.budget===null||state.finance.maxTuition===null||options.abroad||options.scholarship)add('finance','Đối chiếu chi phí và ngân sách thực tế','Tách chi phí đã biết, khoản chưa rõ và học bổng chưa xác nhận; không suy diễn khả năng chi trả.', '/haven/finance',1);
 else add('finance','Kiểm tra lại ngân sách khi chốt nguyện vọng','Có giới hạn ngân sách và học phí trong Seed; kiểm tra kỳ hạn và chi phí thực tế.', '/haven/finance',middle);
 if(options.scholarship)add('scholarship','Đối chiếu học bổng và hạn nộp','Chỉ xem xét khoản hỗ trợ có nguồn và điều kiện rõ; chưa xác nhận thì không trừ vào chi phí chắc chắn.', '/haven/scholarships',1,'Ưu tiên do học sinh chọn');
 if(options.abroad)add('abroad','Đối chiếu yêu cầu du học','Kiểm tra chứng chỉ, chi phí, visa và thời hạn từ trường/cơ quan chính thức.', '/atlas/study-abroad',1,'Ưu tiên do học sinh chọn');
 add('feedback','Đánh giá lại chu kỳ và cập nhật ưu tiên','Đối chiếu kế hoạch với check-in thực tế; tự xác nhận thay đổi chu kỳ tiếp theo.', '/pulse/checkin',weeks,'Pulse · kết quả chưa quan sát');
 return {version:HOLISTIC_ROADMAP_VERSION,tasks:tasks.sort((a,b)=>a.week-b.week),reason:'REVIEW_ONLY',sourceVersion:state.sourceVersion};
}
