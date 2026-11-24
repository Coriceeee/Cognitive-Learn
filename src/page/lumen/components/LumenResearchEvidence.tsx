import { useEffect, useState } from 'react';

type Evidence = {
  schema_version: string;
  audit_status: 'PASS';
  dataset: string;
  source: string;
  cohort: string;
  outcome: string;
  cutoff_day: number;
  test_count: number;
  models: {
    academic_only: Record<string, number>;
    academic_plus_behavior: Record<string, number>;
  };
  comparison: { brier_improvement: number; learner_cluster_bootstrap_ci95: [number, number] };
  provenance: { archive_sha256: string; features_sha256: string; method: string };
  limitations: string[];
};

function isEvidence(value: unknown): value is Evidence {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Evidence>;
  return v.schema_version === 'cla.oulad.public-evidence.v1' && v.audit_status === 'PASS' &&
    typeof v.test_count === 'number' && v.test_count > 0 &&
    typeof v.models?.academic_only?.brier === 'number' &&
    typeof v.models?.academic_plus_behavior?.brier === 'number' &&
    typeof v.comparison?.brier_improvement === 'number' &&
    Array.isArray(v.comparison?.learner_cluster_bootstrap_ci95) &&
    Array.isArray(v.limitations) && typeof v.provenance?.features_sha256 === 'string';
}

export default function LumenResearchEvidence() {
  const [result, setResult] = useState<Evidence | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}research/oulad-evidence.json`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('No research release');
        const data: unknown = await response.json();
        if (!isEvidence(data)) throw new Error('Unverified research release');
        setResult(data); setStatus('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('unavailable'); });
    return () => controller.abort();
  }, []);
  const n = (v: number) => v.toFixed(4).replace('.', ',');
  return (
    <section id="lumen-research-evidence" className="lumen-evidence-card" aria-labelledby="lumen-research-title">
      <span className="lumen-eyebrow">BẰNG CHỨNG NGHIÊN CỨU · OULAD</span>
      <h2 id="lumen-research-title">Kiểm định mô hình dự báo trên bộ dữ liệu nghiên cứu</h2>
      {status !== 'ready' || !result ? (
        <p role="status">{status === 'loading' ? 'Đang kiểm tra hồ sơ nghiên cứu...' : 'Chưa có báo cáo OULAD đã được kiểm toán và xuất bản. Không có kết quả nào được suy đoán hoặc điền mặc định.'}</p>
      ) : (
        <>
          <p role="status"><strong>Kiểm toán dữ liệu: PASS</strong> · {result.test_count.toLocaleString('vi-VN')} trường hợp kiểm tra · mốc ngày {result.cutoff_day}</p>
          <p>{result.outcome}. Dữ liệu {result.cohort}. Đây là nghiên cứu tổng hợp, <strong>không phải dự báo cá nhân của học sinh đang đăng nhập</strong>.</p>
          <div className="lumen-evidence-list">
            <div><span>ROC-AUC · chỉ học vụ</span><strong>{n(result.models.academic_only.roc_auc)}</strong></div>
            <div><span>ROC-AUC · học vụ + hành vi</span><strong>{n(result.models.academic_plus_behavior.roc_auc)}</strong></div>
            <div><span>Brier · chỉ học vụ</span><strong>{n(result.models.academic_only.brier)}</strong></div>
            <div><span>Brier · học vụ + hành vi</span><strong>{n(result.models.academic_plus_behavior.brier)}</strong></div>
            <div><span>Giảm Brier (ước lượng)</span><strong>{n(result.comparison.brier_improvement)}</strong></div>
            <div><span>95% CI · bootstrap theo người học</span><strong>[{n(result.comparison.learner_cluster_bootstrap_ci95[0])}; {n(result.comparison.learner_cluster_bootstrap_ci95[1])}]</strong></div>
          </div>
          <details>
            <summary>Nguồn, truy vết và giới hạn khoa học</summary>
            <p><a href={result.source} target="_blank" rel="noopener noreferrer">OULAD — UCI Machine Learning Repository</a></p>
            <p><strong>SHA256 dữ liệu gốc:</strong> <code>{result.provenance.archive_sha256}</code></p>
            <p><strong>SHA256 bảng đặc trưng:</strong> <code>{result.provenance.features_sha256}</code></p>
            <p><strong>Phương pháp:</strong> {result.provenance.method}</p>
            <ul>{result.limitations.map(item => <li key={item}>{item}</li>)}</ul>
          </details>
        </>
      )}
    </section>
  );
}
