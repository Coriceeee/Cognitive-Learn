import {
  Suspense,
  lazy,
  type ReactNode,
} from "react";

import FloatingAdvisorChat from "./components/common/FloatingAdvisorChat";
import AppFooter from "./components/common/AppFooter";
import AccessGate from "./components/common/AccessGate";
import AppNotificationCenter from "./components/common/AppNotificationCenter";

const TrangDangNhap = lazy(
  () => import("./page/auth/LoginPage")
);

const TrangVaiTro = lazy(
  () => import("./page/main/RolePage")
);

const TrangQuanTri = lazy(
  () => import("./page/nexus/AdminPage")
);
const AdminDiagnosticsPage = lazy(
  () => import("./page/nexus/AdminDiagnosticsPage")
);

const DailyCompanionPage = lazy(() => import("./page/companion/DailyCompanionPage"));

const TrangHocSinh = lazy(
  () => import("./page/seed/StudentPage")
);

const TrangNhapHoSoHocTap = lazy(
  () =>
    import(
      "./page/seed/StudentProfilePage"
    )
);

const StudentConsentPage = lazy(
  () => import("./page/seed/StudentConsentPage")
);

const StudentTranscriptPage = lazy(
  () => import("./page/seed/StudentTranscriptPage")
);
const StudentModulesPage = lazy(
  () => import("./page/seed/StudentModulesPage")
);
const StudentGuidePage = lazy(
  () => import("./page/seed/StudentGuidePage")
);
const StudentStorageStatusPage = lazy(
  () => import("./page/seed/StudentStorageStatusPage")
);

const GioiThieuPage = lazy(
  () => import("./page/main/AboutPage")
);

const LienHePage = lazy(
  () => import("./page/main/ContactPage")
);

const AtlasPage = lazy(
  () => import("./page/atlas/AtlasPage")
);

const LumenPage = lazy(
  () => import("./page/lumen/LumenPage")
);

const OrionPage = lazy(
  () => import("./page/orion/OrionPage")
);

const PulsePage = lazy(
  () => import("./page/pulse/PulsePage")
);

const StudyAbroadPage = lazy(() => import("./page/study-abroad/StudyAbroadPage"));

const HavenPage = lazy(
  () => import("./page/haven/HavenPage")
);

function AppLoading() {
  return (
    <div className="cla-app-loading" role="status" aria-live="polite">
      <div className="cla-app-loading-card">
        <strong>Đang tải...</strong>
        <small>COGNITIVE LEARN AI</small>
      </div>
    </div>
  );
}

export default function App() {
  const path =
    window.location.pathname.replace(
      /\/$/,
      ""
    ) || "/";

  let currentPage: ReactNode;

  if (path === "/about") {
    currentPage = (
      <GioiThieuPage />
    );
  } else if (path === "/contact") {
    currentPage = (
      <LienHePage />
    );
  } else if (path === "/admin") {
    currentPage = (
      <TrangQuanTri />
    );
  } else if (path === "/admin/diagnostics") {
    currentPage = (
      <AdminDiagnosticsPage />
    );
  } else if (path === "/student/companion") {
    currentPage = <DailyCompanionPage />;
  } else if (path === "/student") {
    currentPage = (
      <TrangHocSinh />
    );
  } else if (
    path === "/student/profile"
  ) {
    currentPage = (
      <TrangNhapHoSoHocTap />
    );
  } else if (path === "/student/consent") {
    currentPage = <StudentConsentPage />;
  } else if (path === "/student/transcript") {
    currentPage = (
      <StudentTranscriptPage />
    );
  } else if (path === "/student/modules") {
    currentPage = (
      <StudentModulesPage />
    );
  } else if (path === "/student/guide") {
    currentPage = <StudentGuidePage />;
  } else if (path === "/student/storage") {
    currentPage = (
      <StudentStorageStatusPage />
    );
  } else if (["/atlas", "/atlas/vietnam", "/atlas/joint", "/atlas/recommendations", "/atlas/sources"].includes(path)) {
    currentPage = <AtlasPage />;
  } else if (["/lumen", "/lumen/indices", "/lumen/history", "/lumen/insights", "/lumen/assistant"].includes(path)) {
    currentPage = (
      <LumenPage />
    );
  } else if (["/orion", "/orion/inputs", "/orion/scenarios", "/orion/roadmap"].includes(path)) {
    currentPage = <OrionPage />;
  } else if (["/pulse", "/pulse/progress", "/pulse/reports", "/pulse/actions"].includes(path)) {
    currentPage = <PulsePage />;
  } else if (path === "/atlas/study-abroad" || path.startsWith("/atlas/study-abroad/") || path === "/study-abroad" || path === "/haven/study-abroad") {
    currentPage = <StudyAbroadPage />;
  } else if (["/haven", "/haven/scholarships", "/haven/finance", "/haven/plan"].includes(path)) {
    currentPage = <HavenPage />;
  } else if (path === "/teacher") {
    currentPage = (
      <TrangVaiTro
        role="teacher"
      />
    );
  } else if (path === "/parent") {
    currentPage = (
      <TrangVaiTro
        role="parent"
      />
    );
  } else if (path === "/role") {
    currentPage = (
      <TrangVaiTro
        role="admin"
      />
    );
  } else {
    currentPage = (
      <TrangDangNhap />
    );
  }

  return (
    <div className="app-root">
      <Suspense
        fallback={
          <AppLoading />
        }
      >
        <div className="app-content" data-cla-route={path}>
          {path === "/" || path === "/about" || path === "/contact" ? (
            currentPage
          ) : (
            <AccessGate path={path}>
              <AppNotificationCenter />
              {currentPage}
              {path !== "/student/consent" && <FloatingAdvisorChat />}
            </AccessGate>
          )}
        </div>
      </Suspense>

      <AppFooter />
    </div>
  );
}