import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDocFromServer, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  checkAccountDocument,
  firebaseErrorCode,
  readAccountDocumentWithRetry,
  type AccountRole,
} from "../../lib/accountVerification";
import appLogo from "../../assets/logo cla.png";
import "../../styles.css";

type UserRole = AccountRole;
type SelectableRole = "student" | "teacher" | "parent";
type AuthMode = "login" | "register";

function describeSignInError(error: unknown, authenticated = false): string {
  const code = firebaseErrorCode(error);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Thông tin đăng nhập chưa đúng. Hãy kiểm tra email và mật khẩu.";
    case "auth/user-disabled":
      return "Tài khoản Firebase Authentication đã bị vô hiệu hóa. Hãy kiểm tra trong Firebase Console.";
    case "auth/too-many-requests":
      return "Firebase tạm giới hạn đăng nhập do có nhiều yêu cầu. Hãy thử lại sau.";
    case "auth/network-request-failed":
      return "Không kết nối được Firebase Authentication. Hãy kiểm tra mạng.";
    case "permission-denied":
      return "Đã xác thực tài khoản, nhưng Firestore từ chối đọc hồ sơ vai trò. Kiểm tra Firestore Rules của users/{uid}.";
    case "unavailable":
    case "deadline-exceeded":
    case "aborted":
      return authenticated
        ? "Đã xác thực tài khoản, nhưng Cloud Firestore chưa phản hồi để xác minh quyền. Hãy thử lại xác minh quyền; kiểm tra mạng, Firestore Database và Firebase Project nếu vẫn lỗi."
        : "Cloud Firestore chưa phản hồi. Kiểm tra mạng và Firebase Project.";
    default:
      return "Không thể hoàn tất đăng nhập. Kiểm tra Console để xác định lỗi Firebase (" + code + ").";
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<SelectableRole>("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => setHasAuthenticatedSession(Boolean(user)),
      () => setHasAuthenticatedSession(false),
    );
    return unsubscribe;
  }, []);

  function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
  }

  async function createUserProfile(
    uid: string,
    userEmail: string | null,
    role: UserRole,
    name?: string | null
  ) {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await readAccountDocumentWithRetry(() => getDocFromServer(userRef));

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

  function redirectByRole(role: UserRole) {
    // Login role always comes from a fresh Firestore read, never a UI tab or email.
    window.location.href = role === "admin" ? "/admin" : `/${role}`;
  }

  async function verifyAndRedirect(uid: string) {
    const snapshot = await readAccountDocumentWithRetry(() =>
      getDocFromServer(doc(db, "users", uid)),
    );
    const account = checkAccountDocument(snapshot.exists(), snapshot.exists() ? snapshot.data() : null);
    if (account.status !== "ready") {
      if (account.status === "no-profile") {
        setMessage("Firebase đã xác thực, nhưng chưa có hồ sơ users/{uid}. Cần cấp hồ sơ hợp lệ trong đúng Firebase Project.");
      } else if (account.status === "inactive") {
        setMessage("Tài khoản chưa có active: true hoặc đang bị khóa. Hãy kiểm tra hồ sơ trong Firestore.");
      } else {
        setMessage("Vai trò tài khoản không hợp lệ. Cần kiểm tra trường role trong Firestore.");
      }
      return;
    }
    redirectByRole(account.role);
  }

  async function handleResumeVerification() {
    const user = auth.currentUser;
    if (!user) {
      setMessage("Phiên đăng nhập không còn hiệu lực. Hãy đăng nhập lại.");
      return;
    }
    try {
      setLoading(true);
      setMessage("Đang xác minh lại vai trò từ Firestore...");
      await verifyAndRedirect(user.uid);
    } catch (error) {
      console.error("CLA role verification failed:", error);
      setMessage(describeSignInError(error, true));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let authenticated = false;
    try {
      setLoading(true);
      setMessage("Đang xác thực tài khoản với Firebase...");
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password,
      );
      authenticated = true;
      setMessage("Đã xác thực. Đang kiểm tra vai trò từ Firestore...");
      await verifyAndRedirect(credential.user.uid);
    } catch (error) {
      console.error("CLA login failed:", error);
      setMessage(describeSignInError(error, authenticated));
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
      // New registrations cannot create an administrator account.
      // Admin access must be provisioned by a trusted server/admin process.
      const role: UserRole = selectedRole;

      const credential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      await createUserProfile(
        credential.user.uid,
        credential.user.email,
        role,
        fullName
      );

      window.location.href = `/${role}`;
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

      const role: UserRole = selectedRole;

      const profile = await createUserProfile(
        credential.user.uid,
        credential.user.email,
        role,
        credential.user.displayName
      );

      const check = checkAccountDocument(true, profile);
      if (check.status !== "ready") {
        setMessage("Hồ sơ tài khoản không hợp lệ hoặc chưa được kích hoạt. Kiểm tra role và active: true trong Firestore.");
        return;
      }
      redirectByRole(check.role);
    } catch (error) {
      console.error(error);
      setMessage(describeSignInError(error));
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
              {mode === "login"
                ? "Đăng nhập bằng tài khoản hiện có; nếu được cấp vai trò Admin, hệ thống tự chuyển đến trang quản trị."
                : "Chọn vai trò để tạo tài khoản Student, Teacher hoặc Parent."}
            </span>
          </div>

          <div className="role-selector">
            <span className="role-selector-label">Vai trò tài khoản</span>
            {mode === "login" ? (
              <p className="login-role-hint">CLA tự xác minh vai trò theo Firestore. Admin sẽ vào trang quản trị mà không cần chọn tab Học sinh.</p>
            ) : (
            <div className="role-tabs" role="group" aria-label="Chọn vai trò tài khoản">
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
            )}
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

            {hasAuthenticatedSession && mode === "login" && (
              <button type="button" className="google-button" onClick={handleResumeVerification} disabled={loading}>
                Thử lại xác minh quyền (không cần nhập mật khẩu)
              </button>
            )}
            {message && <p className="login-message" role="status" aria-live="polite">{message}</p>}
          </form>
        </section>
      </section>
    </main>
  );
}