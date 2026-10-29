import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Role = "student" | "teacher" | "parent" | "admin";
type GateStatus = "checking" | "unauthenticated" | "no-profile" | "inactive" | "denied" | "error" | "ready";

type AccessGateProps = {
  path: string;
  children: ReactNode;
};

function isRole(value: unknown): value is Role {
  return value === "student" || value === "teacher" || value === "parent" || value === "admin";
}

/** UI navigation restrictions only. Firestore Rules must enforce data ownership. */
export function mayVisit(role: Role, path: string): boolean {
  if (role === "admin") return true;
  if (path === "/teacher") return role === "teacher";
  if (path === "/parent") return role === "parent";
  if (path === "/admin" || path === "/role") return false;
  return role === "student";
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
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const thisRequest = ++requestId;
        if (!mounted) return;
        setStatus("checking");
        setRole(null);
        if (!user) {
          setStatus("unauthenticated");
          return;
        }
        try {
          const snapshot = await getDoc(doc(db, "users", user.uid));
          if (!mounted || thisRequest !== requestId) return;
          if (!snapshot.exists()) {
            setStatus("no-profile");
            return;
          }
          const account = snapshot.data();
          if (account.active === false) {
            setStatus("inactive");
            return;
          }
          if (!isRole(account.role)) {
            setStatus("no-profile");
            return;
          }
          const actualRole = account.role;
          setRole(actualRole);
          if (!mayVisit(actualRole, path)) {
            setStatus("denied");
            return;
          }
          // A query parameter is NOT proof of admin rights. Strip it for
          // other roles before mounting pages which inspect from=admin.
          if (actualRole !== "admin") {
            const current = new URL(window.location.href);
            if (current.searchParams.get("from") === "admin") {
              current.searchParams.delete("from");
              window.history.replaceState({}, "", current.pathname + current.search + current.hash);
            }
          }
          setStatus("ready");
        } catch (error) {
          console.error("Cannot verify CLA account permissions:", error);
          if (mounted && thisRequest === requestId) setStatus("error");
        }
      },
      (error) => {
        console.error("Firebase auth state error:", error);
        if (mounted) setStatus("error");
      }
    );
    return () => {
      mounted = false;
      requestId += 1;
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
    error: ["Chưa xác minh được quyền truy cập", "Không thể đọc vai trò tài khoản từ Firestore. Kiểm tra kết nối và thử lại."],
  };
  const [title, description] = messages[status];

  return (
    <main className="cla-access-screen">
      <section className="cla-access-panel" role="alert">
        <span className="cla-access-eyebrow">COGNITIVE LEARN AI · QUYỀN TRUY CẬP</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="cla-access-actions">
          <a href={homeForRole(role)}>{role ? "Về trang của tôi" : "Đăng nhập"}</a>
          <button type="button" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </section>
    </main>
  );
}
