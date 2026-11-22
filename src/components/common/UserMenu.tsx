import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ShieldCheck,
  BadgeInfo,
  PhoneCall,
  UserRound,
  LogOut,
  Sparkles,
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import "../../styles.css";
import { NotificationBell } from "./AppNotificationCenter";
import { clearAppNotices } from "../../lib/appNotices";
import { canNavigate } from "../../lib/draftNavigationGuard";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const noticeAccount = useRef(auth.currentUser?.uid ?? null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [accountRole, setAccountRole] = useState<"student" | "admin" | null>(null);

  const roleLabels = {
    student: "Học sinh",
    admin: "Quản trị viên",
  } as const;
  const roleLabel = accountRole ? roleLabels[accountRole] : "Chưa xác định";

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const thisRequest = ++requestId;
      if (!active) return;
      // Prevent messages from a different signed-in student appearing in this menu.
      const nextUid = user?.uid ?? null;
      if (noticeAccount.current !== nextUid) {
        clearAppNotices();
        noticeAccount.current = nextUid;
      }
      setUserEmail(user?.email || "");
      setUserName(user?.displayName || "Người dùng");
      setAdminMode(false);
      setAccountRole(null);
      if (!user) return;
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (active && thisRequest === requestId) {
          const profile = snapshot.exists() ? snapshot.data() : null;
          const role = profile?.role;
          const validRole = role === "student" || role === "admin";
          setAccountRole(validRole ? role : null);
          setAdminMode(validRole && role === "admin" && profile?.active === true);
        }
      } catch (error) {
        console.error("Unable to verify admin role:", error);
      }
    });
    return () => {
      active = false;
      requestId += 1;
      unsubscribe();
    };
  }, []);

  const adminSuffix = adminMode ? "?from=admin" : "";

  async function handleLogout() {
    // An explicit sign-out must not bypass the unsaved-draft guard.
    const from = window.location.pathname + window.location.search + window.location.hash;
    if (!canNavigate(from, "/")) return;
    await signOut(auth);
    clearAppNotices();
    window.location.href = "/";
  }

  return (
    <div className="user-nav">
      {adminMode && (
        <a href="/admin" className="user-nav-link admin-top-link">
          <span className="user-nav-icon">
            <ShieldCheck size={16} strokeWidth={2.4} />
          </span>
          <small>Admin</small>
        </a>
      )}

      <a href={`/about${adminSuffix}`} className="user-nav-link">
        <span className="user-nav-icon">
          <BadgeInfo size={16} strokeWidth={2.4} />
        </span>
        <small>Giới thiệu</small>
      </a>

      <a href={`/contact${adminSuffix}`} className="user-nav-link">
        <span className="user-nav-icon">
          <PhoneCall size={16} strokeWidth={2.4} />
        </span>
        <small>Liên hệ</small>
      </a>

      <button
        type="button"
        className="user-nav-link user-button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="user-nav-avatar">
          <UserRound size={16} strokeWidth={2.4} />
        </span>
        <small>{roleLabel}</small>
      </button>

      <NotificationBell />

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            <div className="user-avatar-mini">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>

            <div>
              <strong>{userName}</strong>
              <p>{userEmail || "Chưa có email"}</p>
              <span className={`user-role-badge role-${accountRole || "unknown"}`}>
                <span className="user-role-badge-label">Vai trò hiện tại</span>
                <strong>{roleLabel}</strong>
              </span>
            </div>
          </div>

<div className="user-dropdown-body compact">
  <button type="button" onClick={handleLogout}>
    <span>
      <LogOut size={18} strokeWidth={2.5} />
    </span>

    <div>
      <strong>Đăng xuất</strong>
      <p>Thoát khỏi tài khoản hiện tại</p>
    </div>
  </button>
</div>
        </div>
      )}
    </div>
  );
}