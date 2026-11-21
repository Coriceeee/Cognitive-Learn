/**
 * Client-side navigation for CLA's native route table.
 *
 * The app intentionally does not add a second router. Internal links update
 * history without tearing down Firebase Auth, streaming listeners or the
 * entire document. External URLs, downloads, forms and modified clicks retain
 * their browser behavior. This does not change AccessGate authorization.
 */
import { resolveFocusedPath } from './focusedModuleRoute';
import { prefetchRoute } from './routeModules';

type Listener = () => void;
export type NavigationKind = 'push' | 'replace' | 'pop';
let lastNavigationKind: NavigationKind = 'push';
const listeners = new Set<Listener>();
let attached = false;
let current = '';

function currentLocation(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname + window.location.search + window.location.hash;
}

function notify(kind: NavigationKind): void {
  lastNavigationKind = kind;
  current = currentLocation();
  for (const listener of listeners) listener();
}

function handlePopState(): void {
  notify('pop');
}

function handleLinkClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || link.dataset.fullReload === 'true') return;
  if (link.target && link.target !== '_self') return;
  if (link.rel.split(/\s+/).includes('external')) return;

  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || !['http:', 'https:'].includes(url.protocol)) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash &&
      resolveFocusedPath(url.pathname, url.hash) === url.pathname) {
    // Preserve native in-page anchors (scroll, focus and URL hash behavior).
    return;
  }
  if (url.href === window.location.href) return;
  event.preventDefault();
  navigateTo(url.pathname + url.search + url.hash);
}

/** Load route code before click; no database calls, no navigation side effects. */
function handleLinkIntent(event: Event): void {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || link.dataset.fullReload === 'true') return;
  if (link.target && link.target !== '_self') return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || !['http:', 'https:'].includes(url.protocol)) return;
  prefetchRoute(resolveFocusedPath(url.pathname, url.hash));
}

function attach(): void {
  if (attached || typeof window === 'undefined') return;
  current = currentLocation();
  document.addEventListener('click', handleLinkClick);
  document.addEventListener('pointerover', handleLinkIntent, {passive:true});
  document.addEventListener('focusin', handleLinkIntent);
  document.addEventListener('pointerdown', handleLinkIntent, {passive:true});
  window.addEventListener('popstate', handlePopState);
  attached = true;
}
function detach(): void {
  if (!attached || listeners.size) return;
  document.removeEventListener('click', handleLinkClick);
  document.removeEventListener('pointerover', handleLinkIntent);
  document.removeEventListener('focusin', handleLinkIntent);
  document.removeEventListener('pointerdown', handleLinkIntent);
  window.removeEventListener('popstate', handlePopState);
  attached = false;
}

/** React subscription. The App schedules transitions instead of synchronous store renders. */
export function subscribeNavigation(listener: Listener): () => void {
  listeners.add(listener);
  attach();
  return () => { listeners.delete(listener); detach(); };
}
export function getNavigationSnapshot(): string {
  return currentLocation();
}
export function getServerNavigationSnapshot(): string { return '/'; }
export function getLastNavigationKind(): NavigationKind { return lastNavigationKind; }

/** Prefer this for imperative in-app navigation; do not use it to sign out. */
export function navigateTo(href: string, replace = false): void {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) { window.location.assign(url.href); return; }
  const resolved = resolveFocusedPath(url.pathname, url.hash);
  const destination = resolved + url.search + (resolved === url.pathname ? url.hash : '');
  if (destination === currentLocation()) return;
  if (replace) window.history.replaceState(window.history.state, '', destination);
  else window.history.pushState(window.history.state, '', destination);
  notify(replace ? 'replace' : 'push');
  // App scrolls only after the new route commits, so a lazy transition does
  // not jump the *old* page while its replacement is being fetched.
}
