/** Exact-origin CORS for Firebase Hosting -> Vercel. CORS is not authentication. */
export function allowGeminiOrigin(req, res, methods) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");

  const origin = req.headers.origin;
  if (!origin) return true;
  if (typeof origin !== "string") return false;

  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const host = req.headers.host;
  const sameOrigin =
    typeof host === "string" &&
    (origin === `https://${host}` ||
      (process.env.NODE_ENV !== "production" && origin === `http://${host}`));

  if (!sameOrigin && !allowed.includes(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  return true;
}
