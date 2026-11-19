/** CP31 Batch 3: read-only operational checks. All outputs omit PII and grant no permissions.
 * PASS means a local structural check only, NEVER official-site freshness, deployment or reviewer PASS.
 */
export type AuditCheck = { name: string; status: "PASS" | "WARN" | "FAIL" | "NOT TESTED"; detail: string };
type Document = Record<string, unknown>;
export type AdmissionEntry = {
  id: string;
  years: readonly { year: number; schemeUrl: string; detailsStatus: string; methods: readonly string[]; cutoffUrl?: string }[];
};
export type ScholarshipEntry = {
  id: string; sourceUrl: string; reviewedDate: string; availability: string;
  conditions: readonly string[]; documentChecks: readonly string[]; credentialNote: string; intakeNote: string;
};
const requiredYears = [2024, 2025, 2026] as const;
function record(v: unknown): Document | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v as Document : null;
}
function safeHttps(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 2048) return false;
  try { const u = new URL(value); return u.protocol === "https:" && !!u.hostname && !u.username && !u.password && !u.hash; }
  catch { return false; }
}
function validDay(v: unknown): boolean {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v;
}
function asOfDay(raw: string): number {
  if (!validDay(raw)) throw new Error("Invalid audit date");
  return Date.parse(raw + "T00:00:00.000Z");
}
function issue(name: string, status: AuditCheck["status"], detail: string): AuditCheck {
  return { name, status, detail };
}
/** Scope: only the already authorized Admin UID's two documents. No migration writes. */
export function auditSeedMigration(profileRaw: unknown, transcriptRaw: unknown, uid: string): AuditCheck[] {
  if (typeof uid !== "string" || !uid.trim()) throw new Error("UID required");
  const profile = record(profileRaw), transcript = record(transcriptRaw);
  if (!profile && !transcript) return [issue("Dữ liệu Seed", "WARN", "Chưa có hồ sơ hoặc bảng điểm của UID Admin Demo hiện tại."),
    issue("Chuyển đổi dữ liệu", "NOT TESTED", "Không ghi hay di chuyển bản ghi tự động.")];
  const checks: AuditCheck[] = [];
  if (!profile || !transcript) {
    const hasLegacy = !!(profile && record(profile.transcript));
    checks.push(issue("Cặp tài liệu Seed", "WARN", hasLegacy
      ? "Có bảng điểm legacy trong hồ sơ; chưa có tài liệu student_transcripts tương ứng. Cần dry-run migration và sao lưu."
      : "Thiếu một trong hai tài liệu Seed. Không tự tạo bản ghi thay thế."));
  } else checks.push(issue("Cặp tài liệu Seed", "PASS", "Đã đọc cả hồ sơ và bảng điểm từ server (chỉ UID hiện tại)."));
  const present = [profile, transcript].filter((x): x is Document => x !== null);
  const wrongOwner = present.some(x => x.userId !== undefined && x.userId !== uid);
  const unknownOwner = present.some(x => x.userId === undefined);
  checks.push(issue("Quyền sở hữu", wrongOwner ? "FAIL" : unknownOwner ? "WARN" : "PASS",
    wrongOwner ? "Có tài liệu khai báo UID khác tài khoản đang kiểm tra; cần xử lý thủ công." :
    unknownOwner ? "Thiếu userId của bản ghi legacy; cần kiểm tra nguồn gốc." : "UID của các tài liệu đều khớp UID Admin hiện tại."));
  const unknownVersion = present.some(x => x.schemaVersion !== 1);
  checks.push(issue("Schema v1", unknownVersion ? "WARN" : "PASS", unknownVersion
    ? "Có tài liệu legacy/khác v1. Cần mapping migration và snapshot trước khi thay đổi." : "Các tài liệu đang có đều khai báo schemaVersion=1."));
  const badScope = present.some(x => x.dataScope !== "demo");
  checks.push(issue("Phạm vi Admin Demo", badScope ? "FAIL" : "PASS", badScope
    ? "Một hoặc nhiều bản ghi không có dataScope=demo; không được coi là dữ liệu demo hợp lệ."
    : "Cả bản ghi hiện có đều thuộc phạm vi demo."));
  if (profile && transcript) {
    const a = record(profile.curriculum), b = record(transcript.curriculum);
    if (!a || !b) checks.push(issue("Tổ hợp môn giữa hai tài liệu", "WARN", "Thiếu curriculum; chưa đối chiếu được 4 môn và ngoại ngữ."));
    else {
      const ae = a.selectedElectives, be = b.selectedElectives;
      const valid = Array.isArray(ae) && Array.isArray(be) && ae.length === 4 && be.length === 4
        && ae.every(v => typeof v === "string") && be.every(v => typeof v === "string");
      const equal = valid && new Set(ae).size === 4 && new Set(be).size === 4
        && ae.every(v => be.includes(v)) && a.foreignLanguage === b.foreignLanguage;
      checks.push(issue("Tổ hợp môn giữa hai tài liệu", equal ? "PASS" : "FAIL", equal
        ? "Tổ hợp bốn môn và ngoại ngữ khớp nhau." : "Tổ hợp môn hoặc ngoại ngữ bất nhất; chặn migration tự động."));
    }
  }
  checks.push(issue("Migration và rollback", "NOT TESTED", "Chỉ chẩn đoán đọc dữ liệu hiện tại; chưa chạy dry-run, backup hay rollback."));
  return checks;
}
/** Registry metadata check, NOT a live HTTP check of university sites. */
export function auditAdmissionCoverage(items: readonly AdmissionEntry[]): AuditCheck[] {
  const ids = new Set<string>();
  const checks: AuditCheck[] = [];
  for (const entry of items) {
    if (!entry.id || ids.has(entry.id)) {
      checks.push(issue("Trùng/mất mã trường", "FAIL", "Trùng mã hoặc thiếu ID trường trong registry."));
      continue;
    }
    ids.add(entry.id);
    const years = new Set<number>();
    let wrongUrl = false, duplicate = false, archiveOnly = 0, emptyMethods = 0;
    for (const year of entry.years) {
      if (years.has(year.year)) duplicate = true;
      years.add(year.year);
      if (!safeHttps(year.schemeUrl) || (year.cutoffUrl !== undefined && !safeHttps(year.cutoffUrl))) wrongUrl = true;
      if (year.detailsStatus === "official_archive_only") archiveOnly++;
      if (year.methods.length === 0) emptyMethods++;
      if (!(["institution_method_verified", "official_archive_only"].includes(year.detailsStatus))) wrongUrl = true;
    }
    const missing = requiredYears.filter(y => !years.has(y));
    const structural = !missing.length && !wrongUrl && !duplicate && years.size === 3;
    checks.push(issue(`Trường ${entry.id} · 2024–2026`, structural ? "PASS" : "WARN",
      structural ? `Có 3 bản ghi năm; ${archiveOnly} năm chỉ có archive, ${emptyMethods} năm chưa chuẩn hóa phương thức.`
        : `Thiếu ${missing.length} năm; lỗi URL/schema=${wrongUrl}; trùng năm=${duplicate}.`));
    if (archiveOnly || emptyMethods) checks.push(issue(`Độ phủ phương thức ${entry.id}`, "WARN",
      `${archiveOnly} năm archive-only; ${emptyMethods} năm chưa có phương thức chuẩn hóa; không kết luận đã phủ theo ngành.`));
  }
  checks.unshift(issue("Quy mô registry Atlas", items.length ? "PASS" : "WARN", `${items.length} trường được liệt kê trong dữ liệu đóng gói.`));
  checks.push(issue("Tình trạng URL, điểm chuẩn và hiệu lực hiện tại", "NOT TESTED",
    "Chưa truy cập các website trường lúc chạy kiểm toán. Registry không chứng minh URL còn hoạt động hay ngành/phương thức đã phủ đủ 3 năm."));
  return checks;
}
/** Scholarship source structure only, no claims about eligibility, current calls or deadlines. */
export function auditScholarshipSources(items: readonly ScholarshipEntry[], asOf: string): AuditCheck[] {
  const today = asOfDay(asOf); const ids = new Set<string>();
  const checks: AuditCheck[] = [];
  for (const s of items) {
    const unique = !!s.id && !ids.has(s.id);
    ids.add(s.id);
    const dated = validDay(s.reviewedDate);
    const age = dated ? Math.round((today - asOfDay(s.reviewedDate))/86400000) : null;
    const valid = unique && safeHttps(s.sourceUrl) && dated && age !== null && age >= 0
      && Array.isArray(s.conditions) && s.conditions.length > 0
      && Array.isArray(s.documentChecks) && s.documentChecks.length > 0
      && !!s.credentialNote.trim() && !!s.intakeNote.trim()
      && ["check-cycle", "archive-cycle"].includes(s.availability);
    checks.push(issue(`Học bổng ${s.id || "không có ID"}`, valid ? (age! > 90 ? "WARN" : "PASS") : "FAIL", valid
      ? `Metadata hợp lệ; kiểm tra nguồn cách đây ${age} ngày; ${s.availability === "archive-cycle" ? "kỳ lưu trữ" : "cần xem kỳ nộp"}. KHÔNG xác nhận đang mở.`
      : "Thiếu/không hợp lệ: nguồn HTTPS, ngày review, ID duy nhất, chứng chỉ, hồ sơ hoặc điều kiện."));
  }
  checks.unshift(issue("Quy mô registry Haven", items.length ? "PASS" : "WARN", `${items.length} học bổng được liệt kê trong dữ liệu đóng gói.`));
  checks.push(issue("Deadline, yêu cầu từng kỳ và nguồn đang hoạt động", "NOT TESTED",
    "Chưa kiểm tra trực tiếp website học bổng theo từng kỳ nộp. Không suy ra deadline, tính đủ điều kiện, mức hỗ trợ hay trạng thái open-call."));
  return checks;
}
