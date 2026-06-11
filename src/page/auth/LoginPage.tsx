import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import "../../styles.css";

type UserRole = "student" | "teacher" | "parent" | "admin";
type SelectableRole = "student" | "teacher" | "parent";
type AuthMode = "login" | "register";

const ADMIN_EMAIL = "admin@gmail.com";

const roleLabels: Record<SelectableRole, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<SelectableRole>("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
  }

  function isAdminEmail(value: string | null) {
    return normalizeEmail(value || "") === ADMIN_EMAIL;
  }

  async function createUserProfile(
    uid: string,
    userEmail: string | null,
    role: UserRole,
    name?: string | null
  ) {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }

    const profile = {
      email: normalizeEmail(userEmail || ""),
      role,
      fullName: name || "Người dùng mới",
      active: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, profile);
    return profile;
  }

  async function redirectByRole(role: UserRole, selected: SelectableRole) {
    if (role === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (role !== selected) {
      setMessage(`Tài khoản này không thuộc vai trò ${roleLabels[selected]}.`);
      return;
    }

    window.location.href = `/${role}`;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("Đang kiểm tra tài khoản...");

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password
      );

      const userRef = doc(db, "users", credential.user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        if (isAdminEmail(credential.user.email)) {
          const adminProfile = await createUserProfile(
            credential.user.uid,
            credential.user.email,
            "admin",
            "Administrator"
          );

          await redirectByRole(adminProfile.role as UserRole, selectedRole);
          return;
        }

        setMessage("Tài khoản đã đăng nhập nhưng chưa có hồ sơ người dùng.");
        return;
      }

      const profile = userSnapshot.data();

      if (profile.active === false) {
        setMessage("Tài khoản này hiện đang bị khóa.");
        return;
      }

      await redirectByRole(profile.role as UserRole, selectedRole);
    } catch (error) {
      console.error(error);
      setMessage("Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("Đang tạo tài khoản...");

      const normalizedEmail = normalizeEmail(email);
      const role: UserRole = isAdminEmail(normalizedEmail)
        ? "admin"
        : selectedRole;

      const credential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      await createUserProfile(
        credential.user.uid,
        credential.user.email,
        role,
        role === "admin" ? "Administrator" : fullName
      );

      window.location.href = role === "admin" ? "/admin" : `/${role}`;
    } catch (error) {
      console.error(error);
      setMessage("Không thể tạo tài khoản. Email có thể đã được sử dụng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      setMessage("Đang đăng nhập bằng Google...");

      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      const role: UserRole = isAdminEmail(credential.user.email)
        ? "admin"
        : selectedRole;

      const profile = await createUserProfile(
        credential.user.uid,
        credential.user.email,
        role,
        role === "admin" ? "Administrator" : credential.user.displayName
      );

      if (profile.active === false) {
        setMessage("Tài khoản này hiện đang bị khóa.");
        return;
      }

      await redirectByRole(profile.role as UserRole, selectedRole);
    } catch (error) {
      console.error(error);
      setMessage("Không thể đăng nhập bằng Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-left profile-showcase-left">
  <div className="showcase-copy">
    <span>COGNITIVE LEARN AI</span>

    <h1>
      Hiểu bản thân học tập.
      <br />
      Mở đường tương lai.
    </h1>

    <p>
      Phân tích năng lực, nhận thức và dữ liệu tuyển sinh để gợi ý lộ trình học
      tập và định hướng phù hợp cho từng học sinh.
    </p>
  </div>

  <div className="profile-showcase-card">
    <span className="dot d1"></span>
    <span className="dot d2"></span>
    <span className="dot d3"></span>
    <span className="dot d4"></span>
    <span className="dot d5"></span>

    <div className="showcase-avatar-ring">
      <div className="showcase-avatar">
        <span>A</span>
      </div>
    </div>

    <h3>Nguyễn Minh Anh</h3>
    <p>Cognitive Learner</p>

    <div className="showcase-pill">Mục tiêu: CNTT</div>

    <div className="showcase-stats">
      <article>
        <strong>78</strong>
        <span>SCI</span>
      </article>

      <article>
        <strong>64</strong>
        <span>MAS</span>
      </article>

      <article>
        <strong>82</strong>
        <span>CSL</span>
      </article>

      <article>
        <strong>25.6</strong>
        <span>Điểm dự báo</span>
      </article>
    </div>

    <div className="showcase-note">
      <span></span>
      <p>
        Khuyến nghị: tăng 2 buổi Toán mỗi tuần và giữ lịch học ổn định trong 14
        ngày tới.
      </p>
    </div>
  </div>
</section>

      <section className="auth-side">
        <div className="auth-logo-block">
          <img src={appLogo} alt="Cognitive Learn" className="auth-logo" />

          <h1>Nền tảng AI nhận thức tối ưu học tập và tuyển sinh</h1>
        </div>

        <section className="login-card">
          <div className="login-card-head">
            <p>
              {mode === "login"
                ? "ĐĂNG NHẬP HỆ THỐNG"
                : "TẠO TÀI KHOẢN MỚI"}
            </p>

            <h2>
              {mode === "login"
                ? "Chào mừng đến với Cognitive Learn"
                : "Tạo tài khoản Cognitive Learn"}
            </h2>

            <span>
              Chọn vai trò của bạn để bắt đầu sử dụng hệ thống.
            </span>
          </div>

          <div className="role-tabs">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={selectedRole === "student" ? "active" : ""}
            >
              Học sinh
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("teacher")}
              className={selectedRole === "teacher" ? "active" : ""}
            >
              Giáo viên
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("parent")}
              className={selectedRole === "parent" ? "active" : ""}
            >
              Phụ huynh
            </button>
          </div>

          <form
            className="login-form"
            onSubmit={mode === "login" ? handleLogin : handleRegister}
          >
            {mode === "register" && (
              <label>
                Họ và tên
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Mật khẩu
              <div className="password-field">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  className={
                    passwordVisible ? "peek-toggle is-peeking" : "peek-toggle"
                  }
                  onClick={() => setPasswordVisible((current) => !current)}
                  aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <span className="peek-face">
                    <span className="peek-eye left-eye">
                      <span className="peek-pupil"></span>
                    </span>
                    <span className="peek-eye right-eye">
                      <span className="peek-pupil"></span>
                    </span>
                  </span>
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Đang đăng nhập..."
                  : "Đang tạo tài khoản..."
                : mode === "login"
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
            </button>

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Đăng nhập bằng Google
            </button>

            <p className="auth-switch">
              {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Tạo tài khoản" : "Đăng nhập"}
              </button>
            </p>

            {message && <p className="login-message">{message}</p>}
          </form>
        </section>
      </section>
    </main>
  );
}