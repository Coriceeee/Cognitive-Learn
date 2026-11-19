import { chartFraction, temporalChartPoints, type ChartObservation } from '../../../lib/chartGeometry';
import './analytic-charts.css';
export const chartNumber = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 3});
type BarProps = { value: number | null; max: number; label: string; unit?: string; tone?: 'blue'|'teal'|'violet'|'amber'; missing?: string };
/** A visible value and label remain available without graphics or color. */
export function MetricBar({value, max, label, unit='', tone='blue', missing='Chưa có dữ liệu'}: BarProps) {
  const fraction=chartFraction(value,max);
  return <div className="cla-viz-bar" role="img" aria-label={`${label}: ${fraction===null?missing:`${chartNumber(value!)}${unit} (thang ${chartNumber(max)}${unit})`}`}>
    <span className="cla-viz-track" aria-hidden="true">{fraction!==null&&<span className={`cla-viz-fill is-${tone}`} style={{width:`${fraction*100}%`}}/>}</span>
    <strong className="cla-viz-value">{fraction===null?missing:`${chartNumber(value!)}${unit}`}</strong>
  </div>;
}
export function TemporalPlot({points,max,label,unit=''}:{points:readonly ChartObservation[];max:number;label:string;unit?:string}) {
  const rows=temporalChartPoints(points,max);
  if(!rows.length)return <p role="status">Chưa đủ chuỗi hợp lệ để vẽ biểu đồ.</p>;
  const x=(n:number)=>48+n*470, y=(n:number)=>190-n*165;
  const date=(s:string)=>new Date(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',timeZone:'UTC'});
  const last=rows[rows.length-1];
  return <figure className="cla-viz-figure">
    <figcaption className="cla-viz-caption"><strong>{label}</strong><span>Gần nhất: {chartNumber(last.value)}{unit} · EMA: {chartNumber(last.ema*max)}{unit}</span></figcaption>
    <svg className="cla-viz-plot" viewBox="0 0 540 228" role="img" aria-label={`${label} theo ngày UTC; đường quan sát và EMA bán rã 7 ngày. Giá trị chi tiết ở bảng điểm nguồn.`}>
      {[0,.25,.5,.75,1].map(v=><g key={v}><line className="cla-viz-gridline" x1="48" x2="518" y1={y(v)} y2={y(v)}/><text x="40" y={y(v)+4} textAnchor="end">{chartNumber(v*max)}</text></g>)}
      <polyline className="cla-viz-observed" points={rows.map(p=>`${x(p.x)},${y(p.observed)}`).join(' ')} />
      <polyline className="cla-viz-ema" points={rows.map(p=>`${x(p.x)},${y(p.ema)}`).join(' ')} />
      {rows.map(p=><circle key={p.at} className="cla-viz-dot" cx={x(p.x)} cy={y(p.observed)} r="4"><title>{p.at}: {chartNumber(p.value)}{unit}</title></circle>)}
      <text x="48" y="210" textAnchor="start">{date(rows[0].at)}</text><text x="518" y="210" textAnchor="end">{date(last.at)}</text>
    </svg>
    <div className="cla-viz-legend"><span className="is-blue">Quan sát tự báo cáo</span><span className="is-teal">EMA · bán rã 7 ngày</span></div>
  </figure>;
}
