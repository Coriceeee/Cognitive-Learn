import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { calculateCognitive } from "../../engines/cognitive/cognitiveEngine";
import { getNineGradedSubjects, isValidElectiveSelection } from "../seed/services/academicCurriculum";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

type View = "health" | "seed" | "cognitive" | "ml";
type Check = { name: string; status: "PASS" | "WARN" | "FAIL" | "NOT TESTED"; detail: string };
type Result = { at: string; checks: Check[] };
type Data = Record<string, unknown>;

const views: Record<View, { title: string; subtitle: string }> = {
  health: { title: "Tổng quan hệ thống", subtitle: "Kiểm tra kết nối thật; không tạo KPI hoặc trạng thái giả." },
  seed: { title: "Kiểm tra dữ liệu nền", subtitle: "Kiểm tra hồ sơ và bảng điểm của UID Admin Demo hiện tại." },
  cognitive: { title: "Kiểm tra Cognitive Engine", subtitle: "Kiểm thử tính xác định của engine và snapshot hiện có; chỉ số còn mang tính thăm dò." },
  ml: { title: "Chuẩn bị dữ liệu ML", subtitle: "Kiểm tra schema, tính đầy đủ và điều kiện nghiên cứu; không xuất hồ sơ cá nhân." },
};

function asRecord(v: unknown): Data {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? v as Data : {};
}
function toStatus(ok: boolean): Check["status"] { return ok ? "PASS" : "FAIL"; }
function check(name: string, ok: boolean, detail: string): Check { return { name, status: toStatus(ok), detail }; }
function currentView(): View {
  const value = new URLSearchParams(window.location.search).get("view");
  return value === "seed" || value === "cognitive" || value === "ml" ? value : "health";
}
function evaluateTranscript(profile: Data, scores: Data): Check[] {
  const curriculum = asRecord(Object.keys(asRecord(scores.curriculum)).length ? scores.curriculum : profile.curriculum);
  const electives = curriculum.selectedElectives;
  const validFour = Array.isArray(electives) && electives.every(x => typeof x === "string")
    && isValidElectiveSelection(electives as string[]);
  const foreignLanguage = typeof curriculum.foreignLanguage === "string" ? curriculum.foreignLanguage : "";
  const graded = validFour ? getNineGradedSubjects(foreignLanguage, electives as string[]) : [];
  const locked = curriculum.electiveSelectionLocked === true;
  const subjects = curriculum.gradedSubjects;
  const gradedOK = validFour && foreignLanguage.length > 0 && Array.isArray(subjects)
    && JSON.stringify(subjects) === JSON.stringify(graded);
  const checks: Check[] = [
    check("Chọn đúng bốn môn", validFour, validFour ? "Bốn môn duy nhất trong danh sách chương trình." : "Chưa có tổ hợp hợp lệ; không sửa tự động."),
    check("Tổ hợp đã khóa", locked, locked ? "Cờ khóa có trong dữ liệu." : "Chưa xác nhận electiveSelectionLocked=true."),
    check("Chín môn học", gradedOK, gradedOK ? "Đúng thứ tự và cấu trúc 9 môn." : "Danh sách chín môn hoặc ngoại ngữ chưa hợp lệ."),
  ];
  const grades = asRecord(scores.transcript);
  let filled = 0;
  let invalid = 0;
  for (const grade of ["grade10", "grade11", "grade12"]) {
    const year = asRecord(grades[grade]);
    for (const semester of ["semester1", "semester2"]) {
      const term = asRecord(year[semester]);
      for (const subject of graded) {
        const row = asRecord(term[subject]);
        const entries = [...(Array.isArray(row.regular) ? row.regular : []), row.midterm, row.final];
        for (const value of entries) {
          if (value === null || value === undefined || value === "") continue;
          filled++;
          const n = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
          if (typeof value === "boolean" || !Number.isFinite(n) || n < 0 || n > 10) invalid++;
        }
      }
    }
  }
  checks.push(check("Điểm trong khoảng 0–10", invalid === 0,
    `${filled} ô có dữ liệu thuộc 9 môn hiện tại; ${invalid} giá trị không hợp lệ.`));
  checks.push({ name: "Tính đầy đủ bảng điểm", status: filled > 0 ? "PASS" : "WARN",
    detail: filled > 0 ? `Đã ghi nhận ${filled} ô điểm (chưa đồng nghĩa hoàn thành học kỳ).` : "Chưa có điểm để đánh giá." });
  return checks;
}

