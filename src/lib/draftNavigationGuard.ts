/**
 * CLA CP56: one in-memory exit guard registry for SPA navigation.
 * Never stores student content or UID. A declined navigation must leave the
 * current React page mounted so its unsaved inputs remain intact.
 */
export type NavigationGuard = (from: string, to: string) => boolean;
const guards = new Set<NavigationGuard>();

export function registerNavigationGuard(guard: NavigationGuard): () => void {
  guards.add(guard);
  return () => { guards.delete(guard); };
}

export function canNavigate(from: string, to: string): boolean {
  if (from === to) return true;
  for (const guard of guards) {
    if (!guard(from, to)) return false;
  }
  return true;
}

export function isLeavingDraftWorkspace(moduleName: "orion" | "pulse" | "haven", destination: string): boolean {
  const destinationPath = destination.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const root = `/${moduleName}`;
  return destinationPath !== root && !destinationPath.startsWith(`${root}/`);
}
