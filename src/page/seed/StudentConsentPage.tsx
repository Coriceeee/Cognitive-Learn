import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDocFromServer, getDocsFromServer, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { createProductConsentRecord, readProductConsent, STUDENT_NOTICE_VERSION, type ProductConsentState } from "../../lib/studentConsentPolicy";
import { STUDENT_CONSENT_GATE_ENABLED } from "../../lib/studentConsentConfig";
import { revokeStudentShares } from "../../lib/studentShareRevocation";
import "../../styles.css";

type ScreenStatus = "loading" | "preview" | "student" | "admin-demo" | "error" | "signed-out";

export default function StudentConsentPage() {
  const [status, setStatus] = useState<ScreenStatus>("loading");
  const [decision, setDecision] = useState<ProductConsentState>("missing");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [shareCleanupPending, setShareCleanupPending] = useState(false);

  useEffect(() => {
    if (!STUDENT_CONSENT_GATE_ENABLED) {
      setStatus("preview");
      return;
    }
    let mounted = true;
    let requestId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const request = ++requestId;
      if (!mounted) return;
      setStatus("loading");
      setSaving(false);
      setUid(null);
      setDecision("missing");
      setAcknowledged(false);
      setShareCleanupPending(false);
      setNotice("");
      if (!user) { setStatus("signed-out"); return; }
      try {
        const roleSnapshot = await getDocFromServer(doc(db, "users", user.uid));
        if (!mounted || request !== requestId) return;
        const account = roleSnapshot.exists() ? roleSnapshot.data() : null;
        if (!account || account.active !== true) throw new Error("Tài khoản chưa được kích hoạt.");
        if (account.role === "admin") { setStatus("admin-demo"); return; }
        if (account.role !== "student") throw new Error("Chỉ học sinh mới sử dụng màn hình này.");
        const snapshot = await getDocFromServer(doc(db, "student_consents", user.uid));
        if (!mounted || request !== requestId) return;
        setUid(user.uid);
        const currentDecision = readProductConsent(snapshot.exists() ? snapshot.data() : null, user.uid);
        setDecision(currentDecision);
        // After a refresh we cannot assume earlier link cleanup completed.
        setShareCleanupPending(currentDecision === "withdrawn");
        setStatus("student");
      } catch (error) {
        if (!mounted || request !== requestId) return;
        console.error("CLA student consent verification failed:", error);
        setNotice("Chưa thể đọc trạng thái đồng ý từ máy chủ. Kiểm tra kết nối, Firestore Rules và thử tải lại. CLA không tự coi là đã đồng ý.");
        setStatus("error");
      }
    });
    return () => { mounted = false; requestId++; unsubscribe(); };
  }, []);

  async function cleanupSharedLinks(ownerUid: string): Promise<void> {
    // Server reads only. Never trust a cache when checking whether old links remain.
    const result = await revokeStudentShares(ownerUid, {
      currentUid: () => auth.currentUser?.uid ?? null,
      listOwnedLinks: async () => {
        const q = query(collection(db, "student_links"), where("studentId", "==", ownerUid), limit(40));
        const snapshot = await getDocsFromServer(q);
        return snapshot.docs.map(item => item.id);
      },
      deleteSharedReport: async linkId => deleteDoc(doc(db, "student_shared_reports", linkId)),
      deleteOwnedLink: async linkId => deleteDoc(doc(db, "student_links", linkId)),
    });
    if (!result.verifiedEmpty) {
      throw new Error("CLA_SHARE_REVOKE_RECHECK_REQUIRED");
    }
  }

  async function retryShareCleanup() {
    if (!uid || auth.currentUser?.uid !== uid || saving || decision !== "withdrawn") return;
    setSaving(true);
    try {
      await cleanupSharedLinks(uid);
      if (auth.currentUser?.uid !== uid) return;
      setShareCleanupPending(false);
      setNotice("Đã kiểm tra trên máy chủ: không còn liên kết chia sẻ trong danh sách tài khoản này. Dữ liệu cũ và bản sao lưu không tự bị xóa.");
    } catch (error) {
      console.error("CLA share cleanup retry failed:", error);
      if (auth.currentUser?.uid === uid) {
        setShareCleanupPending(true);
        setNotice("Đồng ý đã được rút nhưng chưa thể xác nhận thu hồi hết liên kết. Hãy thử lại khi có mạng hoặc liên hệ hỗ trợ; không coi đây là đã xóa hết dữ liệu.");
      }
    } finally {
      if (auth.currentUser?.uid === uid) setSaving(false);
    }
  }

  async function saveDecision(accept: boolean) {
    if (!uid || !auth.currentUser || auth.currentUser.uid !== uid || saving) return;
    if (accept && !acknowledged) {
      setNotice("Bạn cần đọc thông báo và xác nhận trước khi tiếp tục.");
      return;
    }
    try {
      setSaving(true);
      setNotice("");
      // Withdrawal is persisted FIRST: cleanup failure must never keep consent active.
      await setDoc(doc(db, "student_consents", uid), createProductConsentRecord(uid, accept, serverTimestamp()));
      if (auth.currentUser?.uid !== uid) return;
      setDecision(accept ? "accepted" : "withdrawn");
      setAcknowledged(false);
      if (accept) {
        setShareCleanupPending(false);
        setNotice("Đã ghi nhận quyết định sử dụng sản phẩm trên máy chủ. Bạn có thể tiếp tục đến hồ sơ học tập.");
      } else {
        setShareCleanupPending(true);
        try {
          await cleanupSharedLinks(uid);
          if (auth.currentUser?.uid !== uid) return;
          setShareCleanupPending(false);
          setNotice("Đã rút đồng ý và kiểm tra không còn liên kết chia sẻ trên máy chủ. Hồ sơ cũ và bản sao lưu không tự bị xóa.");
        } catch (error) {
          console.error("CLA share cleanup after withdrawal failed:", error);
          if (auth.currentUser?.uid === uid) {
            setNotice("Đã rút đồng ý, nhưng chưa thể thu hồi hoặc kiểm tra hết liên kết cũ. Bấm thử lại; dữ liệu cũ không tự bị xóa.");
          }
        }
      }
    } catch (error) {
      console.error("CLA consent save failed:", error);
      if (auth.currentUser?.uid === uid) {
        setNotice("Không thể lưu quyết định vào Firestore. Dữ liệu chưa được coi là đã đồng ý; thử lại sau khi kiểm tra quyền truy cập.");
      }
    } finally {
      if (auth.currentUser?.uid === uid) setSaving(false);
    }
  }

  return (
    <main className="cla-consent-page">
      <div className="cla-consent-shell">
        <header className="cla-consent-hero">
          <a className="cla-consent-back" href="/">COGNITIVE LEARN AI / Quyền dữ liệu</a>
          <span className="cla-consent-kicker">SEED PROFILE · QUYỀN RIÊNG TƯ</span>
          <h1>Bạn quyết định CLA được sử dụng dữ liệu học tập như thế nào.</h1>
          <p>Trước khi nhập điểm và hồ sơ, hãy biết dữ liệu được dùng để làm gì, ai có thể truy cập và khi nào bạn có thể dừng chia sẻ.</p>
          <div className="cla-consent-stages" aria-label="Quy trình dữ liệu">
            <span><b>01</b> Hiểu dữ liệu</span><span><b>02</b> Tự quyết định</span><span><b>03</b> Bắt đầu học tập</span>
          </div>
        </header>

        <div className="cla-consent-grid">
          <section className="cla-consent-card">
            <span className="cla-consent-card-label">01 / DỮ LIỆU SẢN PHẨM</span>
            <h2>CLA dùng dữ liệu gì?</h2>
            <p>Thông tin hồ sơ, điểm các môn, mục tiêu, các hoạt động và dữ liệu người học chủ động nhập được dùng để tính chỉ số thử nghiệm, gợi ý học tập và định hướng tuyển sinh.</p>
            <p>Dữ liệu thuộc tài khoản đang đăng nhập. CLA không cung cấp không gian truy cập hồ sơ cho tài khoản bên ngoài. Dữ liệu chia sẻ từ phiên bản cũ có thể được thu hồi tại đây.</p>
            <span className="cla-consent-chip">Không yêu cầu ngày sinh hoặc thông tin người giám hộ tại bước này</span>
          </section>
          <section className="cla-consent-card">
            <span className="cla-consent-card-label">02 / RANH GIỚI NGHIÊN CỨU</span>
            <h2>Đồng ý dùng CLA ≠ đồng ý nghiên cứu</h2>
            <p>Phiên bản này <strong>không đăng ký bạn tham gia nghiên cứu</strong>, không kích hoạt việc xuất dữ liệu cá nhân sang tập nghiên cứu và không sử dụng các chỉ số SCI/MAS/CSL như kết luận tâm lý đã được kiểm định.</p>
            <p>Muốn tham gia nghiên cứu trong tương lai cần thông báo, quy trình đồng ý riêng và xác minh người giám hộ khi áp dụng.</p>
            <span className="cla-consent-chip">Research consent: tắt mặc định, không thể bật tại đây</span>
          </section>
          <section className="cla-consent-card">
            <span className="cla-consent-card-label">03 / QUYỀN VÀ GIỚI HẠN</span>
            <h2>Có thể rút đồng ý</h2>
            <p>Việc rút đồng ý chặn các thao tác ghi dữ liệu học tập mới theo Rules được cấu hình. CLA sẽ thử thu hồi liên kết và báo cáo chia sẻ trên máy chủ; nếu không thành công, bạn được thông báo để thử lại. Nó <strong>không tự xóa</strong> hồ sơ học tập đã tồn tại hoặc các bản sao lưu.</p>
            <p>Yêu cầu xuất/xóa dữ liệu cần quy trình xác minh quyền và xử lý riêng; chức năng tự động xóa chưa được triển khai.</p>
            <span className="cla-consent-chip">Thông báo phiên bản {STUDENT_NOTICE_VERSION}</span>
          </section>
        </div>

        <section className="cla-consent-decision" aria-live="polite">
          <span className="cla-consent-card-label">QUYẾT ĐỊNH CỦA BẠN</span>
          {status === "preview" && <p role="status">Đây là bản xem trước thông báo quyền dữ liệu. Chức năng ghi nhận quyết định chưa bật để tránh gây lỗi cho tài khoản cũ: chỉ kích hoạt sau khi Firestore Rules mới đã qua Emulator và được triển khai ở đúng dự án. <strong>Không nên nhập dữ liệu học sinh thật trước khi hoàn thành kiểm thử và xác minh người giám hộ.</strong></p>}
          {status === "loading" && <p role="status">Đang kiểm tra tài khoản và trạng thái trên Firestore…</p>}
          {status === "signed-out" && <p>Bạn cần <a href="/">đăng nhập</a> trước khi quản lý quyết định.</p>}
          {status === "admin-demo" && <p>Đây là tài khoản Admin. Bản demo quản trị không tạo consent hộ học sinh và không được dùng làm bằng chứng chấp thuận của người tham gia nghiên cứu.</p>}
          {status === "error" && <p role="alert">{notice}</p>}
          {status === "student" && <>
            <p className="cla-consent-current">Trạng thái: <strong>{decision === "accepted" ? "Đã đồng ý sử dụng sản phẩm" : decision === "outdated" ? "Cần xem lại phiên bản thông báo" : decision === "withdrawn" ? "Đã rút đồng ý" : "Chưa có quyết định"}</strong></p>
            <p className="cla-consent-minor">Nếu bạn chưa đủ 18 tuổi, hãy cùng cha/mẹ hoặc người giám hộ xem thông báo trước khi nhập dữ liệu thật. <strong>Màn hình này chưa xác minh được chữ ký hoặc danh tính người giám hộ</strong>; vì vậy chưa đủ điều kiện nghiệm thu cho thu thập dữ liệu nghiên cứu vị thành niên.</p>
            <label className="cla-consent-ack">
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} disabled={saving}/>
              <span>Tôi đã đọc và hiểu mục đích sử dụng dữ liệu, việc tách biệt nghiên cứu và quyền rút đồng ý. Tôi hiểu quyết định này không thay thế xác minh người giám hộ.</span>
            </label>
            <div className="cla-consent-actions">
              <button type="button" disabled={saving || !acknowledged} onClick={() => void saveDecision(true)}>Đồng ý dùng CLA</button>
              <button type="button" className="cla-consent-revoke" disabled={saving || decision !== "accepted"} onClick={() => void saveDecision(false)}>Rút đồng ý</button>
              {decision === "accepted" && <a href="/student">Vào không gian học sinh</a>}
              {decision === "withdrawn" && shareCleanupPending && (
                <button type="button" disabled={saving} onClick={() => void retryShareCleanup()}>Thử thu hồi liên kết còn tồn</button>
              )}
            </div>
            {notice && <p role="status" className="cla-consent-notice">{notice}</p>}
          </>}
        </section>
        <p className="cla-consent-footer">CLA là hệ thống hỗ trợ quyết định; không thay thế chuyên gia tuyển sinh hoặc người có chuyên môn và người giám hộ. Việc chạy chức năng với học sinh thật còn phụ thuộc kiểm thử Rules production và quy trình pháp lý/đạo đức riêng.</p>
      </div>
    </main>
  );
}
