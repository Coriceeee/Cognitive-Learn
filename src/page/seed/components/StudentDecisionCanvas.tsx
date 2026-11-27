// Daylight scientific canvas: original data semantics, light-adapted SVG and legible labels.
import { useState } from 'react';
import {
  Timestamp,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import {
  buildDemoTemporalSnapshots,
  DEMO_TEMPORAL_FIXTURE_VERSION,
} from '../../../lib/demoTemporalSeed';
import type { CognitiveResult } from '../types';
import type { GpaIntegrityResult } from '../services/academicGpaIntegrity';
import type { TemporalStudentReport } from '../../../lib/temporalStudentIntelligence';
import { TemporalPlot } from '../../../components/common/charts/AnalyticCharts';

const dimensions = [
  { code: 'SCI', label: 'Nhất quán kế hoạch', color: '#17685f' },
  { code: 'MAS', label: 'Động lực học tập', color: '#5264c9' },
  { code: 'CSL', label: 'Ổn định hành vi', color: '#8f561e' },
] as const;
const metrics = [
  { key: 'planCompletionRate', label: 'Hoàn thành kế hoạch', max: 100, unit: '%' },
  { key: 'studyHoursPerWeek', label: 'Giờ học / tuần', max: 168, unit: ' giờ' },
  { key: 'motivationLevel', label: 'Động lực tự báo cáo', max: 100, unit: '/100' },
] as const;
const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const valid = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;

export default function StudentDecisionCanvas({ cognitive, gpa, temporal, hasProfile, demo }: {
  cognitive: CognitiveResult;
  gpa: GpaIntegrityResult | null;
  temporal: TemporalStudentReport | null;
  hasProfile: boolean;
  demo: boolean;
}) {
  const [metric, setMetric] = useState<typeof metrics[number]['key']>('planCompletionRate');
  const [demoSeedBusy, setDemoSeedBusy] = useState(false);
  const [demoSeedMessage, setDemoSeedMessage] = useState('');
  const [demoSeedReady, setDemoSeedReady] = useState(false);

  const createDemoTimeline = async () => {
    if (demoSeedBusy) return;
    setDemoSeedBusy(true);
    setDemoSeedMessage('');
    setDemoSeedReady(false);
    try {
      const user = auth.currentUser;
      if (!demo || !user) {
        throw new Error('Chức năng này chỉ dành cho phiên quản trị DEMO đã đăng nhập.');
      }

      const [accountSnap, profileSnap] = await Promise.all([
        getDocFromServer(doc(db, 'users', user.uid)),
        getDocFromServer(doc(db, 'learning_profiles', user.uid)),
      ]);
      const account = accountSnap.exists() ? accountSnap.data() : null;
      const profile = profileSnap.exists() ? profileSnap.data() : null;
      if (!account || account.active !== true || account.role !== 'admin') {
        throw new Error('Tài khoản hiện tại không có quyền quản trị DEMO.');
      }
      if (!profile || profile.userId !== user.uid || profile.schemaVersion !== 1 || profile.dataScope !== 'demo') {
        throw new Error('Hồ sơ không thuộc vùng dữ liệu DEMO của chính tài khoản này; không tạo dữ liệu.');
      }
      if (!(profile.updatedAt instanceof Timestamp)) {
        throw new Error('Hồ sơ thiếu dấu thời gian máy chủ hợp lệ. Hãy đồng bộ Seed trước khi tạo DEMO.');
      }

      const fixtures = buildDemoTemporalSnapshots(user.uid, profile.updatedAt.toDate().toISOString());
      const historyRef = collection(db, 'learning_profiles', user.uid, 'cognitive_history');
      const existing = await getDocsFromServer(historyRef);
      const existingById = new Map<string, Record<string, unknown>>();
      for (const item of existing.docs) existingById.set(item.id, item.data());
      for (const fixture of fixtures) {
        const stored = existingById.get(fixture.id);
        if (stored && stored.demoFixtureVersion !== DEMO_TEMPORAL_FIXTURE_VERSION) {
          throw new Error('Phát hiện bản ghi trùng mã nhưng không đúng phiên bản DEMO; đã dừng để bảo toàn lịch sử.');
        }
      }
      const missing = fixtures.filter(item => !existingById.has(item.id));
      if (missing.length > 0) {
        const batch = writeBatch(db);
        for (const fixture of missing) {
          const { id, createdAt, ...payload } = fixture;
          batch.set(doc(historyRef, id), {
            ...payload,
            createdAt: Timestamp.fromDate(new Date(createdAt)),
          });
        }
        await batch.commit();
      }

      setDemoSeedMessage(
        missing.length > 0
          ? `Đã thêm ${missing.length} mốc lịch sử mô phỏng DEMO. Không thay đổi hồ sơ hoặc bảng điểm.`
          : 'Ba mốc lịch sử mô phỏng DEMO đã tồn tại; không tạo bản sao.'
      );
      setDemoSeedReady(true);
    } catch (error) {
      setDemoSeedMessage(error instanceof Error ? error.message : 'Không thể tạo dữ liệu DEMO. Hãy kiểm tra quyền và kết nối.');
    } finally {
      setDemoSeedBusy(false);
    }
  };
  const selected = metrics.find(m => m.key === metric)!;
  const series = hasProfile && temporal?.status !== 'BLOCKED' ? temporal?.series.find(s => s.metric === metric) : undefined;
  const derived = hasProfile && gpa?.status === 'VERIFIED' ? gpa.derived : null;
  const grades = [derived?.grade10, derived?.grade11, derived?.grade12];
  const signals = dimensions.map(d => {
    const source = cognitive.dimensions.find(s => s.code === d.code);
    return { ...d, value: hasProfile && source?.available === true && valid(source.value, 100) ? source.value : null };
  });
  const overall = hasProfile && cognitive.scoreAvailable === true && valid(cognitive.overallScore,100) ? cognitive.overallScore : null;
  const observed = series?.status === 'DESCRIPTIVE' && series.points.length >= 3;
  return <section className="cla-decision-canvas" aria-labelledby="cla-canvas-title">
    <header className="cla-canvas-head"><div><span className="cla-canvas-index">PHÂN TÍCH HỌC TẬP / DỮ LIỆU CÁ NHÂN</span><h2 id="cla-canvas-title">Không gian phân tích học tập</h2></div><span className="cla-canvas-source">{demo ? 'DỮ LIỆU DEMO' : 'HỒ SƠ CÁ NHÂN'} · {hasProfile ? 'Đã có hồ sơ' : 'Chưa có hồ sơ'}</span></header>
    <div className="cla-canvas-grid">
      <article className="cla-canvas-cognitive">
        <div className="cla-canvas-label"><span>01 / NHẬN THỨC</span><a href="/lumen/state">Lumen ↗</a></div>
        <h3>Trạng thái hiện tại</h3>
        <div className="cla-spectral-layout">
          <svg className="cla-spectral-dial" viewBox="0 0 320 300" role="img" aria-label={`Trạng thái nhận thức tổng hợp: ${overall===null?'chưa đo':`${fmt(overall)}/100`}; ${signals.map(s=>`${s.code}: ${s.value===null?'chưa đo':fmt(s.value)}`).join('; ')}`}>
            <circle cx="160" cy="150" r="137" className="cla-dial-boundary"/>
            {Array.from({length:60},(_,i)=>{const a=i*Math.PI/30;return <line key={i} x1={160+129*Math.sin(a)} y1={150-129*Math.cos(a)} x2={160+(i%5===0?136:132)*Math.sin(a)} y2={150-(i%5===0?136:132)*Math.cos(a)} stroke="#7292b6" strokeOpacity={i%5===0?.6:.23}/>;})}
            {signals.map((s,i)=>{const r=115-i*21,c=2*Math.PI*r,a=(s.value??0)/100*2*Math.PI;return <g key={s.code}>
              <circle cx="160" cy="150" r={r} fill="none" stroke={s.color} strokeOpacity=".15" strokeWidth="11" strokeDasharray={s.value===null?'2 6':undefined}/>
              {s.value!==null&&s.value>0&&<><circle cx="160" cy="150" r={r} fill="none" stroke={s.color} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${c*s.value/100} ${c}`} transform="rotate(-90 160 150)" className="cla-dial-arc"/><circle cx={160+r*Math.sin(a)} cy={150-r*Math.cos(a)} r="3" fill="#ffffff"/></>}
            </g>;})}
            <circle cx="160" cy="150" r="53" fill="#ffffff" stroke="#b9cbdc" strokeOpacity=".35"/>
            <text x="160" y="136" textAnchor="middle" className="cla-dial-caption">TỔNG HỢP</text>
            <text x="160" y="168" textAnchor="middle" className="cla-dial-number">{overall===null?'—':fmt(overall)}</text>
            <text x="160" y="186" textAnchor="middle" className="cla-dial-caption">/ 100</text>
          </svg>
          <div className="cla-spectrum-key">{signals.map(s=><div className="cla-spectrum-item" key={s.code}><i style={{background:s.color}} aria-hidden="true"/><div><b>{s.code}</b><span>{s.label}</span></div><strong style={{color:s.color}}>{s.value===null?'—':fmt(s.value)}</strong></div>)}</div>
        </div>
        <p className="cla-canvas-note">Chỉ báo thử nghiệm từ hồ sơ và hành vi; chưa phải thang đo tâm lý được kiểm định.</p>
      </article>
      <article className="cla-canvas-academic">
        <div className="cla-canvas-label"><span>02 / NĂNG LỰC</span><a href="/student/transcript">Bảng điểm ↗</a></div>
        <h3>Học lực qua các năm</h3>
        <div className="cla-canvas-kpi">{valid(derived?.overall,10) ? fmt(derived.overall) : '—'}<small>/ 10 · GPA</small></div>
        <svg viewBox="0 0 480 230" role="img" aria-label={`GPA đã đối soát: ${grades.map((v,i)=>`Lớp ${10+i}: ${valid(v,10)?fmt(v):'chưa có dữ liệu'}`).join('; ')}`} className="cla-canvas-gpa">
          <defs><linearGradient id="claGpaFill" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#738bf0" stopOpacity=".32"/><stop offset="1" stopColor="#46b8bb"/></linearGradient></defs>
          {[0,2,4,6,8,10].map(v=><g key={v}><line x1="42" x2="464" y1={188-v*16} y2={188-v*16} stroke="#7292b6" strokeOpacity=".20" strokeDasharray={v===0?undefined:'3 5'}/><text x="32" y={192-v*16} textAnchor="end">{v}</text></g>)}
          {grades.map((v,i)=>{const x=91+i*139;return <g key={i}>{valid(v,10)?<><rect x={x} y={188-v*16} width="67" rx="3" height={v*16} fill="url(#claGpaFill)"/><circle cx={x+33.5} cy={188-v*16} r="3" fill="#67ead1"/><text x={x+33.5} y={180-v*16} textAnchor="middle" className="cla-canvas-chart-value">{fmt(v)}</text></>:<><rect x={x} y="28" width="67" height="160" fill="none" stroke="#91a8bf" strokeDasharray="3 6"/><text x={x+33.5} y="112" textAnchor="middle">—</text></>}<text x={x+33.5} y="211" textAnchor="middle">Lớp {10+i}</text></g>;})}
        </svg>
        <p className="cla-canvas-note">{derived ? 'GPA tính từ bảng điểm đã nhập và đối soát; không phải xác nhận của nhà trường.' : 'Chưa có bảng điểm được đối soát. Cột nét đứt là dữ liệu thiếu, không phải điểm 0.'}</p>
      </article>
      <article className="cla-canvas-temporal">
        <div className="cla-canvas-label"><span>03 / TIẾN TRÌNH</span><a href="/lumen/history">Lịch sử ↗</a></div>
        <div className="cla-canvas-temporal-head"><h3>Nhịp học theo thời gian</h3><div className="cla-canvas-switch" role="group" aria-label="Chọn chỉ số theo thời gian">{metrics.map(m=><button key={m.key} type="button" onClick={()=>setMetric(m.key)} aria-pressed={metric===m.key}>{m.label}</button>)}</div></div>
        {observed ? <TemporalPlot points={series.points} max={selected.max} label={selected.label} unit={selected.unit}/> : <div className="cla-canvas-empty" role="status"><svg viewBox="0 0 660 126" aria-hidden="true" preserveAspectRatio="none">{[13,43,73,103].map(y=><line key={y} x1="0" x2="660" y1={y} y2={y} stroke="#b2c4d6" strokeDasharray="3 6"/>)}{[0,132,264,396,528,660].map(x=><line key={x} x1={x} x2={x} y1="0" y2="126" stroke="#d6e1ee"/> )}</svg><div><strong>Chưa đủ lịch sử để vẽ xu hướng</strong><span>{series?.points.length ?? 0} lần ghi nhận hợp lệ · cần ≥3 ngày đo riêng biệt trải dài ≥7 ngày</span><a href="/student/profile">Cập nhật hồ sơ →</a></div></div>}
        {temporal?.syntheticRows ? <p className="cla-canvas-demo-note" role="note">Biểu đồ đang gồm {temporal.syntheticRows} mốc mô phỏng DEMO. Đây không phải dữ liệu đo thực tế và không được dùng làm bằng chứng nghiên cứu.</p> : null}
        {!observed && demo && temporal?.status === 'INSUFFICIENT' && <div className="cla-canvas-demo-seed">
          <button type="button" onClick={() => void createDemoTimeline()} disabled={demoSeedBusy}>
            {demoSeedBusy ? 'Đang tạo dữ liệu DEMO…' : 'Tạo 3 mốc dữ liệu DEMO'}
          </button>
          <span>Chỉ ghi vào lịch sử của tài khoản quản trị DEMO; không sửa hồ sơ hoặc bảng điểm.</span>
          {demoSeedMessage && <p role="status">{demoSeedMessage} {demoSeedReady && <button type="button" onClick={() => window.location.reload()}>Tải lại biểu đồ</button>}</p>}
        </div>}
        <p className="cla-canvas-note">Dữ liệu tự báo cáo, mô tả diễn biến quan sát; không suy ra hiệu quả can thiệp hay dự báo tương lai.</p>
      </article>
    </div>
    <nav className="cla-canvas-flow" aria-label="Vòng lặp quyết định học tập">
      <span>VÒNG LẶP CLA</span><a href="/student/profile">01. Hiểu bản thân</a><a href="/lumen">02. Phân tích</a><a href="/orion">03. Mô phỏng & chọn</a><a href="/pulse/checkin">04. Hành động & đo lại</a><a href="/orion">05. Điều chỉnh ↺</a>
    </nav>
  </section>;
}
