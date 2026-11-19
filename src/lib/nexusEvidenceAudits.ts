/** CP31 Batch 4: read-only evidence assessment for three Admin diagnostics.
 * A JSON file supplied by an operator is NOT an independently trusted report.
 * PASS is reserved for local structural/content consistency only; it never means
 * a production deployment, 86 Emulator tests, or external scientific validity.
 */
export type EvidenceCheck = { name: string; status: "PASS" | "WARN" | "FAIL" | "NOT TESTED"; detail: string };
type Obj = Record<string, unknown>;
const sha256RE = /^[a-f0-9]{64}$/;
const commitRE = /^[a-f0-9]{40}$/;
function obj(value: unknown): Obj | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Obj : null;
}
function validSha(value: unknown): value is string { return typeof value === "string" && sha256RE.test(value); }
function validTime(value: unknown): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))
    && Date.parse(value) <= Date.now() + 300000;
}
function https(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !!u.hostname && !u.username && !u.password && !u.hash;
  } catch { return false; }
}
function check(name: string, status: EvidenceCheck["status"], detail: string): EvidenceCheck {
  return { name, status, detail };
}

/** Accepts a local release evidence record. Its CI/deploy claims remain self-reported. */
export function auditReleaseEvidence(raw: unknown, expectedSourceSha256: string): EvidenceCheck[] {
  if (!validSha(expectedSourceSha256)) throw new Error("Missing trusted release source fingerprint");
  const doc = obj(raw);
  if (!doc) return [
    check("Bằng chứng release", "NOT TESTED", "Chưa nhập báo cáo release JSON; chưa đối chiếu source với CI."),
    check("CI, deploy, backup, rollback", "NOT TESTED", "Không có bằng chứng chạy pipeline, deploy hoặc rollback từ môi trường được kiểm soát."),
  ];
  if (doc.schema !== "cla.nexus.release-evidence.v1") return [check("Định dạng release", "FAIL", "Sai schema báo cáo; từ chối đánh giá tự động.")];
  const sourceMatches = doc.sourceTreeSha256 === expectedSourceSha256;
  const results: EvidenceCheck[] = [
    check("Định dạng release", "PASS", "Đúng schema cla.nexus.release-evidence.v1 (chỉ kiểm tra cấu trúc)."),
    check("Fingerprint source", sourceMatches ? "PASS" : "FAIL",
      sourceMatches ? "SHA-256 source trong báo cáo khớp mốc phát hành tích hợp trong ứng dụng." : "SHA-256 source không khớp bản phát hành; không kết luận CI/deploy hợp lệ."),
  ];
  const ci = obj(doc.ci);
  const ciShape = !!ci && ci.status === "PASS" && ci.exitCode === 0
    && typeof ci.commitSha === "string" && commitRE.test(ci.commitSha)
    && https(ci.runUrl) && validTime(ci.finishedAt) && validSha(ci.artifactSha256);
  results.push(check("Bằng chứng CI", !ci ? "NOT TESTED" : ciShape ? "WARN" : "FAIL",
    !ci ? "Thiếu CI build/test report." : ciShape
      ? "CI report được khai báo đủ trường; cần đối chiếu trực tiếp với nhà cung cấp CI và artifact trước nghiệm thu."
      : "CI thiếu commit, artifact checksum, kết quả chạy, URL HTTPS hoặc thời điểm hợp lệ."));
  const deploy = obj(doc.deployment);
  const deployShape = !!deploy && deploy.status === "DEPLOYED" && https(deploy.url)
    && validTime(deploy.deployedAt) && ciShape && deploy.artifactSha256 === ci!.artifactSha256;
  results.push(check("Đối chiếu deploy artifact", !deploy ? "NOT TESTED" : deployShape ? "WARN" : "FAIL",
    !deploy ? "Chưa có bản ghi triển khai." : deployShape
      ? "Artifact được khai báo trùng CI; phải kiểm tra thực tế trên hosting và qua CI/CD audit log."
      : "Bản ghi deploy không hợp lệ hoặc checksum artifact không khớp CI."));
  for (const kind of ["backup", "rollback"] as const) {
    const item = obj(doc[kind]);
    const valid = !!item && item.status === "PASS" && validTime(item.verifiedAt) && https(item.runUrl);
    results.push(check(kind === "backup" ? "Khôi phục backup" : "Thử rollback", !item ? "NOT TESTED" : valid ? "WARN" : "FAIL",
      !item ? `Chưa có log kiểm tra ${kind}.` : valid
        ? "Có metadata kiểm tra; cần xác minh log độc lập và kết quả thực tế trước khi công nhận PASS."
        : "Thiếu dấu vết kiểm tra có thời điểm và URL HTTPS hợp lệ."));
  }
  results.push(check("Nghiệm thu phát hành production", "NOT TESTED",
    "Không thể kết luận deploy/backup/rollback đã thành công dựa trên JSON do trình duyệt nhận; cần reviewer và nguồn CI/hosting độc lập."));
  return results;
}

