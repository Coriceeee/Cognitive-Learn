/** Exact-origin CORS for Firebase Hosting -> Vercel. CORS is not authentication. */
export function allowGeminiOrigin(req, res, methods) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");

  const origin = req.headers.origin;
  if (!origin) return true;
  if (typeof origin !== "string") return false;

  // Canonical production origins are part of the application contract.
  // Keep this list exact-origin only so a missing Vercel env var cannot break
  // Firebase Hosting preflights immediately before a live demo.
  const builtInAllowedOrigins = [
    "https://cognitivelearn.ai.vn",
    "https://cognitive-learn-ai.web.app",
    "https://cognitive-learn-ai.firebaseapp.com",
  ];
  const configuredAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const allowed = new Set([...builtInAllowedOrigins, ...configuredAllowedOrigins]);
  const host = req.headers.host;
  const sameOrigin =
    typeof host === "string" &&
    (origin === `https://${host}` ||
      (process.env.NODE_ENV !== "production" && origin === `http://${host}`));

  if (!sameOrigin && !allowed.has(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  return true;
}
