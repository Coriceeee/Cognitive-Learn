/** Versioned public CLA knowledge cards. Lexical retrieval, not an LLM or external search. */
export const CLA_KNOWLEDGE_VERSION = 'cla-knowledge-v1';
export const CLA_KNOWLEDGE = [
 {id:'CLA-K01',title:'SCI',aliases:['sci','self coherence index','nhat quan hanh dong'],text:'SCI (Self Coherence Index) hiện là proxy từ hoàn thành hoặc nhất quán hành động. Chưa được kiểm định như thang đo tâm lý.',ref:'src/lib/cognitiveAdapter.ts · cla-cognitive-proxy-v2'},
 {id:'CLA-K02',title:'MAS',aliases:['mas','meaning alignment score','chi bao dong luc'],text:'MAS (Meaning Alignment Score trong giao diện hiện tại) là proxy động lực tự báo cáo. Công thức nghiên cứu dự kiến mở rộng sang kiên trì và duy trì hành động; hai cách đo chưa tương đương.',ref:'src/lib/cognitiveResearchReadiness.ts · cla-cognitive-proxy-v2'},
 {id:'CLA-K03',title:'CSL',aliases:['csl','cognitive stability level','chi bao on dinh'],text:'CSL (Cognitive Stability Level) hiện dùng tín hiệu chiến lược học tập được cung cấp. Chưa đủ căn cứ để diễn giải thành độ ổn định nhận thức đã kiểm định.',ref:'src/lib/cognitiveAdapter.ts · cla-cognitive-proxy-v2'},
 {id:'CLA-K04',title:'Proxy và kiểm định',aliases:['proxy','tam trac','psychometric','kiem dinh thang do'],text:'Proxy là chỉ báo thay thế thử nghiệm. Để gọi SCI/MAS/CSL đã kiểm định cần dữ liệu và bằng chứng reliability/validity phù hợp; test phần mềm không thay thế kiểm định đó.',ref:'src/lib/cognitiveResearchReadiness.ts · research boundary'},
 {id:'CLA-K05',title:'Fit và xác suất',aliases:['fit score','xac suat','probability','diem phu hop'],text:'Fit score là điểm theo quy tắc đối chiếu, không phải xác suất. Xác suất cá nhân cần mô hình có nhãn outcome và kiểm định calibration. Không có cơ sở để cam kết trúng tuyển chỉ từ điểm phù hợp.',ref:'src/lib/atlasDecisionComparison.ts · comparisonVersion'},
 {id:'CLA-K06',title:'Mô phỏng',aliases:['mo phong','simulation','kich ban'],text:'Mô phỏng so sánh các phương án theo mô hình và giả định hiện tại. Kết quả không phải cam kết tăng điểm hay bằng chứng quan hệ nhân quả.',ref:'Master Protocol v1.0 · §11 Simulation Validation'},
 {id:'CLA-K07',title:'Closed loop',aliases:['closed loop','closed-loop','vong lap','adaptive guidance'],text:'Vòng lặp mục tiêu của CLA là hiểu trạng thái, dự báo, mô phỏng, hỗ trợ quyết định, can thiệp, đo kết quả, học từ kết quả và thích ứng. Demo kỹ thuật không chứng minh hiệu quả học tập.',ref:'Final Supplement · §3 Closed-Loop Cognitive Guidance'},
 {id:'CLA-K08',title:'Lịch sử và tiến bộ',aliases:['lich su cognitive','lich su nhan thuc','xu huong','tien bo'],text:'Cần nhiều lần đo hợp lệ và so sánh phù hợp để diễn giải xu hướng. Một snapshot đơn lẻ không chứng minh tiến bộ hoặc tác động của CLA.',ref:'src/engines/cognitive/cognitiveEngine.ts · trend UNKNOWN'},
 {id:'CLA-K09',title:'Dữ liệu thiếu',aliases:['du lieu thieu','thieu du lieu','missing data','diem 0','so 0 ky thuat'],text:'Số 0 có thể là giá trị hợp lệ nếu nguồn xác nhận đã đo. Số 0 kỹ thuật ở chiều chưa đo không được diễn giải thành kết quả; giao diện cần thể hiện thiếu dữ liệu.',ref:'src/lib/cognitiveAdapter.ts · availableDimensions'},
 {id:'CLA-K10',title:'Machine Learning',aliases:['machine learning','hoc may','ml','ablation'],text:'Pipeline nghiên cứu so sánh baseline và mô hình học máy trên tập kiểm tra tách biệt. Dữ liệu quốc tế không tự xác nhận hiệu lực trên học sinh THPT Việt Nam; không dùng synthetic để báo hiệu quả thực tế.',ref:'research/src/uci_ml_comparison.py · Master Protocol §10'},
] as const;
export type KnowledgeId = typeof CLA_KNOWLEDGE[number]['id'];
export type KnowledgeCard = typeof CLA_KNOWLEDGE[number];
const normalise=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9-]+/g,' ').trim();
function contains(text:string,phrase:string){return ` ${text} `.includes(` ${phrase} `);}
/** Deliberately narrow educational help. This is not a general-purpose safety filter. */
export function retrieveClaKnowledge(question:unknown):KnowledgeCard[]{
 if(typeof question!=='string'||question.length>500||/[\p{Cc}\p{Cf}]/u.test(question))return [];
 const q=normalise(question);
 if(/\b(ignore|override|system prompt|jailbreak|bo qua|ghi de|tiet lo|mat khau|token|api key|chan doan|tu tu|tu hai|email|uid|so dien thoai|benh)\b/.test(q)|| /\bthuoc\b/.test(q.replace(/\bthuoc do\b/g,"")) || /@|https?:|\d{4,}/i.test(question))return [];
 if(!/\b(la gi|nghia la|y nghia|dinh nghia|giai thich|hieu the nao|the nao|khac gi|dung de|cho biet|noi ve|hoat dong|vi sao|tai sao|co phai|can gi|can bao nhieu|duoc kiem dinh|co du lieu|do luong|kiem tra|co the|co nghia|da kiem dinh|duyet)\b/.test(q)&&!CLA_KNOWLEDGE.some(c=>c.aliases.some(a=>q===a)))return [];
 // Public domain definitions only; no personal score/diagnosis, predictions or current institution facts.
 if(/\b(cua toi|cua em|cua minh|toi co|em co|may diem|bao nhieu diem|nam nay|truong nao|hoc bong nao|chac chan|ti le dau|xac suat do|xac suat dau)\b/.test(q)||/\d/.test(q.replace(/(?:diem|so) 0/g,'')))return [];
 const found=CLA_KNOWLEDGE.filter(c=>c.aliases.some(a=>contains(q,a)));
 return found.length>3?[]:found;
}
export function answerClaKnowledge(question:unknown){
 if(typeof question!=="string")return null;
 const q=normalise(question);

 // Advice-seeking questions must not be intercepted by the K08 trend-definition card.
 // Give the learner safe, actionable guidance without pretending to know their scores.
 const asksForImprovement=/\b(lam sao|cach nao|cach de|nen lam gi|can lam gi|de cai thien|cai thien|tien bo hon|hoc tot hon|tang diem|khac phuc diem yeu)\b/.test(q);
 if(asksForImprovement){
  return {
   answer:"Để tiến bộ, bạn hãy bắt đầu từ một mục tiêu nhỏ và cụ thể: chọn một môn học hoặc thói quen muốn cải thiện, xác định việc có thể thực hiện mỗi ngày, rồi ghi lại kết quả theo tuần. Sau mỗi lần ghi nhận, xem điều gì đã hiệu quả và điều gì cần điều chỉnh. Với Lumen, một lần phân tích chỉ phản ánh trạng thái tại thời điểm đó; cần nhiều lần đo hợp lệ trong điều kiện tương đương mới có thể nhận xét xu hướng.\n\nBạn muốn cải thiện điểm số môn học, khả năng tập trung hay mức độ hoàn thành kế hoạch? Mình có thể giúp bạn lập các bước phù hợp.",
   evidenceIds:["CLA-K08"], version:CLA_KNOWLEDGE_VERSION, mode:"LOCAL_GUIDANCE" as const
  };
 }
 const cards=retrieveClaKnowledge(question);
 if(!cards.length)return null;
 // Keep internal evidence IDs and source paths in metadata, never in student-facing prose.
 return {answer:cards.map(c=>c.text).join("\n\n"), evidenceIds:cards.map(c=>c.id), version:CLA_KNOWLEDGE_VERSION, mode:"LOCAL_KNOWLEDGE" as const};
}
/** A model may select cards only. It cannot add claims, change scores or fabricate citations. */
export function validateKnowledgeSelection(raw:unknown, permitted:readonly KnowledgeId[]):KnowledgeId[]|null{
 if(typeof raw!=='object'||raw===null||Array.isArray(raw))return null;
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).length!==1||!Array.isArray(r.evidenceIds)||r.evidenceIds.length>3||new Set(r.evidenceIds).size!==r.evidenceIds.length)return null;
 if(!r.evidenceIds.every(x=>typeof x==='string'&&permitted.includes(x as KnowledgeId)))return null;
 return r.evidenceIds as KnowledgeId[];
}
