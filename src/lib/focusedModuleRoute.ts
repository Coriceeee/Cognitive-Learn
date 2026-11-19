/** Canonical deep links for module workspaces. Legacy hash bookmarks remain usable.
 * This is presentation routing only; AccessGate still authorizes the canonical route.
 */
export const legacyModuleAnchors: Readonly<Record<string,string>> = {
  '/student#cla-exam-reminders':'/student/exams',
  '/lumen#lumen-indices':'/lumen/indices', '/lumen#lumen-growth':'/lumen/history',
  '/lumen#lumen-insights':'/lumen/insights', '/lumen#lumen-gemini':'/lumen/assistant',
  '/lumen#cla-closed-loop':'/lumen/evidence', '/lumen#cla-decision-evidence-studio':'/lumen/evidence',
  '/atlas#atlas-official-admissions':'/atlas/vietnam', '/atlas#atlas-public-source-search':'/atlas/sources',
  '/atlas#atlas-personalized-discovery':'/atlas/recommendations', '/atlas#atlas-decision-comparison':'/atlas/compare',
  '/atlas#atlas-joint-programs':'/atlas/joint', '/atlas#atlas-engine':'/atlas/subjects',
  '/atlas/recommendations#atlas-engine':'/atlas/subjects', '/atlas#atlas-source-registry':'/atlas/sources',
  '/atlas#atlas-programs':'/atlas/library', '/atlas#atlas-gemini-reader':'/atlas/library',
  '/orion#orion-input':'/orion/inputs', '/orion#orion-scenarios':'/orion/scenarios',
  '/orion#orion-roadmap':'/orion/roadmap', '/orion#cla-closed-loop':'/orion/scenarios',
  '/pulse#pulse-input':'/pulse/inputs', '/pulse#pulse-risk':'/pulse/progress',
  '/pulse#pulse-report':'/pulse/reports', '/pulse#pulse-actions':'/pulse/actions',
  '/pulse#pulse-pipeline':'/pulse/audit', '/pulse#cla-closed-loop':'/pulse/checkin',
  '/haven#haven-scholarships':'/haven/scholarships', '/haven#haven-scholarship-scenarios':'/haven/scholarships',
  '/haven#haven-financial':'/haven/finance', '/haven#haven-support-roles':'/haven/plan',
  '/haven#haven-support-plan':'/haven/plan',
};
export function resolveFocusedPath(pathname: string, hash = ''): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  const key = path + hash;
  const legacy = Object.prototype.hasOwnProperty.call(legacyModuleAnchors,key) ? legacyModuleAnchors[key] : undefined;
  if (legacy) return legacy;
  if (path === '/study-abroad' || path === '/haven/study-abroad') return '/atlas/study-abroad';
  return path;
}
export function currentFocusedPath(): string {
  return resolveFocusedPath(window.location.pathname, window.location.hash);
}
