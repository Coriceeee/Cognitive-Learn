import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Mode = "student" | "teacher" | "parent";
type ViewerRole = "teacher" | "parent";
type Link = {
  id: string;
  studentId: string;
  viewerId: string;
  studentName: string;
  viewerRole: ViewerRole;
  createdAt?: Timestamp;
};
type Status = "loading" | "ready" | "not-signed-in" | "error";

function safeUid(value: string) {
  // Firebase Auth UIDs are opaque IDs; never accept slashes or whitespace.
  return /^[a-zA-Z0-9_-]{6,128}$/.test(value);
}

function getErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code) : "";
  if (code === "permission-denied") {
    return "Firestore từ chối quyền. Kiểm tra Rules student_links, vai trò tài khoản và UID người được liên kết.";
  }
  if (code === "failed-precondition") {
    return "Truy vấn chưa có cấu hình cần thiết trên Firestore. Kiểm tra index và Rules.";
  }
  return "Chưa thể truy cập dữ liệu liên kết. Hãy kiểm tra kết nối Firebase và thử lại.";
}

export default function StudentLinkManager({ mode, preview = false }: { mode: Mode; preview?: boolean }) {
  const [uid, setUid] = useState("");
  const [name, setName] = useState("Học sinh CLA");
  const [viewerId, setViewerId] = useState("");
  const [viewerRole, setViewerRole] = useState<ViewerRole>("teacher");
  const [status, setStatus] = useState<Status>("loading");
  const [links, setLinks] = useState<Link[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preview) {
      setStatus("ready");
      return;
    }
    let active = true;
    let stopLinks: (() => void) | undefined;
    let requestId = 0;
    const stopAuth = onAuthStateChanged(auth, async (user) => {
      const current = ++requestId;
      stopLinks?.();
      stopLinks = undefined;
      if (!active) return;
      setUid(user?.uid ?? "");
      setLinks([]);
      setNotice("");
      if (!user) {
        setStatus("not-signed-in");
        return;
      }
      setStatus("loading");
      if (mode === "student") {
        try {
          const account = await getDoc(doc(db, "users", user.uid));
          if (!active || current !== requestId) return;
          const fullName = account.exists() ? account.data().fullName : null;
          setName(typeof fullName === "string" && fullName.trim() ? fullName.trim().slice(0, 80) : "Học sinh CLA");
        } catch (error) {
          if (active && current === requestId) setNotice(getErrorMessage(error));
        }
      }
      if (!active || current !== requestId) return;
      const field = mode === "student" ? "studentId" : "viewerId";
      const q = query(collection(db, "student_links"), where(field, "==", user.uid), limit(40));
      stopLinks = onSnapshot(q, (snapshot) => {
        if (!active || current !== requestId) return;
        const list: Link[] = snapshot.docs.map((record) => ({
          id: record.id,
          studentId: String(record.data().studentId ?? ""),
          viewerId: String(record.data().viewerId ?? ""),
          studentName: String(record.data().studentName ?? "Học sinh"),
          viewerRole: record.data().viewerRole === "parent" ? "parent" : "teacher",
          createdAt: record.data().createdAt as Timestamp | undefined,
        }));
        setLinks(mode === "student" ? list : list.filter(link => link.viewerRole === mode));
        setStatus("ready");
      }, (error) => {
        if (!active || current !== requestId) return;
        setNotice(getErrorMessage(error));
        setStatus("error");
      });
    });
    return () => {
      active = false;
      requestId += 1;
      stopLinks?.();
      stopAuth();
    };
  }, [mode, preview]);

  async function copyUid() {
    try {
      await navigator.clipboard.writeText(uid);
      setNotice("Đã sao chép mã tài khoản của bạn.");
    } catch {
      setNotice("Không thể sao chép tự động; hãy chọn và sao chép mã hiển thị bên dưới.");
    }
  }

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = viewerId.trim();
    if (!uid || !safeUid(target) || target === uid) {
      setNotice("UID chưa hợp lệ hoặc trùng tài khoản học sinh.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const linkId = `${uid}_${target}`;
      const linkRef = doc(db, "student_links", linkId);
      await setDoc(linkRef, {
        studentId: uid,
        viewerId: target,
        viewerRole,
        studentName: name,
        createdAt: serverTimestamp(),
      });
      setViewerId("");
      setNotice("Đã cấp quyền xem thông tin liên kết cho tài khoản được chọn. Chưa chia sẻ điểm số hoặc hồ sơ học tập.");
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(linkId: string) {
    if (!uid || !window.confirm("Thu hồi liên kết này? Người được liên kết sẽ không còn thấy bạn trong danh sách.")) return;
    setBusy(true);
    try {
      // Remove the opt-in report BEFORE unlinking, so old data cannot
      // reappear if the same accounts establish a new link later.
      await deleteDoc(doc(db, "student_shared_reports", linkId));
      await deleteDoc(doc(db, "student_links", linkId));
      setNotice("Đã thu hồi liên kết.");
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const student = mode === "student";
  return (
    <section className="cla-link-panel" aria-label={student ? "Quản lý liên kết học sinh" : "Học sinh được liên kết"}>
      <div className="cla-link-heading">
        <div>
          <span className="cla-link-eyebrow">CLA · FIRESTORE</span>
          <h2>{student ? "Ai được đồng hành với bạn?" : "Danh sách học sinh đã liên kết"}</h2>
          <p>{student
            ? "Bạn chủ động cấp và thu hồi liên kết cho tài khoản giáo viên hoặc phụ huynh. Mới chia sẻ tên hiển thị, chưa chia sẻ chỉ số Cognitive, điểm số hay lịch sử."
            : "Chỉ những học sinh chủ động cấp liên kết mới xuất hiện tại đây. Dữ liệu Cognitive và báo cáo chi tiết chưa được mở quyền."}</p>
        </div>
      </div>

      {preview ? (
        <p className="cla-link-feedback" role="status">Chế độ xem trước của Admin: không tải hoặc chỉnh sửa liên kết tài khoản thật.</p>
      ) : (
        <>
          <div className="cla-link-identity">
            <span>UID tài khoản {student ? "học sinh" : mode === "teacher" ? "giáo viên" : "phụ huynh"}</span>
            <code>{uid || "Đang tải…"}</code>
            <button type="button" onClick={() => void copyUid()} disabled={!uid}>Sao chép UID</button>
          </div>

          {!student && <p className="cla-link-guide">Gửi UID này cho học sinh. Học sinh đăng nhập vào Seed và tự cấp liên kết cho bạn. Không yêu cầu học sinh gửi mật khẩu.</p>}

          {student && status === "ready" && (
            <form className="cla-link-form" onSubmit={event => { void createLink(event); }}>
              <label>UID của người được liên kết
                <input value={viewerId} onChange={event => setViewerId(event.target.value)} placeholder="Dán UID giáo viên/phụ huynh" maxLength={128} required />
              </label>
              <label>Vai trò tài khoản
                <select value={viewerRole} onChange={event => setViewerRole(event.target.value as ViewerRole)}>
                  <option value="teacher">Giáo viên</option>
                  <option value="parent">Phụ huynh</option>
                </select>
              </label>
              <button type="submit" disabled={busy}>Cấp liên kết</button>
            </form>
          )}

          {status === "loading" && <p className="cla-link-feedback" role="status">Đang tải các liên kết từ Firestore…</p>}
          {status === "not-signed-in" && <p className="cla-link-feedback" role="alert">Vui lòng đăng nhập để xem liên kết.</p>}
          {status === "error" && <p className="cla-link-feedback" role="alert">Không tải được danh sách liên kết. Kiểm tra Firestore Rules trước khi tiếp tục.</p>}
          {notice && <p className="cla-link-feedback" role="status">{notice}</p>}
          {status === "ready" && (
            <div className="cla-link-list">
              <h3>Liên kết hiện tại ({links.length})</h3>
              {links.length === 0 ? (
                <p>Chưa có tài khoản nào được liên kết. Không hiển thị dữ liệu mẫu.</p>
              ) : (
                <ul>
                  {links.map(link => <li key={link.id}>
                    <div>
                      <strong>{student ? (link.viewerRole === "teacher" ? "Giáo viên" : "Phụ huynh") : link.studentName}</strong>
                      <small>{student ? link.viewerId : `UID học sinh: ${link.studentId}`}</small>
                    </div>
                    {student && <button type="button" disabled={busy} onClick={() => void revoke(link.id)}>Thu hồi</button>}
                  </li>)}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