async function readOwn(user: User, collection: string): Promise<Data | null> {
  const snapshot = await getDocFromServer(doc(db, collection, user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function runChecks(user: User, view: View): Promise<Check[]> {
  if (view === "health") {
    const checks: Check[] = [];
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const body: unknown = await response.json();
      const ok = response.ok && asRecord(body).ok === true;
      checks.push(check("API health endpoint", ok, ok
        ? "HTTP hoạt động; kết quả không chứng minh Gemini hoặc các API khác sẵn sàng."
        : `API trả HTTP ${response.status} hoặc payload không hợp lệ.`));
    } catch (error) {
      checks.push({ name: "API health endpoint", status: "FAIL", detail: String(error) });
    }
    try {
      const account = await readOwn(user, "users");
      checks.push(check("Firestore và quyền tài khoản Admin", account?.role === "admin" && account.active === true,
        account ? "Đã đọc users/{ownUid} trực tiếp từ server." : "Không tìm thấy tài liệu tài khoản."));
    } catch (error) {
      checks.push({ name: "Firestore và quyền tài khoản Admin", status: "FAIL", detail: String(error) });
    }
    checks.push({ name: "Gemini và chất lượng mô hình", status: "NOT TESTED",
      detail: "Endpoint health không thực hiện lời gọi Gemini; cần bộ API/LLM benchmark có xác thực." });
    checks.push({ name: "Tình trạng tất cả tài khoản", status: "NOT TESTED",
      detail: "Không được đọc toàn bộ users từ client; cần backend Admin đã xác thực và ghi audit." });
    return checks;
  }
  const [profile, transcript] = await Promise.all([readOwn(user, "learning_profiles"), readOwn(user, "student_transcripts")]);
  const checks: Check[] = [
    check("Hồ sơ tồn tại", profile !== null, profile ? "Đã đọc learning_profiles/{ownUid}." : "Chưa lưu hồ sơ."),
    check("Bảng điểm tồn tại", transcript !== null, transcript ? "Đã đọc student_transcripts/{ownUid}." : "Chưa lưu bảng điểm."),
  ];
  if (!profile || !transcript) {
    checks.push({ name: "Phân tích sâu", status: "WARN", detail: "Cần có cả hai tài liệu của UID hiện tại để đối chiếu." });
    return checks;
  }
  checks.push(check("Nhãn dữ liệu Admin Demo", profile.dataScope === "demo" && transcript.dataScope === "demo",
    `Scope hồ sơ: ${String(profile.dataScope ?? "thiếu")}; scope bảng điểm: ${String(transcript.dataScope ?? "thiếu")}.`));
  checks.push(check("UID sở hữu nhất quán", profile.userId === user.uid && transcript.userId === user.uid,
    "Chỉ so sánh UID của tài khoản đang đăng nhập; không truy vấn học sinh khác."));
  checks.push({ name: "Phiên bản schema hồ sơ/bảng điểm",
    status: profile.schemaVersion === 1 && transcript.schemaVersion === 1 ? "PASS" : "WARN",
    detail: `learning_profiles v${String(profile.schemaVersion ?? "legacy")}; student_transcripts v${String(transcript.schemaVersion ?? "legacy")}. Hồ sơ cũ cần được chuyển đổi trước khi xác nhận.` });
  checks.push(...evaluateTranscript(profile, transcript));
  if (view === "seed") return checks;
  if (view === "cognitive") {
    const seed = { planCompletionRate: 72, motivationLevel: 68, studyHoursPerWeek: 10,
      practiceTestsPerWeek: 3, learningStrategy: 55 };
    const a = calculateCognitive(seed);
    const b = calculateCognitive(seed);
    const normalized = (value: typeof a) => ({ ...value, vector: { ...value.vector, timestamp: "OMITTED_NONDETERMINISTIC_CLOCK" } });
    const identical = JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));
    checks.push(check("Golden case deterministic", identical && Number.isFinite(a.SCI),
      "Cùng một bộ dữ liệu kiểm thử cho cùng đầu ra; không phải chứng cứ psychometric."));
    const measurement = asRecord(profile.cognitiveMeasurement);
    checks.push({ name: "Snapshot nhận thức đã lưu",
      status: Object.keys(measurement).length ? "PASS" : "WARN",
      detail: Object.keys(measurement).length
        ? `mappingVersion=${String(measurement.mappingVersion ?? "không ghi")}; scoreAvailable=${String(measurement.scoreAvailable ?? "không ghi")}. Các chỉ số là proxy.`
        : "Chưa có cognitiveMeasurement; không tự tạo kết quả." });
    checks.push({ name: "Kiểm định tâm trắc SCI/MAS/CSL", status: "NOT TESTED",
      detail: "Cần nghiên cứu reliability/validity phù hợp; golden case chỉ kiểm tra mã nguồn." });
    return checks;
  }
  const fields = asRecord(profile.behavior);
  const present = Object.values(fields).filter(v => typeof v === "number" && Number.isFinite(v)).length;
  checks.push({ name: "Dữ liệu hành vi", status: present ? "PASS" : "WARN",
    detail: `${present} trường số hành vi có dữ liệu trên hồ sơ hiện tại; chưa xác nhận consent nghiên cứu.` });
  checks.push({ name: "Outcome theo thời gian", status: "NOT TESTED",
    detail: "Một hồ sơ UID không đủ chứng minh có nhãn T1/T2 hoặc bộ dữ liệu nhiều học sinh." });
  checks.push({ name: "Quyền dùng dữ liệu nghiên cứu", status: "NOT TESTED",
    detail: "Không suy ra đồng ý nghiên cứu từ đăng nhập ứng dụng; cần Data Permission Register." });
  checks.push({ name: "ML train/holdout", status: "NOT TESTED",
    detail: "Chưa huấn luyện hoặc kiểm định dự báo. Không thể dùng dữ liệu demo để tính accuracy." });
  return checks;
}

