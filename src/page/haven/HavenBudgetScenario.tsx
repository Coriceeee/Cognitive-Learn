import {useState} from 'react';
import {compareAnnualBudget} from '../../lib/annualBudgetScenario';
import {MetricBar,chartNumber} from '../../components/common/charts/AnalyticCharts';
import '../lumen/components/lumen-dynamic-state.css';
const fields=[['budget','Ngân sách năm'],['tuition','Học phí năm'],['living','Sinh hoạt năm'],['other','Chi phí khác năm'],['confirmedAid','Hỗ trợ đã xác nhận'],['possibleAid','Hỗ trợ chưa xác nhận'],['tuitionCap','Trần học phí (tùy chọn)']] as const;
const labels={confirmed:'Chỉ hỗ trợ đã xác nhận',conditional:'Nếu nhận thêm hỗ trợ',stress:'Nếu chi phí ngoài học phí tăng'};
export default function HavenBudgetScenario(){
 const [input,setInput]=useState<Record<typeof fields[number][0],string>>({budget:'',tuition:'',living:'',other:'',confirmedAid:'',possibleAid:'',tuitionCap:''});const [stress,setStress]=useState(15);
 const read=(s:string)=>/^\d+$/.test(s.trim())?Number(s):NaN;
 const report=compareAnnualBudget({budget:read(input.budget),tuition:read(input.tuition),living:read(input.living),other:read(input.other),confirmedAid:read(input.confirmedAid),possibleAid:read(input.possibleAid),tuitionCap:input.tuitionCap.trim()===''?null:read(input.tuitionCap),stressPercent:stress});
 const max=report?Math.max(1,read(input.budget),...report.rows.map(r=>r.net)):1;
 return <section className="cla-dynamic" aria-label="Mô phỏng ngân sách năm"><header><span>HAVEN · FINANCIAL ADAPTATION</span><h2>Mô phỏng chi phí và học bổng</h2><p>Nhập số tiền cả năm bằng VND, không dùng dấu phân cách. Nhập 0 nếu đã xác định không có khoản chi/hỗ trợ. Không nhập số chưa biết thành 0.</p></header>
 <div className="cla-roadmap-options">{fields.map(([k,label])=><label key={k}>{label}<input inputMode="numeric" value={input[k]} onChange={e=>setInput(v=>({...v,[k]:e.target.value}))}/></label>)}</div><label className="cla-viz-select">Biến động chi phí ngoài học phí: {stress}%<input type="range" min="0" max="100" value={stress} onChange={e=>setStress(Number(e.target.value))}/></label>
 {!report?<p role="status">Nhập đủ các khoản hợp lệ; tổng hỗ trợ không vượt tổng chi phí.</p>:<><p>Chi phí trước hỗ trợ: {chartNumber(report.total)} đ. Trần học phí: {report.tuitionCapStatus==='UNKNOWN'?'Chưa đặt':report.tuitionCapStatus==='WITHIN'?'Trong trần':'Vượt trần'} (kiểm tra riêng, trước hỗ trợ).</p><div className="cla-viz-rows"><div className="cla-viz-row"><strong>Ngân sách</strong><MetricBar label="Ngân sách" value={read(input.budget)} max={max} unit=" đ" tone="violet"/></div>{report.rows.map(r=><div className="cla-viz-row" key={r.id}><strong>{labels[r.id as keyof typeof labels]}</strong><MetricBar label={labels[r.id as keyof typeof labels]} value={r.net} max={max} unit=" đ" tone={r.withinBudget?'teal':'amber'}/><small>{r.remaining>=0?'Còn':'Thiếu'} {chartNumber(Math.abs(r.remaining))} đ · {r.withinBudget?'Trong ngân sách':'Vượt ngân sách'}</small></div>)}</div><p className="cla-dynamic__note">Hỗ trợ chưa xác nhận chỉ xuất hiện ở kịch bản có điều kiện. Khoản tiền và tỷ lệ biến động do bạn nhập; không xác minh học phí, không dự báo nhận học bổng. Không lưu hoặc gửi dữ liệu.</p></>}
 </section>;
}