/** Matches the shape actually produced by tools/firestoreSecurityGate.cjs. */
export function auditRulesGateEvidence(raw: unknown, candidateSha256: string): EvidenceCheck[] {
  if (!validSha(candidateSha256)) throw new Error("Missing pinned candidate Rules SHA-256");
  const report = obj(raw);
  if (!report) return [
    check("Firestore Emulator", "NOT TESTED", "Chưa nhập reports/security/firestore_emulator_gate.json từ máy đã chạy Emulator."),
    check("86 ca kiểm thử và Rules production", "NOT TESTED", "Chưa có test case log hoặc xác minh rules deployment."),
  ];
  if (report.gateVersion !== "cla-firestore-security-gate-v1" || report.projectId !== "demo-cla-cp21-security"
      || report.rulesFile !== "firestore.rules.CANDIDATE_CP21") {
    return [check("Nguồn Security Gate", "FAIL", "Sai phiên bản gate, project demo hoặc rules file; từ chối báo cáo.")];
  }
  const shaMatch = report.rulesSha256 === candidateSha256;
  const validRun = report.preflight === "PASS" && report.staticTests === "PASS"
    && report.emulatorAuthorizationTests === "PASS" && report.overall === "PASS" && validTime(report.at)
    && report.productionRulesVerified === false && report.productionDeploymentPerformed === false;
  return [
    check("SHA-256 Rules candidate", shaMatch ? "PASS" : "FAIL", shaMatch
      ? "Checksum của bản Rules candidate trùng mốc source đã đóng gói." : "Checksum khác bản candidate; không được áp dụng báo cáo này."),
    check("Báo cáo Firestore Emulator", !shaMatch ? "FAIL" : validRun ? "WARN" : "FAIL",
      !shaMatch ? "Sai candidate SHA-256." : validRun
        ? "Báo cáo được khai là PASS trên demo emulator; vẫn cần log ca test và xác minh độc lập."
        : "Gate thiếu PASS thực sự, quá thời gian hợp lệ hoặc khai nhầm đã deploy production."),
    check("86 ca allow/deny và ma trận quyền", "NOT TESTED",
      "Gate JSON không ghi số ca và từng assertion; cần log kết quả 86 ca, role matrix và reviewer kiểm tra."),
    check("Rules đã triển khai production", "NOT TESTED",
      "Kiểm thử local không xác minh bản Rules đã deploy; yêu cầu kiểm tra riêng qua Firebase console/deployment evidence."),
  ];
}

