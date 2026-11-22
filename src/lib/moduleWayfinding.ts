/**
 * CP63 UX: predictable, bounded navigation for a student's focused workspace.
 * Presentation only: no learner progress, model outputs, completion or permissions.
 */
export type GuidedSection = {
  id: string;
  title: string;
  description: string;
  href?: string;
  group: string;
  status: string;
};

export type GuidedNavigation = {
  available: GuidedSection[];
  featured: GuidedSection[];
  more: GuidedSection[];
  active: GuidedSection | undefined;
  previous: GuidedSection | undefined;
  next: GuidedSection | undefined;
  step: number;
  total: number;
  onHome: boolean;
};

function matchesSection(href: string, path: string): boolean {
  // Study-abroad has country-specific nested pages under the same tab.
  return path === href || (href === "/atlas/study-abroad" && path.startsWith(`${href}/`));
}

export function planGuidedNavigation(
  items: readonly GuidedSection[],
  home: string,
  currentPath: string,
  maxFeatured = 3,
): GuidedNavigation {
  const available = items.filter((item): item is GuidedSection & { href: string } =>
    Boolean(item.href) && item.status !== "planned" && item.href !== home,
  );
  const onHome = currentPath === home;
  const active = available.find(item => matchesSection(item.href, currentPath));
  const index = active ? available.indexOf(active) : -1;
  const limit = Math.max(1, Math.floor(Number.isFinite(maxFeatured) ? maxFeatured : 3));
  const featured = available.slice(0, limit);
  if (active && !featured.includes(active)) featured.splice(featured.length - 1, 1, active);
  // Preserve order of the catalog, rather than moving the selected tab to the end.
  featured.sort((a, b) => available.indexOf(a) - available.indexOf(b));
  const more = available.filter(item => !featured.includes(item));
  return {
    available, featured, more, active,
    previous: index > 0 ? available[index - 1] : undefined,
    next: onHome ? available[0] : index >= 0 ? available[index + 1] : undefined,
    step: onHome ? 1 : index >= 0 ? index + 2 : 1,
    total: available.length + 1,
    onHome,
  };
}