export default function AdminDiagnosticsPage() {
  const view = currentView();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  async function inspect() {
    if (!user) { setError("Chưa có phiên đăng nhập hợp lệ."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const account = await readOwn(user, "users");
      if (account?.role !== "admin" || account.active !== true) {
        setError("Chỉ tài khoản Admin đang hoạt động mới được kiểm tra."); return;
      }
      const checks = await runChecks(user, view);
      setResult({ at: new Date().toLocaleString("vi-VN"), checks });
    } catch (e) { setError(`Không thể kiểm tra: ${String(e)}`); }
    finally { setBusy(false); }
  }
  return (
    <main className="profile-page cla-transcript-page">
      <div className="profile-floating-header">
        <a className="profile-home-logo" href="/admin"><img src={appLogo} alt="Cognitive Learn" /></a>
        <UserMenu />
      </div>
      <section className="profile-shell">
        <header className="profile-head"><span>NEXUS CORE · DIAGNOSTICS</span>
          <h1>{views[view].title}</h1><p>{views[view].subtitle}</p>
        </header>
        <nav aria-label="Công cụ kiểm tra Nexus" style={{ display:"flex",gap:12,flexWrap:"wrap",margin:"20px 0" }}>
          {(Object.keys(views) as View[]).map(v => <a key={v} href={`/admin/diagnostics?view=${v}`} aria-current={v === view ? "page" : undefined}>
            {views[v].title}</a>)}
        </nav>
        <p>Chỉ đọc dữ liệu được phép của tài khoản đang đăng nhập. Không cấp quyền khác qua tham số URL, không ghi tài liệu và không sử dụng kết quả demo làm kết quả nghiên cứu.</p>
        <button type="button" disabled={busy || !user} onClick={() => void inspect()}>
          {busy ? "Đang kiểm tra…" : "Chạy kiểm tra thực tế"}
        </button>
        {error && <p role="alert">{error}</p>}
        {result && <section aria-live="polite" style={{ marginTop:24 }}>
          <p><strong>Kiểm tra lúc {result.at}</strong> · Project: {db.app.options.projectId ?? "Không xác định"}</p>
          <div style={{ display:"grid",gap:12,marginTop:14 }}>
            {result.checks.map((item, index) => <article key={`${item.name}-${index}`} className="student-panel" style={{ padding:16 }}>
              <strong>{item.status} · {item.name}</strong><p>{item.detail}</p>
            </article>)}
          </div>
        </section>}
        <p style={{ marginTop:24 }}><a href="/admin">Trở về Nexus Console</a></p>
      </section>
    </main>
  );
}