function number(value: unknown, lower: number, upper: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= lower && value <= upper;
}
function validMetricModel(raw: unknown): boolean {
  const m = obj(raw);
  return !!m && number(m.roc_auc, 0, 1) && number(m.brier, 0, 1)
    && number(m.log_loss, 0, 100) && number(m['accuracy_at_0.5'], 0, 1);
}
/** Evaluates aggregate-only CP23 public OULAD evidence; rejects synthetic QA results. */
export function auditModelEvidence(raw: unknown): EvidenceCheck[] {
  const report = obj(raw);
  if (!report) return [
    check("Đánh giá holdout", "NOT TESTED", "Chưa nhập public/research/oulad-evidence.json tạo sau audit trên OULAD thật."),
    check("Hiệu quả với học sinh THPT Việt Nam", "NOT TESTED", "Chưa có dữ liệu outcome THPT Việt Nam và kiểm định bên ngoài."),
  ];
  if (report.schema_version !== "cla.oulad.public-evidence.v1" || report.audit_status !== "PASS"
      || report.dataset !== "Open University Learning Analytics Dataset (OULAD)") {
    return [check("Nguồn nghiên cứu", "FAIL", "Không phải public OULAD evidence có audit PASS; không dùng fixture hay mô phỏng làm kết quả thực.")];
  }
  const counts = obj(report.split_counts), models = obj(report.models), comparison = obj(report.comparison), provenance = obj(report.provenance);
  const academic = obj(models?.academic_only), behavior = obj(models?.academic_plus_behavior);
  const splitValid = !!counts && ["train", "val", "test"].every(key => number(counts[key], 1, 10000000) && Number.isInteger(counts[key]))
    && number(report.test_count, 1001, 10000000) && Number.isInteger(report.test_count) && counts.test === report.test_count;
  const designValid = report.cutoff_day === 30 && validTime(report.audit_timestamp_utc)
    && report.cohort === "UK online university courses; not Vietnamese high-school students"
    && report.outcome === "Pass or Distinction vs Fail or Withdrawn (end of course)"
    && !!provenance && validSha(provenance.archive_sha256) && validSha(provenance.features_sha256);
  const metricsValid = validMetricModel(academic) && validMetricModel(behavior);
  const ci = comparison?.learner_cluster_bootstrap_ci95;
  const ciValid = !!comparison && number(comparison.brier_improvement, -1, 1)
    && Array.isArray(ci) && ci.length === 2 && number(ci[0], -1, 1) && number(ci[1], -1, 1) && ci[0] <= ci[1]
    && metricsValid && Math.abs((academic!.brier as number) - (behavior!.brier as number)
      - (comparison.brier_improvement as number)) <= 0.00001;
  return [
    check("Tập holdout và provenance", splitValid && designValid ? "PASS" : "FAIL", splitValid && designValid
      ? `Mô tả split và SHA hợp lệ; n test=${report.test_count} (chỉ chứng thực cấu trúc JSON).`
      : "Thiếu dữ liệu train/val/test, checksum archive/features, cohort/cutoff hoặc thời điểm kiểm toán hợp lệ."),
    check("ROC-AUC, Brier và bootstrap CI", metricsValid && ciValid ? "PASS" : "FAIL", metricsValid && ciValid
      ? "Các metric và CI có miền giá trị nhất quán với hiệu số Brier đã công bố; chưa tái chạy mô hình."
      : "Thiếu/không hợp lệ metric, khoảng tin cậy hoặc brier delta không khớp hai mô hình."),
    check("Đường calibration và bias theo nhóm", "NOT TESTED",
      "Báo cáo aggregate hiện chỉ có metric tổng và CI của Brier delta; cần biểu đồ calibration, ECE và đối soát từng nhóm hợp lệ."),
    check("Bằng chứng fit/evaluation độc lập", "NOT TESTED",
      "Cần chạy lại trên OULAD gốc và so sánh source SHA/features SHA, kết quả kiểm toán; JSON có thể bị chỉnh sửa."),
    check("Bias và external validation THPT Việt Nam", "NOT TESTED",
      "OULAD là dữ liệu đại học trực tuyến Anh; không chứng minh năng lực dự báo cá nhân, tác động can thiệp, bias trong học sinh Việt Nam."),
  ];
}
