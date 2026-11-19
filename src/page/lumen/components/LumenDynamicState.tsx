import {diagnoseTemporal} from '../../../lib/temporalDiagnostics';
import { useState } from 'react';
import type { DynamicStudentState } from '../../../lib/dynamicStudentState';
import type { TemporalStudentReport, TemporalSeries } from '../../../lib/temporalStudentIntelligence';
import { MetricBar, TemporalPlot } from '../../../components/common/charts/AnalyticCharts';
import './lumen-dynamic-state.css';
const names={studyHoursPerWeek:'Giờ học/tuần',planCompletionRate:'Hoàn thành kế hoạch (%)',motivationLevel:'Động lực tự báo cáo',SCI:'SCI',MAS:'MAS',CSL:'CSL'};
const show=(v:number|string|null)=>v===null?'Chưa có dữ liệu':typeof v==='number'?v.toLocaleString('vi-VN'):v;
export default function LumenDynamicState({state,temporal,historyLoading,mode="all"}:{state:DynamicStudentState|null;temporal:TemporalStudentReport|null;historyLoading:boolean;mode?:"all"|"state"|"history"}){
  const [metric,setMetric]=useState<TemporalSeries['metric']>('SCI');
  const selected=temporal?.series.find(s=>s.metric===metric&&s.status==='DESCRIPTIVE')??temporal?.series.find(s=>s.status==='DESCRIPTIVE');
  const diagnostics=selected?diagnoseTemporal(selected):null;
  return <section className="cla-dynamic" aria-labelledby="cla-dynamic-title">
    <header><span>CLA · DYNAMIC STUDENT & TEMPORAL INTELLIGENCE</span><h2 id="cla-dynamic-title">{mode === "state" ? "Hồ sơ người học động" : mode === "history" ? "Diễn biến theo thời gian" : "Hồ sơ động và diễn biến theo thời gian"}</h2><p>Đọc từ Seed đã đồng bộ máy chủ; không thay đổi hồ sơ, không tự điều chỉnh chiến lược.</p></header>
    {!state?<p role="status">Chưa có hồ sơ đúng phiên bản và nguồn thời gian; không dùng giá trị mặc định để tính trạng thái.</p>:<>
      <p role="status">{state.scope==='demo'?'DEMO — không dùng nghiên cứu. ':''}Bản ghi: {new Date(state.observedAt).toLocaleString('vi-VN')} · {state.observedFields}/{state.totalFields} trường có dữ liệu (độ phủ, không phải độ tin cậy).</p>
      {mode !== "state" && <><h3>Diễn biến tự báo cáo</h3>
      {historyLoading?<p role="status">Đang xác minh lịch sử từ máy chủ…</p>:!temporal||temporal.status==='BLOCKED'?<p role="status">Chưa xác minh được cửa sổ lịch sử; không hiển thị xu hướng.</p>:<>
        <p>{temporal.rows} bản ghi trong cửa sổ gần nhất · {temporal.distinctDays} ngày UTC{temporal.windowMayBeTruncated?' · lịch sử còn có thể dài hơn':''}. Mỗi ngày chỉ lấy lần lưu cuối.</p>
        {selected?<><label className="cla-viz-select">Chỉ số theo dõi<select value={selected.metric} onChange={e=>setMetric(e.target.value as TemporalSeries['metric'])}>{temporal.series.filter(s=>s.status==='DESCRIPTIVE').map(s=><option value={s.metric} key={s.metric}>{names[s.metric]}</option>)}</select></label><TemporalPlot points={selected.points} max={selected.metric==='studyHoursPerWeek'?168:100} label={names[selected.metric]} unit={selected.metric==='studyHoursPerWeek'?' giờ':''}/></>:<p role="status">Chưa đủ chuỗi liên tục (cần ≥3 ngày quan sát, khoảng thời gian ≥7 ngày).</p>}
        {diagnostics&&diagnostics.trendPerWeek!==null&&<div className="cla-viz-compact" aria-label="Chẩn đoán chuỗi mô tả"><strong>Độ dốc Theil–Sen: {show(diagnostics.trendPerWeek)} / tuần</strong><p>{diagnostics.change?`Điểm chia ứng viên ${new Date(diagnostics.change.at).toLocaleDateString('vi-VN')}: trung vị ${diagnostics.change.before} → ${diagnostics.change.after}; giảm mất mát L1 ${Math.round(diagnostics.change.lossReduction*100)}%.`:'Không có điểm chia đạt ngưỡng hoặc chưa đủ ít nhất 3 quan sát, 7 ngày mỗi phía.'}</p><p>{diagnostics.latest?`Lần gần nhất ${diagnostics.latest.flag?'vượt':'không vượt'} ngưỡng chênh lệch mô tả ${diagnostics.latest.threshold} so với trung vị trước đó ${diagnostics.latest.baselineMedian}.`:'Chưa đủ 5 quan sát nền và lần gần nhất để đối chiếu.'}</p><small>Ngưỡng thử nghiệm, không phải kiểm định thống kê, chẩn đoán tâm lý hay dự báo. Chỉ dùng để xem lại bối cảnh.</small></div>}
        <details><summary>Chi tiết chuỗi và điểm nguồn theo từng chỉ số</summary><div className="cla-viz-rows">{temporal.series.map(s=><div className="cla-viz-row" key={s.metric}><strong>{names[s.metric]}</strong>{s.status==='DESCRIPTIVE'?<><span>EMA: {show(s.ema)} · Δ đầu–cuối: {s.delta!==null&&s.delta>0?'+':''}{show(s.delta)} · {s.spanDays} ngày, {s.points.length} điểm</span>{s.latestShift&&<small>Chênh lệch lần gần nhất vượt ngưỡng mô tả; cần xem xét bối cảnh.</small>}<details><summary>Điểm nguồn</summary><ul>{s.points.map(p=><li key={p.snapshotId}>{new Date(p.at).toLocaleString('vi-VN')}: {show(p.value)}</li>)}</ul></details></>:<span>Chưa đủ chuỗi liên tục.</span>}</div>)}</div></details>
      </>}
      </>}
      {mode !== "history" && <><h3 className="cla-viz-section-title">Học lực · GPA thang 10</h3><div className="cla-viz-rows">{([{label:'Lớp 10',value:state.academic.gpa10},{label:'Lớp 11',value:state.academic.gpa11},{label:'Lớp 12',value:state.academic.gpa12},{label:'GPA tổng hợp',value:state.academic.overall}]).map(r=><div className="cla-viz-row" key={r.label}><span>{r.label}</span><MetricBar label={r.label} value={r.value} max={10}/></div>)}</div>
      <h3 className="cla-viz-section-title">Hành vi và chỉ báo Cognitive · thang 100</h3><div className="cla-viz-rows">{[{label:'Hoàn thành kế hoạch (%)',value:state.behavior.completion},{label:'Động lực tự báo cáo',value:state.behavior.motivation},...Object.entries(state.cognitive).map(([label,value])=>({label,value}))].map(r=><div className="cla-viz-row" key={r.label}><span>{r.label}</span><MetricBar label={r.label} value={r.value} max={100} tone="teal"/></div>)}</div><p className="cla-viz-compact">Cognitive proxies chưa kiểm định tâm trắc. Giờ học / tuần: {show(state.behavior.hours)} · Đề luyện / tuần: {show(state.behavior.practice)}.</p>
      <details><summary>Mục tiêu &amp; tài chính (tùy chọn)</summary><dl><dt>Ngành</dt><dd>{show(state.goals.major)}</dd><dt>Trường</dt><dd>{show(state.goals.university)}</dd><dt>Ngân sách (đồng)</dt><dd>{show(state.finance.budget)}</dd><dt>Học phí tối đa/năm (đồng)</dt><dd>{show(state.finance.maxTuition)}</dd></dl></details>
      </>}
      <p className="cla-dynamic__note">Các lần lưu hồ sơ là tự báo cáo. EMA và ngưỡng chênh lệch chỉ mô tả dữ liệu, không dự báo, không chẩn đoán, không xác nhận cải thiện do CLA. Không gửi nội dung này cho LLM.</p>
    </>}
  </section>;
}
