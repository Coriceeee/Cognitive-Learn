import { useState } from 'react';
import { projectExamScore, EXAM_PROJECTION_VERSION } from '../../../lib/examProjection';
import { parseSubjectScore } from '../../../lib/scoreConversionEngine';

export default function ExamProjectionPanel<K extends string>({labels, onApply, onTransfer, initiallyOpen = false}: {
  labels: Record<K,string>;
  onApply?: (scores: Partial<Record<K,string>>) => void;
  onTransfer?: (previous: Partial<Record<K,string>>, latest: Partial<Record<K,string>>) => void;
  initiallyOpen?: boolean;
}) {
  const [expanded,setExpanded] = useState(initiallyOpen || window.location.hash === "#cla-exam-projection");
  const [previous,setPrevious] = useState<Partial<Record<K,string>>>({});
  const [latest,setLatest] = useState<Partial<Record<K,string>>>({});
  const keys = Object.keys(labels) as K[];
  const projected: Partial<Record<K,string>> = {};
  let invalid = false;
  for (const key of keys) {
    for (const raw of [previous[key],latest[key]]) if (raw?.trim() && parseSubjectScore(raw) === undefined) invalid = true;
    const score = projectExamScore(previous[key],latest[key]);
    if (score !== undefined) projected[key] = score.toFixed(2);
  }
  const count = Object.keys(projected).length;
  return <details className="cla-focus-disclosure" id="cla-exam-projection" open={expanded} onToggle={e => setExpanded(e.currentTarget.open)}>
    <summary>Ước lượng điểm thi từng môn từ hai bài thi thử</summary>
    <section className="atlas-combination-studio">
      <h3>Kịch bản điểm thi thử tiếp theo</h3>
      <p>Nhập hai lần thi thử gần nhất cùng thang 10 và mức độ tương đương. Ước lượng cơ sở = trung bình hai lần. Đây không phải mô hình ML đã kiểm định hay điểm thi chính thức. Không tự lấy điểm học bạ làm điểm thi.</p>
      <div className="cla-projection-scroll"><table className="cla-projection-table"><thead><tr><th scope="col">Môn</th><th scope="col">Lần trước</th><th scope="col">Gần nhất</th><th scope="col">Ước lượng /10</th></tr></thead><tbody>{keys.map(key => <tr key={key}><th scope="row">{labels[key]}</th><td><input inputMode="decimal" aria-label={`${labels[key]} lần trước`} value={previous[key] ?? ''} placeholder="—" onChange={e=>setPrevious(p=>({...p,[key]:e.target.value}))}/></td><td><input inputMode="decimal" aria-label={`${labels[key]} gần nhất`} value={latest[key] ?? ''} placeholder="—" onChange={e=>setLatest(p=>({...p,[key]:e.target.value}))}/></td><td>{projected[key] ?? '—'}</td></tr>)}</tbody></table></div>
      {invalid && <p role="alert">Kiểm tra điểm nhập: chỉ nhận số từ 0 đến 10.</p>}
      <p role="status">{count} môn có đủ hai điểm · Phiên bản {EXAM_PROJECTION_VERSION} · Chưa có khoảng dự báo được kiểm định.</p>
      <button type="button" className="cla-study-jump" disabled={invalid || count===0} onClick={()=>onTransfer ? onTransfer(previous,latest) : onApply?.(projected)}>{onTransfer ? "Chuyển kịch bản sang Atlas →" : "Dùng kịch bản để khám phá tổ hợp (thay điểm đang nhập) →"}</button>
      <p>Không tự lưu điểm giả định vào hồ sơ. Chỉ đối chiếu tham khảo, không dùng để phân loại trúng tuyển.</p>
    </section>
  </details>;
}
