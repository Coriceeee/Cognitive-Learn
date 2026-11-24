/** Public only for pure path matching and safe local tests. */
export const GEMINI_ROUTES = Object.freeze({
  '/api/gemini-chat': 'chat',
  '/api/gemini-lumen': 'lumen',
  '/api/gemini-admission-reader': 'admission',
});
export const GEMINI_STATUS = '/api/cla-gemini-status';
export function routeName(path) {
  if (typeof path !== 'string') return null;
  let url;
  try { url = new URL(path, 'https://cla.invalid'); } catch { return null; }
  return Object.hasOwn(GEMINI_ROUTES, url.pathname) ? GEMINI_ROUTES[url.pathname] : null;
}
export function shouldReturnStatus(path) {
  try { return new URL(path, 'https://cla.invalid').pathname === GEMINI_STATUS; }
  catch { return false; }
}
