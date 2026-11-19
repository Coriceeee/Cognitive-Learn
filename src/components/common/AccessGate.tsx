import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDocFromServer, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { checkAccountDocument, readAccountDocumentWithRetry } from "../../lib/accountVerification";
import { readProductConsent } from "../../lib/studentConsentPolicy";
import { STUDENT_CONSENT_GATE_ENABLED } from "../../lib/studentConsentConfig";

type Role = "student" | "admin";
type GateStatus = "checking" | "unauthenticated" | "no-profile" | "inactive" | "denied" | "error" | "consent-required" | "ready";

type AccessGateProps = {
  path: string;
  children: ReactNode;
};

const studentAllowedRoutes = new Set([
  "/student", "/student/companion", "/student/consent", "/student/profile", "/student/transcript", "/student/modules", "/student/storage", "/student/guide",
  "/atlas", "/atlas/vietnam", "/atlas/study-abroad", "/study-abroad", "/haven/study-abroad", "/atlas/study-abroad/programs",
  "/atlas/study-abroad/requirements", "/atlas/study-abroad/sources",
  "/atlas/joint", "/atlas/recommendations", "/atlas/sources",
  "/lumen", "/lumen/indices", "/lumen/history", "/lumen/insights", "/lumen/assistant",
  "/orion", "/orion/inputs", "/orion/scenarios", "/orion/roadmap",
  "/pulse", "/pulse/progress", "/pulse/reports", "/pulse/actions",
  "/haven", "/haven/scholarships", "/haven/finance", "/haven/plan",
  "/student/exams", "/atlas/subjects", "/atlas/compare", "/lumen/state", "/lumen/roadmap", "/lumen/evidence", "/lumen/advanced", "/pulse/inputs", "/pulse/checkin",
]);

export function mayVisit(role: Role, path: string): boolean {
  const normalized = path.replace(/\/+$/, "") || "/";
  if (["/teacher", "/parent", "/role"].includes(normalized)) return false;
  if (role === "admin") return true;
  if (role === "student") return studentAllowedRoutes.has(normalized);
  return false;
}

function homeForRole(role: Role | null): string {
  return role ? `/${role}` : "/";
}

