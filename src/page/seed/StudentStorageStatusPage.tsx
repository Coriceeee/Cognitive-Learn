import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

type Row = { label: string; collection: string; status: string; details: string };
const sources = [
  ["Tài khoản", "users"], ["Hồ sơ", "learning_profiles"],
  ["Bảng điểm", "student_transcripts"], ["Atlas", "atlas_workspaces"],
  ["Orion", "orion_drafts"], ["Pulse", "pulse_drafts"], ["Haven", "haven_drafts"],
  ["Bản nháp cũ", "module_drafts"],
] as const;

/** Diagnostic page. Read-only: no dummy writes or collections are created. */
export default function StudentStorageStatusPage() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function inspect() {
    if (!user) return;
    setBusy(true);
    try {
      const results = await Promise.all(sources.map(async ([label, coll]): Promise<Row> => {
        try {
          const snap = await getDocFromServer(doc(db, coll, user.uid));
          const data = snap.data();
          return { label, collection: coll, status: snap.exists() ? "Có tài liệu" : "Chưa lưu",
            details: data ? `Trường dữ liệu: ${Object.keys(data).join(", ")}` : "" };
        } catch (err) {
          const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "unknown";
          return { label, collection: coll, status: code === "permission-denied" ? "Bị từ chối quyền" : "Lỗi kết nối", details: code };
        }
      }));
      setRows(results);
    } finally { setBusy(false); }
  }
  return (
    <main className="profile-page cla-transcript-page">
      <div className="profile-floating-header">
        <a className="profile-home-logo" href="/student"><img src={appLogo} alt="Cognitive Learn" /></a>
        <UserMenu />
      </div>
      <section className="profile-shell">
        <header className="profile-head"><span>FIRESTORE · KIỂM TRA DỮ LIỆU</span>
          <h1>Lưu trữ của tài khoản</h1>
          <p>Mỗi collection có một tài liệu mang UID của bạn. Chỉ khi lưu thành công, tài liệu mới xuất hiện. Kiểm tra này chỉ đọc từ server.</p>
        </header>
        <p>Project: <code>{db.app.options.projectId || "Chưa xác định"}</code></p>
        <button type="button" disabled={!user || busy} onClick={() => void inspect()}>{busy ? "Đang kiểm tra…" : "Kiểm tra Firestore"}</button>
        {!user && <p>Hãy đăng nhập để xem trạng thái dữ liệu.</p>}
        <div style={{display:"grid",gap:12,marginTop:20}}>
          {rows.map(row => <article key={row.collection} className="student-panel" style={{padding:16}}>
            <strong>{row.label}: {row.status}</strong>
            <p><code>{row.collection}/{"{uid}"}</code></p>
            {row.details && <p>{row.details}</p>}
          </article>)}
        </div>
        <p><a href="/student/transcript">Kho bảng điểm</a> · <a href="/student/profile">Nhập điểm</a> · <a href="/student">Dashboard</a></p>
      </section>
    </main>
  );
}
