/** CP31 B5: strictly local, read-only, privacy-minimized structure checks.
 * Importing a self-reported JSON never verifies official websites, signatures,
 * school results, intervention efficacy, deployment, or independent approval.
 */
export type GovernanceCheck = { name: string; status: 'PASS' | 'WARN' | 'FAIL' | 'NOT TESTED'; detail: string };
type Row = Record<string, unknown>;
const r = (v: unknown): Row | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Row : null;
const arr = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const str = (v: unknown, limit = 256): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= limit;
const num = (v: unknown, min = 0, max = 1e8): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const day = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v+'T00:00:00Z')) && new Date(v+'T00:00:00Z').toISOString().slice(0,10) === v;
const sha = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const https = (v: unknown) => { if (!str(v, 2048)) return false; try { const u = new URL(v); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password && !u.hash; } catch { return false; } };
const status = (name: string, kind: GovernanceCheck['status'], detail: string): GovernanceCheck => ({ name, status: kind, detail });
const field = (value: unknown, schema: string): Row | null => { const v = r(value); return v?.schema === schema ? v : null; };
const base = (value: unknown, schema: string, label: string): GovernanceCheck[] | null => value === null ? [status(label, 'NOT TESTED', 'Chưa nhập tệp JSON. Không có chứng cứ để kiểm toán.')]
 : r(value)?.syntheticExampleOnly === true ? [status(label, 'NOT TESTED', 'Tệp đã gắn nhãn ví dụ tổng hợp: không sử dụng làm bằng chứng nghiệm thu.')]
 : field(value, schema) ? null : [status(label, 'FAIL', 'JSON không đúng schema phiên bản yêu cầu; không được công nhận.')];
const scope = (label: string, why: string) => status(label, 'NOT TESTED', why);
const unique = (ids: unknown[]) => ids.every(v => str(v, 120)) && new Set(ids).size === ids.length;
const ordered = (dates: unknown[]) => dates.every(day) && dates.every((d,i) => i === 0 || String(d) > String(dates[i-1]));

export function auditAtlasApprovals(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.atlas-approval.v1', 'Hồ sơ phê duyệt Atlas'); if (pre) return pre;
 const entries = arr(r(input)?.entries), checks: GovernanceCheck[] = [];
 if (!entries.length || entries.length > 100 || !unique(entries.map(x => r(x)?.id))) return [status('Danh mục quyết định Atlas', 'FAIL', 'Phải có 1–100 ID duy nhất, không để trống.')];
 for (const entry of entries) {
  const x = r(entry)!; const a = r(x.review); const b = r(x.approval);
  const sources = num(x.year, 2024, 2100) && Number.isInteger(x.year) && https(x.sourceUrl) && sha(x.contentSha256) && day(x.retrievedAt);
  const dual = !!a && !!b && str(a.reviewerId) && str(b.reviewerId) && a.reviewerId !== b.reviewerId && day(a.at) && day(b.at) && String(b.at) >= String(a.at) && str(x.policyVersion) && x.state === 'approved';
  checks.push(status('Nguồn và phiên bản Atlas', sources ? 'PASS' : 'FAIL', sources ? 'Metadata nguồn, năm và fingerprint có cấu trúc hợp lệ.' : 'Thiếu năm, URL HTTPS, ngày thu thập hoặc SHA-256 hợp lệ.'));
  checks.push(status('Tách người rà soát và duyệt', dual ? 'WARN' : 'FAIL', dual ? 'Có hai định danh và thời điểm khác nhau trong JSON tự khai; chưa kiểm chứng danh tính hay chữ ký.' : 'Không có hai vai trò phân biệt, thứ tự ngày hoặc phiên bản chính sách.'));
 }
 checks.push(scope('Hiệu lực nguồn và phê duyệt chính thức', 'Chưa fetch URL live, chưa đối chiếu chữ ký, log server hay quyết định của trường. Không đưa vào registry production từ tệp này.'));
 return checks;
}

