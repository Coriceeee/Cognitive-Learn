import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveDraftUiStatus } from "../src/lib/moduleUiStatus.ts";
import { canPrefillFromVerifiedTranscript } from "../src/lib/transcriptPrefillEligibility.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const store = read("src/lib/localOrionDraftStore.ts");
const hook = read("src/lib/useModuleDraft.ts");
const page = read("src/page/orion/OrionPage.tsx");

test("Orion local fallback is restricted to Vite development on HTTP loopback", () => {
  assert.ok(store.includes("import.meta.env.DEV"));
  assert.ok(store.includes('window.location.protocol === "http:"'));
  assert.ok(store.includes('"localhost", "127.0.0.1", "[::1]"'));
});

test("Orion local storage is UID-scoped IndexedDB with revision compare-and-swap", () => {
  assert.ok(store.includes("indexedDB.open"));
  assert.ok(store.includes('keyPath: "uid"'));
  assert.ok(store.includes("currentRevision !== expectedRevision"));
  assert.ok(store.includes("new DraftConflictError()"));
  assert.ok(!store.includes("localStorage") && !store.includes("sessionStorage"));
});

test("Orion local fallback requires an active account and product consent", () => {
  assert.ok(hook.includes("accountData.active !== true"));
  assert.ok(hook.includes("consentData.productAccepted === true"));
  assert.ok(hook.includes('consentData.noticeVersion === "cla-student-privacy-v1"'));
  assert.ok(hook.includes('moduleName === "orion" && canUseLocalOrionDraftFallback()'));
});

test("Local persistence never claims cloud synchronization", () => {
  const saved = resolveDraftUiStatus({status:"local", conflict:false, saving:false, autosave:"saved"});
  assert.equal(saved.tone, "warning");
  assert.equal(saved.label, "Đã tự lưu trên thiết bị");
  assert.match(saved.message, /chưa đồng bộ lên máy chủ/);
  assert.ok(page.includes("isLocalOnly()"));
});

test("A pending local save is not presented as a completed save", () => {
  const pending = resolveDraftUiStatus({status:"local", conflict:false, saving:true});
  assert.equal(pending.tone, "loading");
  assert.equal(pending.label, "Đang lưu cục bộ");
});

test("Verified Seed grades may prefill an empty local-only Orion draft", () => {
  const state = {
    draftOwnerUid:"student-a", transcriptOwnerUid:"student-a",
    draftStatus:"local", transcriptStatus:"ready",
    seededOwnerUid:null, hasSupportedGrades:true, hasLocalEdits:false,
  };
  assert.equal(canPrefillFromVerifiedTranscript(state), true);
  assert.equal(canPrefillFromVerifiedTranscript({...state, transcriptOwnerUid:"student-b"}), false);
});

test("Orion autosave and explicit save controls accept local-only status", () => {
  assert.ok(page.includes('saveStatus !== "empty" && saveStatus !== "local"'));
  assert.ok(page.includes('disabled={saving || (saveStatus !== "ready" && saveStatus !== "empty" && saveStatus !== "local")}'));
});
