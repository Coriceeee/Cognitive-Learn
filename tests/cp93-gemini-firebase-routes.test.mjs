import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const hosting = JSON.parse(read("firebase.json"));
const vercel = JSON.parse(read("vercel.json"));

test("CP93 migration: Firebase stays Hosting-only and has no Gemini Functions rewrite", () => {
  assert.equal(Object.hasOwn(hosting, "functions"), false);
  assert.ok(hosting.hosting.rewrites.every(route => !route.function));
  assert.deepEqual(hosting.hosting.rewrites.at(-1), { source: "**", destination: "/index.html" });
  assert.equal(vercel.framework, "vite");
  assert.equal(vercel.outputDirectory, "dist");
  assert.equal(vercel.functions["api/*.ts"].maxDuration, 45);
});

test("CP93 migration: Gemini endpoints and status are Vercel function files", () => {
  for (const path of ["api/gemini-chat.ts", "api/gemini-lumen.ts", "api/gemini-admission-reader.ts", "api/cla-gemini-status.ts"]) assert.match(read(path), /export default/);
  assert.match(read("api/cla-gemini-status.ts"), /backend: "Vercel Functions"/);
});

test("CP93 migration: legacy Firebase Functions scripts are fail-safe and deprecated", () => {
  assert.match(read("DEPLOY_CLA_CP93_FIREBASE_GEMINI.cmd"), /DEPRECATED/);
  assert.match(read("DEPLOY_CLA_CP93_FIREBASE_GEMINI.ps1"), /DEPRECATED/);
  assert.match(read("BUILD_CLA_CP93_FIREBASE_GEMINI.cmd"), /DEPRECATED/);
  const deploy = read("DEPLOY_CLA_SPARK_HOSTING.cmd");
  assert.match(deploy, /firebase deploy --only hosting --project cognitive-learn-ai/);
  assert.doesNotMatch(deploy, /firebase deploy --only functions/);
  assert.doesNotMatch(deploy, /firebase deploy --only firestore/);
});
