import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

type Row = { label: string; status: "Đã lưu" | "Chưa lưu" | "Chưa kiểm tra" | "Chưa thể đồng bộ" };
const sources = [
  ["Thông tin tài khoản", "users"], ["Hồ sơ học tập", "learning_profiles"],
  ["Bảng điểm", "student_transcripts"], ["Nguyện vọng & tra cứu", "atlas_workspaces"],
  ["Kế hoạch học tập", "orion_drafts"], ["Theo dõi tiến độ", "pulse_drafts"],
  ["Hỗ trợ tài chính", "haven_drafts"], ["Bản nháp cũ", "module_drafts"],
] as const;

/** Student-friendly status view. Technical collection names and project identifiers stay private. */
export default function StudentStorageStatusPage() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [rows, setRows] = useState<Row[]>(sources.map(([label]) => ({ label, status: "Chưa kiểm tra" })));
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string>("");
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function inspect() {
    if (!user) return;
    setBusy(true);
    try {
      const results = await Promise.all(sources.map(async ([label, collectionName]): Promise<Row> => {
        try {
          const snap = await getDocFromServer(doc(db, collectionName, user.uid));
          return { label, status: snap.exists() ? "Đã lưu" : "Chưa lưu" };
        } catch {
          return { label, status: "Chưa thể đồng bộ" };
        }
      }));
      setRows(results);
      setCheckedAt(new Date().toLocaleString("vi-VN"));
    } finally {
      setBusy(false);
    }
  }

  const savedCount = rows.filter(row => row.status === "Đã lưu").length;
  return (
    <main className="profile-page cla-transcript-page">
      <div className="profile-floating-header">
        <a className="profile-home-logo" href="/student"><img src={appLogo} alt="Cognitive Learn" /></a>
        <UserMenu />
      </div>
      <section className="profile-shell cla-my-data-page">
        <header className="profile-head">
          <span>HỒ SƠ CỦA BẠN · ĐỒNG BỘ DỮ LIỆU</span>
          <h1>Dữ liệu của tôi</h1>
          <p>Kiểm tra những phần thông tin đã lưu trong tài khoản của bạn. Chỉ dữ liệu thuộc tài khoản đang đăng nhập mới được kiểm tra.</p>
        </header>
        <div className="cla-my-data-summary">
          <strong>{savedCount}/{rows.length}</strong>
          <span>nhóm dữ liệu đã lưu</span>
          <button type="button" disabled={!user || busy} onClick={() => void inspect()}>
            {busy ? "Đang kiểm tra…" : "Kiểm tra trạng thái đồng bộ"}
          </button>
        </div>
        {!user && <p role="status">Hãy đăng nhập để xem trạng thái dữ liệu.</p>}
        <div className="cla-my-data-grid">
          {rows.map(row => (
            <article key={row.label} className="cla-my-data-card">
              <span>{row.label}</span>
              <strong className={`is-${row.status === "Đã lưu" ? "saved" : row.status === "Chưa thể đồng bộ" ? "error" : "pending"}`}>{row.status}</strong>
            </article>
          ))}
        </div>
        {checkedAt && <p className="cla-my-data-footnote">Lần kiểm tra gần nhất: {checkedAt}. Trạng thái này chỉ xác nhận khả năng đọc dữ liệu, không thay thế việc kiểm tra nội dung hồ sơ.</p>}
        <p><a href="/student/transcript">Bảng điểm</a> · <a href="/student/profile">Hồ sơ học tập</a> · <a href="/student">Dashboard</a></p>
      </section>
    </main>
  );
}
