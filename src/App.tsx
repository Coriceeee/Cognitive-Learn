import { Suspense, lazy, type ReactNode } from "react";
import AppFooter from "./components/common/AppFooter";

const TrangDangNhap = lazy(() => import("./page/auth/LoginPage"));
const TrangVaiTro = lazy(() => import("./page/main/RolePage"));
const TrangQuanTri = lazy(() => import("./page/nexus/AdminPage"));
const TrangHocSinh = lazy(() => import("./page/seed/StudentPage"));
const TrangNhapHoSoHocTap = lazy(
  () => import("./page/seed/StudentProfilePage")
);
const GioiThieuPage = lazy(() => import("./page/main/AboutPage"));
const LienHePage = lazy(() => import("./page/main/ContactPage"));

const AtlasPage = lazy(() => import("./page/atlas/AtlasPage"));
const OrionPage = lazy(() => import("./page/orion/OrionPage"));
const PulsePage = lazy(() => import("./page/pulse/PulsePage"));
const HavenPage = lazy(() => import("./page/haven/HavenPage"));

function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 shadow-2xl backdrop-blur-xl">
        <div className="text-sm font-semibold tracking-wide">Đang tải...</div>
        <div className="mt-1 text-xs text-slate-300">COGNITIVE LEARN AI</div>
      </div>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  let currentPage: ReactNode;

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
  } else if (path === "/atlas") {
    currentPage = <AtlasPage />;
  } else if (path === "/orion") {
    currentPage = <OrionPage />;
  } else if (path === "/pulse") {
    currentPage = <PulsePage />;
  } else if (path === "/haven") {
    currentPage = <HavenPage />;
  } else if (path === "/teacher") {
    currentPage = <TrangVaiTro role="teacher" />;
  } else if (path === "/parent") {
    currentPage = <TrangVaiTro role="parent" />;
  } else if (path === "/role") {
    currentPage = <TrangVaiTro role="admin" />;
  } else {
    currentPage = <TrangDangNhap />;
  }

  return (
    <div className="app-root">
      <Suspense fallback={<AppLoading />}>
        <div className="app-content">{currentPage}</div>
      </Suspense>

      <AppFooter />
    </div>
  );
}