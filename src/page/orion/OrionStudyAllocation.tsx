import {useState} from 'react';
import {MetricBar,chartNumber} from '../../components/common/charts/AnalyticCharts';
import {allocateStudyTime,type AllocationSubject} from '../../lib/studyTimeAllocation';
import type {OrionScenario} from '../../lib/orionStrategyEngine';
export default function OrionStudyAllocation({subjects,eligible}:{subjects:readonly AllocationSubject[];eligible:readonly OrionScenario[]}){
 const [picked,setPicked]=useState('');const [maintenance,setMaintenance]=useState('0');
 const selected=eligible.find(s=>s.id===picked);
 const result=selected&&maintenance.trim()!==''?allocateStudyTime(subjects,selected.weeklyHours,Number(maintenance)):null;
 return <section className="orion-tradeoff-panel cla-viz-allocation" aria-labelledby="orion-allocation-title">
  <div className="orion-tradeoff-heading"><div><span>ORION · TIME ALLOCATION</span><h2 id="orion-allocation-title">Phân bổ giờ học theo môn</h2><p>Chọn một phương án đáp ứng giới hạn phía trên. Phần giờ dư được ưu tiên theo khoảng cách điểm và lợi ích biên giảm dần của hàm mục tiêu kỹ thuật.</p></div></div>
  <div className="cla-viz-select"><label htmlFor="orion-allocation-scenario">Phương án</label><select id="orion-allocation-scenario" value={selected?picked:''} onChange={e=>setPicked(e.target.value)}><option value="">Chọn phương án</option>{eligible.map(s=><option value={s.id} key={s.id}>{s.title} · {s.weeklyHours} giờ/tuần</option>)}</select><label htmlFor="orion-maintenance">Giờ duy trì mỗi môn</label><input id="orion-maintenance" type="number" min="0" max="168" step="0.5" value={maintenance} onChange={e=>setMaintenance(e.target.value)}/></div>
  {!result?<p role="status">{eligible.length?'Chọn phương án hợp lệ để xem biểu đồ.':'Không có phương án trong giới hạn hiện tại.'}</p>:result.status==='INVALID'?<p role="status">{result.reason}</p>:<>
   <p role="status"><strong>{chartNumber(result.usedHours)} / {selected?.weeklyHours} giờ</strong> đã phân bổ · {chartNumber(result.unusedHours)} giờ chưa phân bổ.</p>
   <figure className="cla-viz-figure"><figcaption><strong>Khoảng cách điểm và phân bổ thời gian</strong></figcaption><div className="cla-viz-legend"><span className="is-blue">Khoảng cách điểm (0–10)</span><span className="is-teal">Giờ / tuần (0–{selected?.weeklyHours})</span></div>
   <div className="cla-viz-rows">{result.rows.map(r=><div className="cla-viz-row" key={r.subject}><div><strong>{r.label}</strong><p className="cla-viz-compact">{chartNumber(r.currentScore)} → {chartNumber(r.targetScore)}</p></div><div className="cla-viz-pair"><MetricBar label={`${r.label} · khoảng cách điểm`} value={r.gap} max={10} unit=" điểm"/><MetricBar label={`${r.label} · giờ học`} value={r.hours} max={selected!.weeklyHours||1} tone="teal" unit=" giờ"/></div><small>Duy trì {chartNumber(r.maintenanceHours)} giờ · ưu tiên thêm {chartNumber(r.extraHours)} giờ</small></div>)}</div></figure>
   <details><summary>Phương pháp và giới hạn {result.version}</summary><p>Hàm mục tiêu tối đa tổng gap × log(1 + số khối 30 phút tăng thêm); mỗi môn đủ dữ liệu có trọng số như nhau ngoài gap. Chọn lợi ích biên lớn nhất cho từng khối. Đây chỉ là tối ưu của hàm giả định, không phải mức cải thiện điểm số đã đo. Chỉ tính các môn có đủ điểm và mục tiêu.</p></details>
  </>}
  <p className="orion-tradeoff-note">Mô phỏng cục bộ, không tự lưu, không thay thế lịch học hiện tại, không suy ra tác động nhân quả.</p>
 </section>;
}
