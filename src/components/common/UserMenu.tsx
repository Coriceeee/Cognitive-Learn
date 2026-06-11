import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ShieldCheck,
  BadgeInfo,
  PhoneCall,
  UserRound,
  LogOut,
  Sparkles,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import "../../styles.css";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAdminPreview = params.get("from") === "admin";
    const isAdminPage = window.location.pathname === "/admin";
    const savedAdminMode = localStorage.getItem("cla_admin_mode") === "true";

    if (isAdminPreview || isAdminPage || savedAdminMode) {
      localStorage.setItem("cla_admin_mode", "true");
      setAdminMode(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const email = user?.email || "";
      setUserEmail(email);

      if (email === "admin@gmail.com") {
        localStorage.setItem("cla_admin_mode", "true");
        setAdminMode(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const adminSuffix = adminMode ? "?from=admin" : "";

  async function handleLogout() {
    localStorage.removeItem("cla_admin_mode");
    await signOut(auth);
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
        <small>Người dùng</small>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            <div className="user-avatar-mini">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>

            <div>
              <strong>Hello, Người dùng</strong>
              <p>{userEmail || "demo@cognitivelearn.ai"}</p>
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