export default function AccessGate({ path, children }: AccessGateProps) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let mounted = true;
    let requestId = 0;
    let stopRoleWatch: Unsubscribe | undefined;
    let stopConsentWatch: Unsubscribe | undefined;
    function stopLiveAccessWatch() {
      stopRoleWatch?.();
      stopConsentWatch?.();
      stopRoleWatch = undefined;
      stopConsentWatch = undefined;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const thisRequest = ++requestId;
        stopLiveAccessWatch();
        if (!mounted) return;
        setStatus("checking");
        setRole(null);
        if (!user) {
          setStatus("unauthenticated");
          return;
        }
        try {
          const snapshot = await readAccountDocumentWithRetry(() =>
            getDocFromServer(doc(db, "users", user.uid)),
          );
          if (!mounted || thisRequest !== requestId) return;
          const account = checkAccountDocument(snapshot.exists(), snapshot.exists() ? snapshot.data() : null);
          if (account.status !== "ready") {
            setStatus(account.status === "inactive" ? "inactive" : "no-profile");
            return;
          }
          const actualRole = account.role;
          setRole(actualRole);
          if (!mayVisit(actualRole, path)) {
            setStatus("denied");
            return;
          }

          // Product consent must be confirmed from the server before loading student-data modules.
          // Keep this route accessible for students who need to accept, review or withdraw.
          if (STUDENT_CONSENT_GATE_ENABLED && actualRole === "student" && path !== "/student/consent") {
            const consentSnapshot = await readAccountDocumentWithRetry(() =>
              getDocFromServer(doc(db, "student_consents", user.uid)),
            );
            if (!mounted || thisRequest !== requestId) return;
            const consent = readProductConsent(
              consentSnapshot.exists() ? consentSnapshot.data() : null,
              user.uid,
            );
            if (consent !== "accepted") {
              setStatus("consent-required");
              return;
            }
          }

          if (actualRole !== "admin") {
            const current = new URL(window.location.href);
            if (current.searchParams.get("from") === "admin") {
              current.searchParams.delete("from");
              window.history.replaceState({}, "", current.pathname + current.search + current.hash);
            }
          }
          // CP29/B2: a one-time server read does not invalidate an already-mounted
          // page when Admin locks an account or a student withdraws product consent.
          // Keep children unmounted until listeners return a server-confirmed state.
          type LiveRole = "checking" | "ready" | "inactive" | "no-profile" | "denied" | "error";
          type LiveConsent = "checking" | "accepted" | "required" | "error";
          let liveRole: LiveRole = "checking";
          const consentRequired = STUDENT_CONSENT_GATE_ENABLED && actualRole === "student" && path !== "/student/consent";
          let liveConsent: LiveConsent = consentRequired ? "checking" : "accepted";
          const stillCurrent = () => mounted && thisRequest === requestId;
          const publish = () => {
            if (!stillCurrent()) return;
            if (liveRole !== "ready") {
              setStatus(liveRole);
            } else if (liveConsent === "required") {
              setStatus("consent-required");
            } else if (liveConsent === "error") {
              setStatus("error");
            } else if (liveConsent === "checking") {
              setStatus("checking");
            } else {
              setStatus("ready");
            }
          };
          setStatus("checking");
          stopRoleWatch = onSnapshot(
            doc(db, "users", user.uid),
            { includeMetadataChanges: true },
            snapshot => {
              if (!stillCurrent()) return;
              // Cached snapshots and pending local writes cannot grant access.
              if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) {
                liveRole = "checking";
                publish();
                return;
              }
              const checked = checkAccountDocument(snapshot.exists(), snapshot.exists() ? snapshot.data() : null);
              if (checked.status !== "ready") {
                setRole(null);
                liveRole = checked.status === "inactive" ? "inactive" : "no-profile";
              } else if (checked.role !== actualRole || !mayVisit(checked.role, path)) {
                // A role changed mid-session: require a new route verification,
                // rather than silently switching student/admin privileges.
                setRole(null);
                liveRole = "denied";
              } else {
                setRole(checked.role);
                liveRole = "ready";
              }
              publish();
            },
            error => {
              if (!stillCurrent()) return;
              console.error("Live account authorization failed:", error);
              liveRole = "error";
              setRole(null);
              publish();
            },
          );
          if (consentRequired) {
            stopConsentWatch = onSnapshot(
              doc(db, "student_consents", user.uid),
              { includeMetadataChanges: true },
              snapshot => {
                if (!stillCurrent()) return;
                if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) {
                  liveConsent = "checking";
                } else {
                  liveConsent = readProductConsent(
                    snapshot.exists() ? snapshot.data() : null,
                    user.uid,
                  ) === "accepted" ? "accepted" : "required";
                }
                publish();
              },
              error => {
                if (!stillCurrent()) return;
                console.error("Live student consent verification failed:", error);
                liveConsent = "error";
                publish();
              },
            );
          }
        } catch (error) {
          console.error("Cannot verify CLA account permissions:", error);
          if (mounted && thisRequest === requestId) setStatus("error");
        }
      },
      (error) => {
        console.error("Firebase auth state error:", error);
        requestId += 1;
        stopLiveAccessWatch();
        if (mounted) { setRole(null); setStatus("error"); }
      }
    );
    return () => {
      mounted = false;
      requestId += 1;
      stopLiveAccessWatch();
      unsubscribe();
    };
  }, [path]);

  if (status === "ready") return <>{children}</>;
  if (status === "checking") {
    return (
      <main className="cla-access-screen" role="status">
        <div className="cla-access-panel">
          <strong>Đang xác minh quyền truy cập...</strong>
          <p>CLA đang kiểm tra phiên đăng nhập và vai trò tài khoản.</p>
        </div>
      </main>
    );
  }

  const messages: Record<Exclude<GateStatus, "checking" | "ready">, [string, string]> = {
    unauthenticated: ["Bạn chưa đăng nhập", "Đăng nhập để truy cập dữ liệu và công cụ CLA."],
    "no-profile": ["Chưa có hồ sơ tài khoản hợp lệ", "Tài khoản chưa có vai trò hợp lệ. Hãy liên hệ người quản trị."],
    inactive: ["Tài khoản đang bị khóa", "Liên hệ quản trị viên để xác minh trạng thái tài khoản."],
    denied: ["Không có quyền truy cập trang này", "Bạn chỉ có thể truy cập các chức năng thuộc vai trò đã được cấp."],
    error: ["Chưa xác minh được quyền truy cập", "Không thể kiểm tra vai trò hoặc quyết định dữ liệu từ Firestore. Kiểm tra kết nối và thử lại."],
    "consent-required": ["Cần xác nhận quyền dữ liệu", "Trước khi sử dụng Seed, Atlas và các công cụ học sinh, hãy đọc thông báo và lựa chọn việc dùng dữ liệu sản phẩm. Đồng ý này không đồng nghĩa tham gia nghiên cứu."],
  };
  const [title, description] = messages[status];

  return (
    <main className="cla-access-screen">
      <section className="cla-access-panel" role="alert">
        <span className="cla-access-eyebrow">COGNITIVE LEARN AI · QUYỀN TRUY CẬP</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="cla-access-actions">
          <a href={status === "consent-required" ? "/student/consent" : homeForRole(role)}>{status === "consent-required" ? "Xem và quản lý quyền dữ liệu" : role ? "Về trang của tôi" : "Đăng nhập"}</a>
          <button type="button" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </section>
    </main>
  );
}
