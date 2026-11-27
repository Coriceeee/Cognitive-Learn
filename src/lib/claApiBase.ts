/** Resolve the only approved CLA API destination. */
export type ClaApiBaseInput = Readonly<{ hostname: string; protocol: string; isDev: boolean; baseUrl?: string }>; 
const FIREBASE_HOSTS = new Set(["cognitivelearn.ai.vn", "cognitive-learn-ai.web.app", "cognitive-learn-ai.firebaseapp.com"]);
const isLoopback = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";
const approvedApiHost = (hostname: string) => hostname.endsWith(".vercel.app");

export function resolveClaApiBaseUrl(input: ClaApiBaseInput): string {
  const hostname = input.hostname.toLowerCase();
  // Never forward local Firebase ID tokens to a remote API because of stale env values.
  if (input.isDev && input.protocol === "http:" && isLoopback(hostname)) return "";
  const raw = (input.baseUrl ?? "").trim();
  if (!raw) {
    if (FIREBASE_HOSTS.has(hostname)) throw new Error("Website Firebase chưa cấu hình VITE_API_BASE_URL trỏ đến backend Vercel.");
    return "";
  }
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("VITE_API_BASE_URL không phải URL hợp lệ."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || (url.pathname !== "" && url.pathname !== "/") || url.search || url.hash) {
    throw new Error("VITE_API_BASE_URL phải là HTTPS origin, không chứa đường dẫn, thông tin đăng nhập hoặc query.");
  }
  if (!approvedApiHost(url.hostname.toLowerCase())) throw new Error("VITE_API_BASE_URL phải trỏ đến domain Production .vercel.app của dự án CLA trên Vercel; không dùng domain website cognitivelearn.ai.vn.");
  return url.origin;
}

export function getClaApiBaseUrl(): string {
  const location = typeof window !== "undefined" ? window.location : null;
  return resolveClaApiBaseUrl({ hostname: location?.hostname ?? "", protocol: location?.protocol ?? "", isDev: import.meta.env.DEV, baseUrl: import.meta.env.VITE_API_BASE_URL });
}
