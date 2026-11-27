/**
 * CP98 production smoke check for Firebase Hosting -> Vercel Gemini API.
 * Reads only public VITE_API_BASE_URL from .env.live.local; no secrets are printed.
 */
import { readFileSync } from "node:fs";
let envFile = "";
try { envFile = readFileSync(".env.live.local", "utf8"); } catch {}
const match = envFile.match(/^\s*VITE_API_BASE_URL\s*=\s*(.*?)\s*$/m);
const base = (process.env.CLA_GEMINI_API_BASE_URL || match?.[1] || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
if (!/^https:\/\/[^/?#]+$/.test(base)) {
  console.error("CP98 CONFIG FAIL: add VITE_API_BASE_URL=https://<your-project>.vercel.app to .env.live.local.");
  process.exit(2);
}
const origins = ["https://cognitivelearn.ai.vn", "https://cognitive-learn-ai.web.app", "https://cognitive-learn-ai.firebaseapp.com"];
let failed = false;
for (const origin of origins) {
  try {
    const response = await fetch(base + "/api/cla-gemini-status", { headers: { origin, "cache-control": "no-cache" }, signal: AbortSignal.timeout(15000) });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let body = null;
    try { body = JSON.parse(raw); } catch {}
    const cors = response.headers.get("access-control-allow-origin");
    const passed = response.ok && contentType.toLowerCase().includes("application/json") && cors === origin
      && body?.ok === true && body?.configured === true && body?.backend === "Vercel Functions";
    console.log(JSON.stringify({ origin, httpStatus: response.status, contentType, cors, configured: body?.configured ?? false, backend: body?.backend ?? null, passed }));
    if (!passed) failed = true;
  } catch (error) {
    console.log(JSON.stringify({ origin, reachable: false, error: error?.name ?? "unknown", passed: false }));
    failed = true;
  }
}
if (failed) {
  console.error("CP98 VERCEL SMOKE FAIL: check Vercel Environment Variables, deployment and exact CORS_ALLOWED_ORIGINS.");
  process.exitCode = 1;
} else console.log("CP98 VERCEL SMOKE PASS.");