export function auditOrionPolicy(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.orion-policy.v1', 'Adaptation policy'); if (pre) return pre;
 const p = r(r(input)?.policy), t = r(p?.trigger), d = r(p?.dose), stop = r(p?.stopRule), human = r(p?.humanReview);
 const checks: GovernanceCheck[] = [];
 const version = !!p && str(p.id) && str(p.version) && p.mode === 'shadow' && str(p.codeVersion);
 const triggers = !!t && str(t.metric) && num(t.threshold,0,10) && num(t.minObservations,2,100) && Number.isInteger(t.minObservations);
 const dose = !!d && num(d.hoursPerWeek, 0.1, 80) && num(d.maxWeeks,1,104) && Number.isInteger(d.maxWeeks);
 const safe = !!stop && str(stop.criterion) && num(stop.threshold,0,10) && !!human && human.required === true && ['teacher','counselor','researcher'].includes(String(human.reviewerRole));
 checks.push(status('Phiên bản và chế độ thử nghiệm',version ? 'PASS' : 'FAIL',version ? 'Có ID/version/codeVersion và mode=shadow.' : 'Chính sách chưa version hoặc không giới hạn ở shadow mode.'));
 checks.push(status('Trigger và liều can thiệp',triggers && dose ? 'PASS' : 'FAIL',triggers && dose ? 'Ngưỡng, tối thiểu quan sát và liều nằm trong giới hạn cấu trúc.' : 'Thiếu hoặc sai trigger, minObservations hay liều/tuần.'));
 checks.push(status('Stop rule và giám sát con người',safe ? 'WARN' : 'FAIL',safe ? 'Khai báo stop rule và human review; chưa chứng minh việc thực thi.' : 'Thiếu stop rule hoặc quyền giám sát.'));
 checks.push(scope('Hiệu quả và an toàn thực tế', 'Chưa chạy assignment, RCT, outcome thực tế hoặc human override; JSON chỉ mô tả chính sách shadow.'));
 return checks;
}

export function auditOrionScenarios(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.orion-scenarios.v1', 'Scenario replay'); if (pre) return pre;
 const entries = arr(r(input)?.scenarios);
 if (entries.length < 2 || entries.length > 12 || !unique(entries.map(x => r(x)?.id))) return [status('Danh mục kịch bản', 'FAIL', 'Cần 2–12 kịch bản với ID duy nhất để so sánh.')];
 const checks: GovernanceCheck[] = [];
 let ok = true;
 for (const row of entries) {
  const x = r(row), valid = !!x && str(x.policyVersion) && str(x.engineVersion) && num(x.baseline,0,10) && num(x.prediction,0,10)
   && num(x.horizonWeeks,1,104) && Number.isInteger(x.horizonWeeks) && x.isSimulation === true && x.observedOutcome === null;
  ok = ok && valid;
 }
 checks.push(status('Replay các kịch bản mô phỏng',ok ? 'PASS' : 'FAIL',ok ? 'Kết quả dự báo thang 0–10, cùng định dạng và được dán nhãn simulation-only.' : 'Thiếu phiên bản, giá trị không hợp lệ hoặc kết quả quan sát bị trộn vào dữ liệu mô phỏng.'));
 const first = r(entries[0]); const comparable = entries.every(x => r(x)?.engineVersion === first?.engineVersion && r(x)?.horizonWeeks === first?.horizonWeeks && r(x)?.policyVersion === first?.policyVersion);
 checks.push(status('Điều kiện so sánh công bằng',comparable ? 'PASS' : 'WARN',comparable ? 'Cùng engine, policy và horizon trong batch.' : 'Các kịch bản khác phiên bản hoặc khoảng thời gian; không xếp hạng trực tiếp.'));
 checks.push(scope('Độ chính xác và tác động thực tế', 'Không có outcome quan sát ghép cặp, không tính hiệu quả can thiệp, không suy diễn causal effect từ replay.'));
 return checks;
}

export function auditPulseEvidence(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.pulse-evidence.v1', 'Evidence Record'); if (pre) return pre;
 const records = arr(r(input)?.records);
 if (!records.length || records.length > 100 || !unique(records.map(x => r(x)?.resultId))) return [status('Danh mục Evidence Record', 'FAIL', 'Cần 1–100 resultId duy nhất.')];
 const checks: GovernanceCheck[] = [];
 for (const item of records) {
  const x=r(item)!; const engine=r(x.engine), output=r(x.output), uncertainty=r(x.uncertainty);
  const provenance = str(x.inputSnapshotId) && str(engine?.name) && str(engine?.version) && str(x.datasetVersion) && str(x.featureVersion) && str(x.modelVersion) && day(x.recordedDay)
    && Array.isArray(x.evidenceRefs) && x.evidenceRefs.every(v=>str(v)) && Array.isArray(x.limitations) && x.limitations.length > 0 && x.limitations.every(v=>str(v,1000));
  const bounds = !!output && (output.value === null || num(output.value,0,10)) && output.probability === null && str(output.unit) && !!uncertainty && uncertainty.type === 'not_estimated' && uncertainty.value === null;
  checks.push(status('Dòng nguồn gốc và snapshot',provenance ? 'PASS' : 'FAIL',provenance ? 'Có snapshot, engine/model/feature version, nguồn và giới hạn.' : 'Thiếu snapshot, timestamp, source reference hoặc giới hạn.'));
  checks.push(status('Giới hạn dự báo và bất định',bounds ? 'WARN' : 'FAIL',bounds ? 'Đầu ra khai báo không ước tính xác suất/bất định; không được diễn giải là độ tin cậy đã kiểm định.' : 'Output, probability hoặc uncertainty thiếu nhất quán.'));
 }
 checks.push(scope('Chống sửa đổi và hậu kiểm độc lập', 'JSON tự khai không chứng minh append-only, tính bất biến Firestore, chữ ký hay provenance dữ liệu thật.'));
 return checks;
}

