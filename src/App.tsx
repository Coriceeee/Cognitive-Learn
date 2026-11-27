import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { currentFocusedPath } from "./lib/focusedModuleRoute";
import { subscribeNavigation, getLastNavigationKind, getNavigationSnapshot } from "./lib/clientNavigation";
import { routeModules, preloadLikelyRoutes } from "./lib/routeModules";
import { getRouteDisplayTitle, planRouteExperience } from "./lib/routeExperience";
import FloatingAdvisorChat from "./components/common/FloatingAdvisorChat";
import AppFooter from "./components/common/AppFooter";
import AccessGate from "./components/common/AccessGate";
import RouteErrorBoundary from "./components/common/RouteErrorBoundary";
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

function NotFoundPage() {
  return (
    <main className="cla-access-screen cla-not-found-page">
      <section className="cla-access-panel" aria-labelledby="cla-not-found-title">
        <span className="cla-access-eyebrow">COGNITIVE LEARN AI · ĐIỀU HƯỚNG</span>
        <h1 id="cla-not-found-title">Không tìm thấy trang này</h1>
        <p>Đường dẫn có thể đã thay đổi hoặc không còn khả dụng. Bạn có thể quay lại không gian học sinh hoặc xem hướng dẫn sử dụng.</p>
        <div className="cla-access-actions">
          <a href="/student">Đến trang học sinh</a>
          <a href="/student/guide">Xem hướng dẫn</a>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  // External-store updates are synchronous and can reveal Suspense's full-screen
  // fallback on each cold lazy route. A React transition keeps the revealed page
  // visible until the next JS module is ready, without reloading the document.
  // Route identity includes URL search/hash, not just pathname. The Nexus
  // cluster and audit pages change views through query parameters without
  // changing the pathname. Storing pathname alone left React on stale UI.
  const [routeSnapshot, setRouteSnapshot] = useState(() => ({
    path: currentFocusedPath(), href: getNavigationSnapshot(), kind: getLastNavigationKind(),
  }));
  const path = routeSnapshot.path;
  const previousRouteHref = useRef<string | null>(null);
  const [routePending, startRouteTransition] = useTransition();
  useEffect(() => subscribeNavigation(() => {
    startRouteTransition(() => setRouteSnapshot({
      path: currentFocusedPath(), href: getNavigationSnapshot(), kind: getLastNavigationKind(),
    }));
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
    const previous = previousRouteHref.current;
    previousRouteHref.current = routeSnapshot.href;
    const experience = planRouteExperience(previous, routeSnapshot.href, routeSnapshot.kind);
    document.title = `${getRouteDisplayTitle(path)} | Cognitive Learn AI`;
    if (experience.scroll === 'top') window.scrollTo({top: 0, behavior: 'instant'});
    // React has committed the new route before this effect. Wait a frame for
    // its headings/anchors; do not scroll or steal focus on query-only filters.
    if (!experience.anchor && !experience.focusContent) return;
    const frame = window.requestAnimationFrame(() => {
      if (experience.anchor) {
        const target = document.getElementById(experience.anchor);
        if (target) target.scrollIntoView({block: 'start'});
        else if (previous && experience.focusContent) window.scrollTo({top: 0, behavior: 'instant'});
      }
      if (experience.focusContent) {
        document.getElementById('cla-page-content')?.focus({preventScroll: true});
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [routeSnapshot.href, routeSnapshot.kind, path]);
  useEffect(() => {
    if (window.location.pathname !== path) {
      window.history.replaceState(window.history.state, "", path + window.location.search + window.location.hash);
    }
  }, [path]);

  let currentPage: ReactNode;
  let notFound = false;

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
      <AdminDiagnosticsPage key={routeSnapshot.href} />
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
    currentPage = <StudyAbroadPage navigationHref={routeSnapshot.href} />;
  } else if (["/haven", "/haven/scholarships", "/haven/finance", "/haven/plan"].includes(path)) {
    currentPage = <HavenPage />;

  } else if (path === "/") {
    currentPage = <TrangDangNhap />;
  } else {
    notFound = true;
    currentPage = <NotFoundPage />;
  }

  return (
    <div className="app-root">
      <a className="cla-skip-to-content" href="#cla-page-content">Bỏ qua điều hướng, đến nội dung</a>
      <span className="cla-route-announcement" role="status" aria-live="polite" aria-atomic="true">
        {`Đã mở: ${getRouteDisplayTitle(path)}`}
      </span>
      {routePending && <div className="cla-route-progress" role="progressbar" aria-label="Đang mở trang tiếp theo" />}
      <Suspense
        fallback={
          <AppLoading />
        }
      >
        <RouteErrorBoundary key={path} route={path}>
        <div className="app-content" id="cla-page-content" tabIndex={-1} data-cla-route={path}>
          {path === "/" || path === "/about" || path === "/contact" || notFound ? (
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
        </RouteErrorBoundary>
      </Suspense>

      <AppFooter />
    </div>
  );
}