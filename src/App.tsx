import TrangDangNhap from "./page/auth/LoginPage";
import TrangVaiTro from "./page/main/RolePage";
import TrangQuanTri from "./page/nexus/AdminPage";
import TrangHocSinh from "./page/seed/StudentPage";
import TrangNhapHoSoHocTap from "./page/seed/StudentProfilePage";
import GioiThieuPage from "./page/main/AboutPage";
import LienHePage from "./page/main/ContactPage";
import AppFooter from "./components/common/AppFooter";

export default function App() {
  const path = window.location.pathname;

  let currentPage;

  if (path === "/about") {
    currentPage = <GioiThieuPage />;
  } else if (path === "/contact") {
    currentPage = <LienHePage />;
  } else if (path === "/admin") {
    currentPage = <TrangQuanTri />;
  } else if (path === "/student") {
    currentPage = <TrangHocSinh />;
  } else if (path === "/student/profile") {
    currentPage = <TrangNhapHoSoHocTap />;
  } else if (path === "/teacher") {
    currentPage = <TrangVaiTro role={"admin"} />;
  } else if (path === "/parent") {
    currentPage = <TrangVaiTro role={"admin"} />;
  } else if (path === "/role") {
    currentPage = <TrangVaiTro role={"admin"} />;
  } else {
    currentPage = <TrangDangNhap />;
  }

  return (
    <div className="app-root">
      <div className="app-content">{currentPage}</div>
      <AppFooter />
    </div>
  );
}