export function auditPulseTrends(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.pulse-trends.v1', 'Chuỗi đo T0/T1/T2'); if (pre) return pre;
 const series=arr(r(input)?.series);
 if (!series.length || series.length>30 || !unique(series.map(v=>r(v)?.metric))) return [status('Danh mục xu hướng', 'FAIL', 'Thiếu hoặc trùng mã metric; tối đa 30 chuỗi.')];
 const checks: GovernanceCheck[]=[];
 for (const item of series) {
  const x=r(item)!; const samples=arr(x.samples); const timepoints=samples.map(s=>r(s)?.timepoint);
  const valid = str(x.metric) && x.scale === '0-10' && samples.length === 3 && JSON.stringify(timepoints) === JSON.stringify(['T0','T1','T2'])
    && samples.every(s=>num(r(s)?.value,0,10) && ['student_self_report','verified_assessment'].includes(String(r(s)?.provenance)))
    && ordered(samples.map(s=>r(s)?.observedDay));
  checks.push(status('Dữ liệu T0/T1/T2 cùng thang đo',valid ? 'PASS' : 'WARN',valid ? 'Ba thời điểm, nguồn và thang 0–10 có cấu trúc hợp lệ.' : 'Thiếu T0/T1/T2, không cùng thang hoặc timestamp không theo thứ tự; không kết luận xu hướng.'));
 }
 checks.push(scope('Kết luận tiến bộ, hiệu quả và sai số', 'Chưa có đối chứng, đo lặp reliability, missingness, confidence interval hoặc kiểm định ngoại sinh; không suy luận cải thiện do CLA.'));
 return checks;
}

export function auditHavenFinance(input: unknown): GovernanceCheck[] {
 const pre = base(input, 'cla.nexus.haven-finance.v1', 'Giả định tài chính'); if (pre) return pre;
 const estimates=arr(r(input)?.estimates);
 if (!estimates.length || estimates.length>50 || !unique(estimates.map(v=>r(v)?.id))) return [status('Danh mục chi phí', 'FAIL', 'Cần 1–50 ID dự toán duy nhất.')];
 const checks: GovernanceCheck[]=[];
 for (const item of estimates) {
  const x=r(item)!; const source = https(x.tuitionSourceUrl) && day(x.tuitionSourceDay) && https(x.fxSourceUrl) && day(x.fxSourceDay);
  const values = ['VND','USD','SGD','JPY','KRW','GBP','EUR','AUD','CAD'].includes(String(x.currency))
   && num(x.tuition,0,1e9) && num(x.living,0,1e9) && num(x.travel,0,1e9) && num(x.fxToVnd,0.000001,1e9) && x.period === 'year';
  const scholarship = x.scholarship === null || (num(x.scholarship,0,1e9) && x.scholarshipVerified === false);
  checks.push(status('Giá trị và kỳ dự toán',values && scholarship ? 'PASS' : 'FAIL',values && scholarship ? 'Khoản 0 được giữ hợp lệ; chi phí và tỷ giá có đơn vị, kỳ hạn.' : 'Thiếu đơn vị, tiền, tỷ giá hoặc học bổng bị coi là đã xác minh.'));
  checks.push(status('Nguồn học phí và tỷ giá',source ? 'WARN' : 'FAIL',source ? 'Có link nguồn và ngày tự khai, chưa xác minh trực tiếp lịch sử tỷ giá/học phí.' : 'Thiếu nguồn HTTPS hoặc ngày hiệu lực nguồn.'));
 }
 checks.push(scope('Khả năng chi trả và học bổng thực tế', 'Chưa kiểm tra chi phí chương trình, học bổng có hiệu lực, tax, thu nhập hộ gia đình hoặc biến động FX. Không dùng làm quyết định tài chính.'));
 return checks;
}
