import { MetricBar } from '../../../components/common/charts/AnalyticCharts';
import { explainCognitiveComposite } from '../../../lib/cognitiveExplanation';
import { cognitiveResearchReadiness } from '../../../lib/cognitiveResearchReadiness';
export default function LumenCognitiveResearchReadiness({cognitive}:{cognitive:unknown}){
 const audit=cognitiveResearchReadiness(cognitive);
 const trace=explainCognitiveComposite(cognitive);
 return <section className="lumen-evidence-card" aria-labelledby="lumen-cognitive-research-title" id="lumen-cognitive-research-readiness">
 <span className="lumen-eyebrow">CHỈ BÁO THỬ NGHIỆM · GIỚI HẠN KHOA HỌC</span>
 <h2 id="lumen-cognitive-research-title">SCI / MAS / CSL — dữ liệu hiện có và giới hạn đo lường</h2>
 <p role="status">{audit.availableCount}/3 chỉ báo thay thế có dữ liệu theo quy tắc hiện hành. Đây không phải mức tin cậy hay kết quả kiểm định tâm trắc.</p>
 <div className="cla-viz-rows">{audit.rows.map(row=><div className="cla-viz-row" key={row.code}><span>{row.code} · {row.label}</span><MetricBar label={row.code} value={row.value} max={100} tone="violet" unit="/100"/><small>{row.production}</small></div>)}</div>
 <details><summary>Vì sao có điểm tổng hợp?</summary>
 <p>Phiên bản: {trace.version} · {trace.mappingVersion??"Chưa rõ phiên bản ánh xạ"} · {trace.status}</p>
 <p>{trace.score===null?"Chưa đủ dữ liệu hoặc phép tính không khớp; không phân bổ đóng góp.":`Điểm ${trace.score}/100 = làm tròn tổng đóng góp bên dưới.`}</p>
 <div className="cla-viz-rows">{trace.factors.map(f=><div className="cla-viz-row" key={f.code}><span>{f.code} · trọng số {Math.round(f.weight*100)}% · {f.value===null?"Chưa đo":`${f.value}/100`}</span><MetricBar label={`Đóng góp ${f.code}`} value={f.contribution} max={100} unit=" điểm" tone="teal" missing="Chưa diễn giải"/></div>)}</div><p className="cla-viz-compact">Thanh biểu diễn điểm đóng góp trên thang tổng 100, không phải tỷ lệ quan trọng nhân quả.</p>
 <ul>{trace.limitations.map(x=><li key={x}>{x}</li>)}</ul></details>
 <details><summary>Phương pháp nghiên cứu và điều kiện kiểm chứng</summary>
 <p>Phiên bản quy tắc chuyển đổi: {audit.mappingVersion??'Chưa có phiên bản đủ điều kiện hiển thị'}. Công thức nghiên cứu CP24 không đồng nhất với chỉ báo thay thế đang dùng.</p>
 <ul>{audit.rows.map(row=><li key={row.code}><strong>{row.code}:</strong> {row.research}</li>)}</ul>
 <p>Quy trình nghiên cứu riêng hỗ trợ ICC(A,1), khoảng tin cậy bootstrap theo người học và đối chứng Static–Adaptive theo người học. Chưa có bằng chứng thích hợp để xác nhận độ tin cậy, tính hợp lệ của thang đo hoặc hiệu quả can thiệp trên học sinh CLA.</p>
 <p>Không dùng chỉ báo thay thế để chẩn đoán hoặc quyết định thay học sinh. Dữ liệu nghiên cứu cá nhân không xuất lên website.</p>
 </details></section>;
}
