/**
 * CP93 production smoke check. Read-only: never sends student data or secrets.
 * Both Firebase Hosting domains must route the public status endpoint to the
 * dedicated Gemini Gen2 Function and report configured secrets.
 */
const hosts = [
  "https://cognitive-learn-ai.web.app/api/cla-gemini-status",
  "https://cognitivelearn.ai.vn/api/cla-gemini-status",
];
let failed = false;
for (const url of hosts) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(15000),
    });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    let body = null;
    try { body = JSON.parse(raw); } catch {}
    const passed = response.ok &&
      contentType.toLowerCase().includes("application/json") &&
      body?.ok === true &&
      body?.configured === true &&
      body?.backend === "Firebase Functions Gen2";
    console.log(JSON.stringify({
      url,
      httpStatus: response.status,
      contentType,
      ok: body?.ok ?? false,
      configured: body?.configured ?? false,
      backend: body?.backend ?? null,
      passed,
    }));
    if (!passed) failed = true;
  } catch (error) {
    console.log(JSON.stringify({ url, reachable: false, error: error?.name ?? "unknown", passed: false }));
    failed = true;
  }
}
if (failed) {
  console.error("CP93 PRODUCTION SMOKE FAIL: Hosting rewrite, Function deployment, or Firebase secrets are not ready. Do not mark Gemini production complete.");
  process.exitCode = 1;
} else {
  console.log("CP93 PRODUCTION SMOKE PASS: both Hosting domains route to configured Firebase Functions Gen2.");
}
