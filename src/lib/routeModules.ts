/** One set of lazy import entrypoints, shared with non-rendering route prefetch.
 * Prefetch loads CODE only; private Firestore data is never prefetched here.
 */
export const routeModules = {
  login: () => import('../page/auth/LoginPage'),
  admin: () => import('../page/nexus/AdminPage'),
  adminDiagnostics: () => import('../page/nexus/AdminDiagnosticsPage'),
  adminAudit: () => import('../page/nexus/AdminAuditPage'),
  companion: () => import('../page/companion/DailyCompanionPage'),
  student: () => import('../page/seed/StudentPage'),
  studentProfile: () => import('../page/seed/StudentProfilePage'),
  studentConsent: () => import('../page/seed/StudentConsentPage'),
  studentTranscript: () => import('../page/seed/StudentTranscriptPage'),
  studentModules: () => import('../page/seed/StudentModulesPage'),
  studentGuide: () => import('../page/seed/StudentGuidePage'),
  studentStorage: () => import('../page/seed/StudentStorageStatusPage'),
  about: () => import('../page/main/AboutPage'),
  contact: () => import('../page/main/ContactPage'),
  atlas: () => import('../page/atlas/AtlasPage'),
  lumen: () => import('../page/lumen/LumenPage'),
  orion: () => import('../page/orion/OrionPage'),
  pulse: () => import('../page/pulse/PulsePage'),
  studyAbroad: () => import('../page/study-abroad/StudyAbroadPage'),
  haven: () => import('../page/haven/HavenPage'),
} as const;

type RouteModule = keyof typeof routeModules;
const requested = new Map<RouteModule, Promise<unknown>>();

function moduleForPath(pathname: string): RouteModule | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' ) return 'login';
  if (path === '/about') return 'about';
  if (path === '/contact') return 'contact';
  if (path === '/admin') return 'admin';
  if (path === '/admin/diagnostics') return 'adminDiagnostics';
  if (path === '/admin/audit') return 'adminAudit';
  if (path === '/student/companion') return 'companion';
  if (path === '/student/profile') return 'studentProfile';
  if (path === '/student/consent') return 'studentConsent';
  if (path === '/student/transcript') return 'studentTranscript';
  if (path === '/student/modules') return 'studentModules';
  if (path === '/student/guide') return 'studentGuide';
  if (path === '/student/storage') return 'studentStorage';
  if (path === '/student' || path === '/student/exams') return 'student';
  if (path === '/study-abroad' || path === '/haven/study-abroad' || path === '/atlas/study-abroad' || path.startsWith('/atlas/study-abroad/')) return 'studyAbroad';
  if (path === '/atlas' || path.startsWith('/atlas/')) return 'atlas';
  if (path === '/lumen' || path.startsWith('/lumen/')) return 'lumen';
  if (path === '/orion' || path.startsWith('/orion/')) return 'orion';
  if (path === '/pulse' || path.startsWith('/pulse/')) return 'pulse';
  if (path === '/haven' || path.startsWith('/haven/')) return 'haven';
  return null;
}

/** Fetches only route JavaScript once per module. Errors can be retried. */
export function prefetchRoute(pathname: string): void {
  const key = moduleForPath(pathname);
  if (!key || requested.has(key)) return;
  const loader = routeModules[key] as () => Promise<unknown>;
  try {
    const job = loader();
    requested.set(key, job);
    void job.catch(() => { if (requested.get(key) === job) requested.delete(key); });
  } catch { /* Browser may be offline; the actual navigation can retry. */ }
}

/** Small, optional idle warm-up for touch navigation, where hover prefetch
 * cannot happen. Respects data-saving or slow connections, never fetches user
 * data, and avoids warming the whole app at once.
 */
export function preloadLikelyRoutes(currentPath: string): void {
  if (typeof navigator !== 'undefined') {
    const conn = (navigator as Navigator & {connection?: {saveData?:boolean; effectiveType?:string}}).connection;
    if (conn?.saveData || /(?:^|-)2g|3g/.test(conn?.effectiveType ?? '')) return;
  }
  const top = currentPath.split('/')[1];
  const likely: Record<string,string[]> = {
    student: ['/lumen','/atlas'],
    lumen: ['/student','/orion'],
    atlas: ['/student','/haven'],
    orion: ['/pulse','/student'],
    pulse: ['/orion','/student'],
    haven: ['/atlas','/student'],
  };
  for (const href of likely[top] ?? []) prefetchRoute(href);
}
