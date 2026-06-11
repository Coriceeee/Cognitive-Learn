import TrangDangNhap from "./page/auth/LoginPage";
import TrangVaiTro from "./page/main/RolePage";
import TrangQuanTri from "./page/nexus/AdminPage";
import TrangHocSinh from "./page/seed/StudentPage";
import TrangNhapHoSoHocTap from "./page/seed/StudentProfilePage";
import GioiThieuPage from "./page/main/AboutPage";
import LienHePage from "./page/main/ContactPage";

function App() {
  const path = window.location.pathname;

  if (path === "/about") {
    return <GioiThieuPage />;
  }

  if (path === "/contact") {
    return <LienHePage />;
  }

  if (path === "/admin") {
    return <TrangQuanTri />;
  }

  if (path === "/student") {
    return <TrangHocSinh />;
  }

  if (path === "/student/profile") {
    return <TrangNhapHoSoHocTap />;
  }

  if (path === "/teacher") {
    return <TrangVaiTro role="teacher" />;
  }

  if (path === "/parent") {
    return <TrangVaiTro role="parent" />;
  }

  return <TrangDangNhap />;
}

export default App;