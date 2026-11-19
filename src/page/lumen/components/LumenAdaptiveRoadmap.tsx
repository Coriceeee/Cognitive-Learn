import {useState} from 'react';
import type {DynamicStudentState} from '../../../lib/dynamicStudentState';
import type {TemporalStudentReport} from '../../../lib/temporalStudentIntelligence';
import {buildHolisticRoadmap} from '../../../lib/holisticRoadmap';
import './lumen-dynamic-state.css';
export default function LumenAdaptiveRoadmap({state,temporal}:{state:DynamicStudentState|null;temporal:TemporalStudentReport|null}){
 const [weeks,setWeeks]=useState('');const [abroad,setAbroad]=useState(false),[scholarship,setScholarship]=useState(false),[reconsiderGoal,setReconsiderGoal]=useState(false);
 const horizon=weeks.trim()===''?0:Number(weeks);const report=buildHolisticRoadmap(state,temporal,horizon,{abroad,scholarship,reconsiderGoal});
 return <section className="cla-dynamic" aria-label="Lộ trình thích ứng"><header><span>CLA · HOLISTIC ADAPTATION</span><h2>Lộ trình rà soát liên module</h2><p>Thay đổi thời hạn và ưu tiên để xem lại các bước. Đây là lộ trình tham khảo, không phải lịch hạn nộp chính thức.</p></header>
 <label className="cla-viz-select">Thời hạn của bạn (tuần)<input type="number" min="1" max="104" step="1" value={weeks} onChange={e=>setWeeks(e.target.value)}/></label>
 <div className="cla-roadmap-options"><label><input type="checkbox" checked={reconsiderGoal} onChange={e=>setReconsiderGoal(e.target.checked)}/> Xem lại mục tiêu</label><label><input type="checkbox" checked={scholarship} onChange={e=>setScholarship(e.target.checked)}/> Tìm học bổng</label><label><input type="checkbox" checked={abroad} onChange={e=>setAbroad(e.target.checked)}/> Cân nhắc du học</label></div>
 {!report.tasks.length?<p role="status">Cần hồ sơ Seed đã đồng bộ và thời hạn 1–104 tuần.</p>:<><figure className="cla-viz-figure"><figcaption>Trình tự rà soát · {horizon} tuần</figcaption><svg viewBox={`0 0 520 ${report.tasks.length*32+38}`} className="cla-viz-plot cla-roadmap-plot" role="img" aria-label="Các bước trên trục tuần; mô tả và liên kết ở ngay dưới biểu đồ"><line x1="182" x2="500" y1="20" y2="20" className="cla-viz-gridline"/><text x="182" y="12">Tuần 1</text>{horizon>1&&<text x="500" y="12" textAnchor="end">Tuần {horizon}</text>}{report.tasks.map((task,i)=>{const x=182+(horizon===1?0:(task.week-1)/(horizon-1)*318);return <g key={task.id}><text x="4" y={48+i*32}>{String(i+1).padStart(2,'0')} · {task.id}</text><line x1="182" x2="500" y1={44+i*32} y2={44+i*32} className="cla-viz-gridline"/><circle cx={x} cy={44+i*32} r="5" fill="rgb(var(--tc-fl-14877e))"><title>Tuần {task.week}: {task.title}</title></circle></g>})}</svg></figure>
 <ol className="cla-roadmap-list">{report.tasks.map(t=><li key={t.id}><a href={t.link}><strong>{t.title}</strong></a> · Tuần {t.week}<p>{t.reason}</p><small>{t.source}</small></li>)}</ol><p className="cla-dynamic__note">{state?.scope==='demo'?'DEMO · ':''}{report.version} · chỉ đọc; không lưu lựa chọn, không gửi LLM, không sửa chu kỳ học tập.</p></>}
 </section>;
}
