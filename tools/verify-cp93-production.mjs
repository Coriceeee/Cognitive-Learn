/**
 * CP98 release smoke: Firebase Hosting -> Vercel status JSON and API preflight.
 * Reads only public VITE_API_BASE_URL from .env.live.local; no secrets are printed.
 */
import { readFileSync } from "node:fs";

let envFile = "";
try { envFile = readFileSync(".env.live.local", "utf8"); } catch {}
const match = envFile.match(/^\s*VITE_API_BASE_URL\s*=\s*(.*?)\s*$/m);
const base = (process.env.CLA_GEMINI_API_BASE_URL || match?.[1] || "")
  .trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
let apiUrl = null;
try { apiUrl = new URL(base); } catch {}
const approvedHost = apiUrl && (
  apiUrl.hostname.endsWith(".vercel.app")
);
if (!apiUrl || apiUrl.protocol !== "https:" || apiUrl.username || apiUrl.password
  || apiUrl.port || apiUrl.pathname !== "/" || apiUrl.search || apiUrl.hash || !approvedHost) {
  console.error("CP98 CONFIG FAIL: set VITE_API_BASE_URL to the actual Production .vercel.app URL of the CLA Vercel project in .env.live.local. Do not use cognitivelearn.ai.vn here.");
  process.exit(2);
}

const origins = [
  "https://cognitivelearn.ai.vn",
  "https://cognitive-learn-ai.web.app",
  "https://cognitive-learn-ai.firebaseapp.com",
];
const postRoutes = [
  "/api/gemini-chat",
  "/api/gemini-lumen",
  "/api/gemini-admission-reader",
  "/api/public-source-search",
];
let failed = false;
for (const origin of origins) {
  try {
    const response = await fetch(base + "/api/cla-gemini-status", {
      headers: { origin, "cache-control": "no-cache" },
      signal: AbortSignal.timeout(15000),
    });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let body = null;
    try { body = JSON.parse(raw); } catch {}
    const cors = response.headers.get("access-control-allow-origin");
    const statusPassed = response.ok && contentType.toLowerCase().includes("application/json")
      && cors === origin && body?.ok === true && body?.configured === true
      && body?.backend === "Vercel Functions";
    console.log(JSON.stringify({
      check: "status", origin, httpStatus: response.status, contentType, cors,
      configured: body?.configured ?? false, backend: body?.backend ?? null, passed: statusPassed,
    }));
    if (!statusPassed) failed = true;
  } catch (error) {
    console.log(JSON.stringify({ check: "status", origin, reachable: false, error: error?.name ?? "unknown", passed: false }));
    failed = true;
  }

  for (const route of postRoutes) {
    try {
      const response = await fetch(base + route, {
        method: "OPTIONS",
        headers: {
          origin,
          "access-control-request-method": "POST",
          "access-control-request-headers": "authorization,content-type",
        },
        signal: AbortSignal.timeout(12000),
      });
      const allowOrigin = response.headers.get("access-control-allow-origin");
      const allowMethods = response.headers.get("access-control-allow-methods") || "";
      const allowHeaders = response.headers.get("access-control-allow-headers") || "";
      const passed = response.status === 204 && allowOrigin === origin
        && allowMethods.includes("POST")
        && /authorization/i.test(allowHeaders) && /content-type/i.test(allowHeaders);
      console.log(JSON.stringify({ check: "preflight", origin, route, httpStatus: response.status, allowOrigin, passed }));
      if (!passed) failed = true;
    } catch (error) {
      console.log(JSON.stringify({ check: "preflight", origin, route, reachable: false, error: error?.name ?? "unknown", passed: false }));
      failed = true;
    }
  }
}
if (failed) {
  console.error("CP98 VERCEL SMOKE FAIL: check Vercel Environment Variables, API routes and exact CORS_ALLOWED_ORIGINS.");
  process.exitCode = 1;
} else {
  console.log("CP98 VERCEL SMOKE PASS: status JSON and all four API preflights passed for all Firebase Hosting origins.");
}
