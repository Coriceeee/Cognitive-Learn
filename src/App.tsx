import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { currentFocusedPath } from "./lib/focusedModuleRoute";
import { subscribeNavigation, getLastNavigationKind } from "./lib/clientNavigation";
import { routeModules, preloadLikelyRoutes } from "./lib/routeModules";
import FloatingAdvisorChat from "./components/common/FloatingAdvisorChat";
import AppFooter from "./components/common/AppFooter";
import AccessGate from "./components/common/AccessGate";
import AppNotificationCenter from "./components/common/AppNotificationCenter";

const StudentProfileProvider = lazy(() => import("./page/seed/hooks/StudentProfileProvider").then(module => ({default: module.StudentProfileProvider})));

const TrangDangNhap = lazy(routeModules.login);

const TrangQuanTri = lazy(routeModules.admin);
const AdminDiagnosticsPage = lazy(routeModules.adminDiagnostics);
const AdminAuditPage = lazy(routeModules.adminAudit);

const DailyCompanionPage = lazy(routeModules.companion);

const TrangHocSinh = lazy(routeModules.student);

const TrangNhapHoSoHocTap = lazy(routeModules.studentProfile);

const StudentConsentPage = lazy(routeModules.studentConsent);

const StudentTranscriptPage = lazy(routeModules.studentTranscript);
const StudentModulesPage = lazy(routeModules.studentModules);
const StudentGuidePage = lazy(routeModules.studentGuide);
const StudentStorageStatusPage = lazy(routeModules.studentStorage);

const GioiThieuPage = lazy(routeModules.about);

const LienHePage = lazy(routeModules.contact);

const AtlasPage = lazy(routeModules.atlas);

const LumenPage = lazy(routeModules.lumen);

const OrionPage = lazy(routeModules.orion);

const PulsePage = lazy(routeModules.pulse);

const StudyAbroadPage = lazy(routeModules.studyAbroad);

const HavenPage = lazy(routeModules.haven);

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
  // External-store updates are synchronous and can reveal Suspense's full-screen
  // fallback on each cold lazy route. A React transition keeps the revealed page
  // visible until the next JS module is ready, without reloading the document.
  const [path, setPath] = useState(() => currentFocusedPath());
  const [routePending, startRouteTransition] = useTransition();
  useEffect(() => subscribeNavigation(() => {
    startRouteTransition(() => setPath(currentFocusedPath()));
  }), []);
  // Preload at most two likely next module chunks on an idle connection.
  // This helps touch devices, where pointer-hover prefetch is unavailable.
  useEffect(() => {
    if (!/^\/(student|atlas|lumen|orion|pulse|haven)(?:\/|$)/.test(path)) return;
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => preloadLikelyRoutes(path), { timeout: 2200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => preloadLikelyRoutes(path), 1200);
    return () => clearTimeout(id);
  }, [path]);
  useLayoutEffect(() => {
    // Browser Back/Forward should keep native scroll restoration.
    if (getLastNavigationKind() === 'pop') return;
    const fragment = window.location.hash;
    if (fragment && path === currentFocusedPath()) {
      const frame = window.requestAnimationFrame(() => {
        const target = document.getElementById(decodeURIComponent(fragment.slice(1)));
        if (target) target.scrollIntoView({block: 'start'});
        else window.scrollTo({top: 0, behavior: 'instant'});
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({top: 0, behavior: 'instant'});
  }, [path]);
  useEffect(() => {
    if (window.location.pathname !== path) {
      window.history.replaceState(window.history.state, "", path + window.location.search + window.location.hash);
    }
  }, [path]);

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
  } else if (path === "/admin/audit") {
    currentPage = <AdminAuditPage />;
  } else if (path === "/student/companion") {
    currentPage = <DailyCompanionPage />;
  } else if (["/student", "/student/exams"].includes(path)) {
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
  } else if (["/atlas", "/atlas/vietnam", "/atlas/joint", "/atlas/recommendations", "/atlas/sources", "/atlas/subjects", "/atlas/compare", "/atlas/library"].includes(path)) {
    currentPage = <AtlasPage />;
  } else if (["/lumen", "/lumen/indices", "/lumen/history", "/lumen/insights", "/lumen/assistant", "/lumen/state", "/lumen/roadmap", "/lumen/evidence", "/lumen/advanced"].includes(path)) {
    currentPage = (
      <LumenPage />
    );
  } else if (["/orion", "/orion/inputs", "/orion/scenarios", "/orion/roadmap"].includes(path)) {
    currentPage = <OrionPage />;
  } else if (["/pulse", "/pulse/progress", "/pulse/reports", "/pulse/actions", "/pulse/inputs", "/pulse/checkin", "/pulse/audit"].includes(path)) {
    currentPage = <PulsePage />;
  } else if (path === "/atlas/study-abroad" || path.startsWith("/atlas/study-abroad/") || path === "/study-abroad" || path === "/haven/study-abroad") {
    currentPage = <StudyAbroadPage />;
  } else if (["/haven", "/haven/scholarships", "/haven/finance", "/haven/plan"].includes(path)) {
    currentPage = <HavenPage />;

  } else {
    currentPage = (
      <TrangDangNhap />
    );
  }

  return (
    <div className="app-root">
      {routePending && <div className="cla-route-progress" role="progressbar" aria-label="Đang mở trang tiếp theo" />}
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
              {path === "/student/consent" || path.startsWith("/admin") ? (
                <>
                  <AppNotificationCenter />
                  {currentPage}
                  {path !== "/student/consent" && <FloatingAdvisorChat />}
                </>
              ) : (
                <StudentProfileProvider>
                  <AppNotificationCenter />
                  {currentPage}
                  <FloatingAdvisorChat />
                </StudentProfileProvider>
              )}
            </AccessGate>
          )}
        </div>
      </Suspense>

      <AppFooter />
    </div>
  );
}