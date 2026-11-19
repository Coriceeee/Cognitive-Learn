import { MetricBar } from '../../../components/common/charts/AnalyticCharts';
import { useState } from 'react';
import { exploreCareer, careerSubjectLabels, type InterestRatings } from '../../../lib/careerExploration';
import type { InterestDomainId, SchoolEvidence } from '../../../lib/atlasPersonalMatching';
type Props={evidence:SchoolEvidence|null;onExplore:(domain:InterestDomainId)=>void};
export default function AtlasCareerExploration({evidence,onExplore}:Props){
 const [ratings,setRatings]=useState<InterestRatings>({});
 const [combine,setCombine]=useState(false); const [weight,setWeight]=useState(50);
 const result=exploreCareer(ratings,evidence,combine?weight:null);
 return <details className="cla-major-card" id="atlas-career-exploration"><summary>Career Fit Intelligence · khám phá nghề theo hai chiều</summary>
 <p>Chọn mức yêu thích từng nhóm hoạt động (0–4). Nếu bật điểm Seed ở trên, hệ thống đối chiếu các môn tham khảo trong cùng học kỳ. Hai chiều khác nhau, không phải phép đo tâm lý.</p>
 <p>{evidence?`Nguồn học tập: ${evidence.termLabel} · ${evidence.source==='legacy'?'hồ sơ cũ đã đối soát':'Seed'}`:'Chưa bật dữ liệu Seed; vẫn có thể khám phá sở thích.'}</p>
 <label><input type="checkbox" checked={combine} onChange={e=>setCombine(e.target.checked)}/> Hiển thị chỉ số ưu tiên do tôi chọn (không phải Career Fit đã kiểm định)</label>
 {combine&&<><label>Trọng số sở thích: {weight}% · học lực: {100-weight}%<input type="range" min={0} max={100} step={5} value={weight} onChange={e=>setWeight(Number(e.target.value))}/></label><p role="status">{result.comparableCount}/9 nhóm đủ cả hai chiều; không xếp hạng các nhóm thiếu dữ liệu.</p>{result.comparableCount>=2&&<p>Ưu tiên cao nhất theo trọng số đã chọn, chỉ trong các nhóm đủ dữ liệu: {result.rows.filter(r=>result.highestPreferenceIds.includes(r.id)).map(r=>r.label).join('; ')}. Đây không phải kết luận nghề phù hợp nhất.</p>}</>}
 <div className="cla-viz-legend"><span className="is-blue">Sở thích</span><span className="is-teal">Học lực tham khảo</span>{combine&&<span className="is-violet">Ưu tiên tự chọn</span>} · thang 100</div><div className="cla-viz-rows">{result.rows.map(r=><div className="cla-viz-row" key={r.id}><div><h3>{r.label}</h3>
 <label>Mức yêu thích<select value={ratings[r.id]===undefined?'':String(ratings[r.id])} onChange={e=>{const v=e.target.value;setRatings(prev=>({...prev,[r.id]:v===''?undefined:Number(v)}));}}><option value="">Chưa chọn</option>{[0,1,2,3,4].map(i=><option value={i} key={i}>{i} — {['Không thích','Ít thích','Trung lập','Khá thích','Rất thích'][i]}</option>)}</select></label></div>
 <div className="cla-viz-pair"><MetricBar label={`${r.label} · Sở thích`} value={r.interest} max={100} missing="Chưa đánh giá"/><MetricBar label={`${r.label} · Học lực`} value={r.academic} max={100} tone="teal" missing="Chưa đủ / không áp dụng"/>{combine&&<MetricBar label={`${r.label} · Ưu tiên`} value={r.preferenceIndex} max={100} tone="violet" missing="Không tính"/>}</div>
 <details><summary>Chi tiết môn học và trải nghiệm</summary>
 {r.subjects.length>0?<p>{r.subjects.map(s=>`${careerSubjectLabels[s.code]}: ${s.score===null?'chưa có':s.score.toFixed(1)}`).join(' · ')}</p>:<p>Nhóm này quá rộng để gắn với một bộ môn học cố định.</p>}
 {combine&&<p>Chỉ số ưu tiên: {r.preferenceIndex===null?'Không tính':`${r.preferenceIndex}/100 (sở thích ${r.interestContribution} + học lực ${r.academicContribution}, làm tròn)`}</p>}
 <small>Trải nghiệm gợi ý: {r.action}</small><p><button type="button" className="cla-study-jump" onClick={()=>onExplore(r.id)}>Tìm ngành liên quan trong Atlas</button></p></details></div>)}</div>
 <p className="cla-source-caution">{result.version} · {result.limitations.join(' ')} Các đánh giá chỉ tồn tại trong phiên giao diện, không lưu hoặc gửi tới AI.</p></details>;
}
