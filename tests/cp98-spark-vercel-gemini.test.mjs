import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import statusHandler from "../api/cla-gemini-status.ts";
import { allowGeminiOrigin } from "../server/geminiCors.ts";
import { resolveGeminiApiBaseUrl } from "../src/lib/geminiApiBase.ts";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const ORIGINS = ["https://cognitivelearn.ai.vn", "https://cognitive-learn-ai.web.app", "https://cognitive-learn-ai.firebaseapp.com"];
function mockResponse() {
  return { headers: {}, statusCode: 200, body: undefined, ended: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }, end() { this.ended = true; return this; } };
}

test("CP98.01 Firebase Hosting resolves Gemini API to an approved HTTPS Vercel origin", () => {
  assert.equal(resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "https://cla-api-example.vercel.app" }), "https://cla-api-example.vercel.app");
  assert.throws(() => resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "" }), /VITE_API_BASE_URL/i);
  assert.throws(() => resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "http://cla-api-example.vercel.app" }), /HTTPS origin/);
  assert.throws(() => resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "https://attacker.example" }), /domain Vercel/);
  assert.throws(() => resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "https://cla-api-example.vercel.app/path" }), /không chứa đường dẫn/);\n  assert.throws(() => resolveGeminiApiBaseUrl({ hostname: "cognitivelearn.ai.vn", protocol: "https:", isDev: false, baseUrl: "https://cla-api-example.vercel.app:8443" }), /HTTPS origin/);
});

test("CP98.02 localhost never forwards Firebase ID tokens to a stale remote URL", () => {
  assert.equal(resolveGeminiApiBaseUrl({ hostname: "localhost", protocol: "http:", isDev: true, baseUrl: "https://cla-api-example.vercel.app" }), "");
  assert.equal(resolveGeminiApiBaseUrl({ hostname: "127.0.0.1", protocol: "http:", isDev: true, baseUrl: "" }), "");
});

test("CP98.03 Vercel-hosted SPA uses same-origin APIs and all Firebase clients share one resolver", () => {
  assert.equal(resolveGeminiApiBaseUrl({ hostname: "cla-api-example.vercel.app", protocol: "https:", isDev: false, baseUrl: "" }), "");
  for (const path of ["src/components/common/FloatingAdvisorChat.tsx", "src/lib/geminiLumenClient.ts", "src/lib/geminiAdmissionClient.ts"]) {
    const source = read(path);
    assert.match(source, /getGeminiApiBaseUrl\(\)/);
    assert.doesNotMatch(source, /Cloud Functions Gemini|Firebase Functions Gemini/);
  }
});

test("CP98.04 exact-origin CORS allows configured Firebase origins and same-origin Vercel only", () => {
  const old = process.env.CORS_ALLOWED_ORIGINS;
  const oldNodeEnv = process.env.NODE_ENV;
  process.env.CORS_ALLOWED_ORIGINS = ORIGINS.join(",");
  process.env.NODE_ENV = "production";
  try {
    for (const origin of ORIGINS) {
      const res = mockResponse();
      assert.equal(allowGeminiOrigin({ method: "POST", headers: { origin, host: "cla-api-example.vercel.app" } }, res, "POST, OPTIONS"), true);
      assert.equal(res.headers["access-control-allow-origin"], origin);
      assert.equal(res.headers["access-control-allow-credentials"], undefined);
    }
    const denied = mockResponse();
    assert.equal(allowGeminiOrigin({ method: "POST", headers: { origin: "https://attacker.example", host: "cla-api-example.vercel.app" } }, denied, "POST, OPTIONS"), false);
    const same = mockResponse();
    assert.equal(allowGeminiOrigin({ method: "POST", headers: { origin: "https://cla-api-example.vercel.app", host: "cla-api-example.vercel.app" } }, same, "POST, OPTIONS"), true);
  } finally {
    if (old === undefined) delete process.env.CORS_ALLOWED_ORIGINS; else process.env.CORS_ALLOWED_ORIGINS = old;
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNodeEnv;
  }
});

