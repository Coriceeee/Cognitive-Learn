/** CP31: Admin-only review inventory; presence of a link is NOT a PASS. */
export type NexusReviewTask = {
  id: string;
  title: string;
  description: string;
  group: string;
  status: "limited" | "planned";
  href?: string;
};
export type NexusReviewGroup = { key: string; title: string; tasks: readonly NexusReviewTask[] };
export type NexusReviewItem = NexusReviewTask & {
  cluster: string;
  acceptance: string;
  evidence: string;
  diagnosticPath: string | null;
};

/** Each requirement must produce positive and negative evidence, not a demo-only PASS. */
export const nexusAcceptance: Readonly<Record<string, readonly [string, string]>> = {
  health: ["Kiểm tra API health và Firestore trực tiếp; ghi rõ Gemini NOT TESTED nếu không gọi thật.", "HTTP status + response hợp lệ + test role đọc own-UID; deploy log"],
  roles: ["Thử allow/deny của từng vai trò, bao gồm thu hồi active và truy cập chéo UID.", "Firebase Emulator matrix + browser role E2E"],
  accounts: ["Backend operator/MFA bật có chủ đích; khóa, đổi role, truy vết không tự nâng quyền.", "Functions Emulator + audit trace + MFA/auth proof"],
  release: ["Đối chiếu SHA bản deploy, CI, backup, phương án rollback có chạy thử.", "CI build/deploy evidence + rollback drill"],
  "seed-audit": ["Đối chiếu 9 môn, 4 môn khóa, GPA, UID, schema và nhãn demo.", "Read-only Seed diagnostic + GPA consistency report"],
  "seed-rules": ["Chạy ma trận học sinh, admin, tài khoản vai trò cũ và token sai quyền.", "Firestore Emulator 86+ tests + exact candidate SHA"],
  "seed-migration": ["Dry-run migration có kiểm tra, đối soát dữ liệu legacy và rollback.", "Schema diff + migration dry-run log + backup verification"],
  cognitive: ["Golden case engine và tính ổn định; không suy diễn psychometric validity.", "Versioned golden cases + source mapping"],
  ml: ["Đánh giá missingness, leakage, nhóm train/holdout, quyền dùng dữ liệu thật.", "Manifest + consent register + split audit"],
  "model-eval": ["Holdout metrics và calibration/bias có CI; không biến proxy thành outcome thật.", "Versioned model card + holdout/calibration report"],
  "atlas-data": ["Kiểm tra trạng thái workspace và provenance nguồn tuyển sinh, không tự xác minh nguồn.", "Own-UID diagnostic + official source registry"],
  "atlas-approve": ["Quy trình duyệt nguồn chính thức với năm và người duyệt độc lập.", "Official URL verification + approval/audit log"],
  "atlas-fresh": ["Phát hiện nguồn quá hạn và gap dữ liệu ba năm theo ngành/phương thức.", "Freshness report + 2024–2026 coverage matrix"],
  "orion-audit": ["Đọc dữ liệu Orion hợp lệ của chính UID, không khẳng định hiệu quả.", "Own-UID diagnostic + policy version"],
  "orion-policy": ["Test trigger, dose, stop rule, human override và version policy.", "Versioned scenario decision/replay tests"],
  "orion-scenarios": ["Golden cases, sai số và outcome quan sát độc lập khi có dữ liệu.", "Scenario replay + observed-outcome comparison"],
  "pulse-audit": ["Kiểm tra bản nháp và tình trạng dữ liệu đo lặp, không tự tạo kết quả.", "Own-UID diagnostic + measurement log"],
  "pulse-evidence": ["Kiểm tra Evidence Record, version/provenance và chống sửa đổi.", "Evidence lineage trace + immutable record checks"],
  "pulse-trends": ["Không khẳng định cải thiện nếu thiếu T0/T1/T2 và cùng thang đo.", "Longitudinal measurement report + missingness table"],
  "haven-audit": ["Đối chiếu bản nháp Haven, dữ liệu thiếu và ngân sách nhập từ người học.", "Own-UID diagnostic + zero/missing distinction"],
  "haven-sources": ["Xác minh URL, yêu cầu chứng chỉ, thời hạn và năm áp dụng từng học bổng.", "Official scholarship source + dated verification"],
  "haven-finance": ["Ghi nguồn học phí, tỷ giá, ngày hiệu lực và biến thiên giả định.", "Source register + dated FX/tuition assumptions"],
};
const permittedViews = new Set([
  "health", "roles", "accounts", "release", "seed-rules", "model-eval", "seed", "seed-migration", "cognitive", "ml", "atlas", "atlas-fresh", "orion", "pulse", "haven", "haven-sources", "atlas-approve", "orion-policy", "orion-scenarios", "pulse-evidence", "pulse-trends", "haven-finance",
]);
export function buildNexusAudit(groups: readonly NexusReviewGroup[]): NexusReviewItem[] {
  const seen = new Set<string>();
  const output: NexusReviewItem[] = [];
  for (const group of groups) {
    for (const task of group.tasks) {
      if (!Object.prototype.hasOwnProperty.call(nexusAcceptance, task.id) || seen.has(task.id)) {
        throw new Error(`Invalid or repeated Nexus task ID: ${task.id}`);
      }
      seen.add(task.id);
      let diagnosticPath: string | null = null;
      if (task.href !== undefined) {
        // Strict allowlist: never propagate an untrusted URL into Admin navigation.
        const match = /^\/admin\/diagnostics\?view=([a-z-]+)$/.exec(task.href);
        if (!match || !permittedViews.has(match[1]) || task.status !== "limited") {
          throw new Error(`Unsafe/misleading Nexus diagnostic: ${task.id}`);
        }
        diagnosticPath = task.href;
      } else if (task.status !== "planned") {
        throw new Error(`Task ${task.id} claims diagnostic exists without a route`);
      }
      const [acceptance, evidence] = nexusAcceptance[task.id];
      output.push({ ...task, cluster: group.title, acceptance, evidence, diagnosticPath });
    }
  }
  if (output.length !== Object.keys(nexusAcceptance).length) {
    throw new Error(`Incomplete Nexus audit inventory: ${output.length}/${Object.keys(nexusAcceptance).length}`);
  }
  return output;
}
export function summarizeNexusAudit(items: readonly NexusReviewItem[]) {
  return {
    total: items.length,
    diagnosticPages: items.filter(item => item.diagnosticPath !== null).length,
    notImplemented: items.filter(item => item.diagnosticPath === null).length,
    accepted: 0, // Never infer a reviewer PASS from source, an endpoint or a navigation link.
  };
}
