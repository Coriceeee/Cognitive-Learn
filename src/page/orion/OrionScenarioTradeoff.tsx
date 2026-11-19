import type { OrionScenario,OrionRiskLevel } from '../../lib/orionStrategyEngine';
import {evaluateScenarioChoices} from '../../lib/scenarioDecision';
import {chartNumber} from '../../components/common/charts/AnalyticCharts';
type Props={scenarios:OrionScenario[];maxHours?:number|null;maxRisk?:OrionRiskLevel|null};
export default function OrionScenarioTradeoff({scenarios,maxHours=null,maxRisk=null}:Props){
 const result=evaluateScenarioChoices(scenarios,maxHours,maxRisk);
 const rows=result.rows.filter(r=>!r.reasons.includes('Dữ liệu phương án không hợp lệ'));
 if(!rows.length)return <p role="status">Chưa có phương án hợp lệ để vẽ.</p>;
 const ceiling=Math.max(1,Math.ceil(Math.max(...rows.map(r=>r.scenario.expectedGain))));
 const x=(v:number)=>65+v/100*315, y=(v:number)=>216-v/ceiling*170;
 const names=new Map(scenarios.map(s=>[s.id,s.title]));
 const status=(id:string)=>{const r=rows.find(r=>r.scenario.id===id);return r?.reasons.length?'Ngoài ràng buộc':result.frontier.includes(id)?'Pareto':'Bị lấn át';};
 return <section className="orion-tradeoff-panel" aria-labelledby="orion-tradeoff-title"><div className="orion-tradeoff-heading"><div><span>ORION · STRATEGY TOPOLOGY</span><h2 id="orion-tradeoff-title">Bản đồ đánh đổi chiến lược</h2><p>Phân loại Pareto theo ba chiều: tăng điểm giả định, khả thi theo quy tắc và thời lượng thấp. Hai trục chỉ biểu diễn hai chiều; không nối điểm thành đường biên.</p></div></div>
 <figure className="cla-viz-figure"><svg className="cla-viz-plot" viewBox="0 0 420 262" role="img" aria-label="So sánh kịch bản theo khả thi và điểm tăng giả định; nhãn Pareto tính cả thời lượng">
 {[0,.25,.5,.75,1].map(t=><g key={t}><line className="cla-viz-gridline" x1="65" x2="380" y1={y(t*ceiling)} y2={y(t*ceiling)}/><text x="56" y={y(t*ceiling)+4} textAnchor="end">{chartNumber(t*ceiling)}</text></g>)}
 {[0,25,50,75,100].map(t=><g key={t}><line className="cla-viz-gridline" x1={x(t)} x2={x(t)} y1="46" y2="216"/><text x={x(t)} y="233" textAnchor="middle">{t}</text></g>)}
 {rows.map(({scenario},i)=>{const state=status(scenario.id);const color=state==='Pareto'?'rgb(var(--tc-tx-14877e))':state==='Bị lấn át'?'#c08032':'#849bb4'; const cx=x(scenario.feasibility),cy=y(scenario.expectedGain);return <g key={scenario.id}><circle cx={cx} cy={cy} r="10" fill={state==='Ngoài ràng buộc'?'none':color} stroke={color} strokeWidth="2"/><text x={cx} y={cy-14} textAnchor="middle">{i+1}</text><title>{scenario.title}: {state}, {scenario.weeklyHours} giờ/tuần</title></g>;})}
 <text x="222" y="252" textAnchor="middle">Khả thi theo quy tắc (%)</text><text x="65" y="20">Tăng điểm giả định</text></svg>
 <figcaption className="cla-viz-legend"><span className="is-teal">Pareto</span><span className="is-amber">Bị lấn át</span><span className="is-excluded">Ngoài giới hạn</span></figcaption></figure>
 <div className="cla-viz-plain-list">{rows.map((r,i)=><div className="cla-viz-row" key={r.scenario.id}><strong>{i+1}. {names.get(r.scenario.id)}</strong><span>{status(r.scenario.id)} · {r.scenario.weeklyHours} giờ · {chartNumber(r.scenario.expectedGain)} điểm · {chartNumber(r.scenario.feasibility)}% khả thi</span></div>)}</div>
 <p className="orion-tradeoff-note">Các đầu ra heuristic không phải xác suất đỗ, dự báo ML đã hiệu chuẩn hay hiệu quả can thiệp thực tế.</p></section>;
}