test("CP98.05 status endpoint returns configuration flags only and never leaks secrets", () => {
  const keys = ["GEMINI_API_KEY", "FIREBASE_WEB_API_KEY", "FIREBASE_PROJECT_ID", "GEMINI_MODEL", "CORS_ALLOWED_ORIGINS"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.GEMINI_API_KEY = "secret-test-value";
  process.env.FIREBASE_WEB_API_KEY = "firebase-test-key";
  process.env.FIREBASE_PROJECT_ID = "cognitive-learn-ai";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
  process.env.CORS_ALLOWED_ORIGINS = ORIGINS.join(",");
  try {
    const res = mockResponse();
    statusHandler({ method: "GET", headers: { origin: ORIGINS[0], host: "cla-api-example.vercel.app" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.configured, true);
    assert.equal(res.body.backend, "Vercel Functions");
    assert.deepEqual(res.body.missing, []);
    assert.equal(JSON.stringify(res.body).includes("secret-test-value"), false);
    assert.equal(res.headers["access-control-allow-origin"], ORIGINS[0]);
    const missing = mockResponse();
    delete process.env.GEMINI_API_KEY;
    statusHandler({ method: "GET", headers: { host: "cla-api-example.vercel.app" } }, missing);
    assert.equal(missing.body.configured, false);
    assert.ok(missing.body.missing.includes("GEMINI_API_KEY"));
  } finally {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
  }
});

test("CP98.06 all Gemini endpoints share CORS and retain Firebase authentication", () => {
  for (const path of ["api/gemini-chat.ts", "api/gemini-lumen.ts", "api/gemini-admission-reader.ts", "api/cla-gemini-status.ts"]) assert.match(read(path), /allowGeminiOrigin\(/);
  assert.match(read("api/gemini-chat.ts"), /authenticatedRole\(bearer\[1\], firebaseKey, project\)/);
  assert.match(read("api/gemini-lumen.ts"), /verifyFirebaseUser\(token, firebaseWebKey\)/);
  assert.match(read("api/gemini-admission-reader.ts"), /lookupFirebaseUser\(token, firebaseWebKey\)/);
  for (const path of ["api/gemini-chat.ts", "api/gemini-lumen.ts", "api/gemini-admission-reader.ts"]) {
    assert.match(read(path), /process\.env\.GEMINI_API_KEY/);
    assert.doesNotMatch(read(path), /VITE_GEMINI_API_KEY/);
  }
  for (const path of ["src/components/common/FloatingAdvisorChat.tsx", "src/lib/geminiLumenClient.ts", "src/lib/geminiAdmissionClient.ts"]) assert.doesNotMatch(read(path), /GEMINI_API_KEY/);
});

test("CP98.07 Spark deploy is Hosting-only and preflights Vercel", () => {
  const deploy = read("DEPLOY_CLA_SPARK_HOSTING.cmd");
  assert.match(deploy, /verify-cp93-production\.mjs/);
  assert.match(deploy, /firebase deploy --only hosting/);
  assert.doesNotMatch(deploy, /firebase deploy --only functions/);
  assert.match(deploy, /vercel_failed/);\n  assert.match(read("tools/verify-cp93-production.mjs"), /approvedHost/);
  const guide = read("docs/CP98_SPARK_VERCEL_GEMINI_RELEASE.md");
  assert.match(guide, /Firebase Spark/);
  assert.match(guide, /CORS_ALLOWED_ORIGINS/);
  assert.match(guide, /VITE_API_BASE_URL/);
  assert.match(guide, /GEMINI_API_KEY/);
});

test("CP98.08 Vercel API directory contains only real route handlers, shared utilities live outside api", () => {
  const apiFiles = readdirSync(new URL("../api/", import.meta.url));
  assert.equal(apiFiles.includes("geminiTransport.ts"), false);
  assert.equal(apiFiles.includes("vercelTypes.ts"), false);
  assert.ok(readdirSync(new URL("../server/", import.meta.url)).includes("geminiTransport.ts"));
  assert.ok(readdirSync(new URL("../server/", import.meta.url)).includes("vercelTypes.ts"));
});
