import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOrionSubjectCatalog } from "../src/lib/orionSeedSubjectCatalog.ts";
import { canPrefillFromVerifiedTranscript } from "../src/lib/transcriptPrefillEligibility.ts";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const uid = "student_cp97_A";
const nineSubjects = [
  "Toán", "Ngữ văn", "Tiếng Anh", "Lịch sử",
  "Giáo dục quốc phòng và an ninh", "Vật lý", "Hóa học", "Sinh học", "Tin học",
];

test("CP97.01: verified empty Seed transcript still exposes the exact locked subject catalog to Orion", () => {
  const catalog = buildOrionSubjectCatalog({
    draftOwnerUid: uid, transcriptOwnerUid: uid, transcriptStatus: "empty",
    currentSubjects: nineSubjects,
  });
  assert.equal(Object.keys(catalog).length, 9);
  assert.equal(catalog.math, "Toán");
  assert.equal(catalog.literature, "Ngữ văn");
  assert.equal(catalog.english, "Tiếng Anh");
  assert.equal(catalog.physics, "Vật lý");
  assert.equal(catalog["seed:Tin học"], "Tin học");
  assert.equal(catalog["seed:Giáo dục quốc phòng và an ninh"], "Giáo dục quốc phòng và an ninh");
});

test("CP97.02: Orion catalog rejects mismatched owners, missing identity and unverified transcript states", () => {
  for (const changes of [
    { draftOwnerUid: "student_cp97_B" },
    { transcriptOwnerUid: "student_cp97_B" },
    { draftOwnerUid: "" },
    { transcriptOwnerUid: null },
    { transcriptStatus: "loading" },
    { transcriptStatus: "syncing" },
    { transcriptStatus: "error" },
    { transcriptStatus: "signed-out" },
    { currentSubjects: null },
  ]) {
    const input = {
      draftOwnerUid: uid, transcriptOwnerUid: uid, transcriptStatus: "ready",
      currentSubjects: nineSubjects, ...changes,
    };
    assert.deepEqual(buildOrionSubjectCatalog(input), {}, JSON.stringify(changes));
  }
});

test("CP97.03: empty curriculum can populate labels but never consumes the one-time grade prefill", () => {
  const emptyState = {
    draftOwnerUid: uid, transcriptOwnerUid: uid,
    draftStatus: "empty", transcriptStatus: "empty",
    seededOwnerUid: null, hasSupportedGrades: false, hasLocalEdits: false,
  };
  assert.equal(Object.keys(buildOrionSubjectCatalog({
    draftOwnerUid: uid, transcriptOwnerUid: uid, transcriptStatus: "empty",
    currentSubjects: nineSubjects,
  })).length, 9);
  assert.equal(canPrefillFromVerifiedTranscript(emptyState), false);
  assert.equal(canPrefillFromVerifiedTranscript({ ...emptyState, hasSupportedGrades: true }), false);
});

test("CP97.04: only same-owner, server-ready transcripts with observed supported grades can prefill once", () => {
  const ready = {
    draftOwnerUid: uid, transcriptOwnerUid: uid,
    draftStatus: "empty", transcriptStatus: "ready",
    seededOwnerUid: null, hasSupportedGrades: true, hasLocalEdits: false,
  };
  assert.equal(canPrefillFromVerifiedTranscript(ready), true);
  assert.equal(canPrefillFromVerifiedTranscript({ ...ready, seededOwnerUid: uid }), false);
  assert.equal(canPrefillFromVerifiedTranscript({ ...ready, hasLocalEdits: true }), false);
  assert.equal(canPrefillFromVerifiedTranscript({ ...ready, transcriptOwnerUid: "student_cp97_B" }), false);
});

test("CP97.05: Seed provider exposes profile and validated transcript as one authorized app context", () => {
  const provider = read("src/page/seed/hooks/StudentProfileProvider.tsx");
  const context = read("src/page/seed/hooks/StudentProfileContext.ts");
  const transcript = read("src/page/seed/hooks/useStudentTranscript.ts");
  assert.match(provider, /const verified = useStudentProfile\(\)/);
  assert.match(provider, /const transcript = useStudentTranscript\(\)/);
  assert.match(provider, /value=\{\{\.\.\.verified, transcript\}\}/);
  assert.match(context, /requires authorized StudentProfileProvider/);
  assert.match(transcript, /isServerConfirmedSnapshot\(snap\.metadata\)/);
  assert.match(transcript, /assessCanonicalTranscript\(raw, uid\)/);
  assert.ok(transcript.indexOf("assessCanonicalTranscript(raw, uid)") < transcript.indexOf("buildTranscriptView(raw)"));
});

test("CP97.06: Lumen uses verified Seed profile and blocks GPA scenarios without cross-document reconciliation", () => {
  const lumen = read("src/page/lumen/LumenPage.tsx");
  const gpa = read("src/page/seed/hooks/useAcademicGpaIntegrity.ts");
  assert.match(lumen, /useVerifiedStudentProfile\(\)/);
  assert.match(lumen, /useAcademicGpaIntegrity\(\)/);
  assert.match(lumen, /gpaIntegrity\.status === "VERIFIED"/);
  assert.match(lumen, /gpaIntegrity\.result\.derived\.overall === profile\.gpaOverall/);
  assert.match(lumen, /typeof gpaIntegrity\.result\?\.derived\?\.overall === "number"/);
  assert.match(lumen, /cognitive\.scoreAvailable === true/);
  assert.match(gpa, /auditAcademicGpa\(uid, values\.learning_profiles, values\.student_transcripts\)/);
  assert.match(gpa, /isServerConfirmedSnapshot\(snapshot\.metadata\)/);
});

test("CP97.07: Orion accepts a verified empty curriculum while score prefill stays ready-only", () => {
  const page = read("src/page/orion/OrionPage.tsx");
  const helper = read("src/lib/orionSeedSubjectCatalog.ts");
  assert.match(page, /buildOrionSubjectCatalog\(\{/);
  assert.match(page, /canPrefillFromVerifiedTranscript\(\{/);
  assert.match(helper, /\["ready", "empty"\]\.includes\(input\.transcriptStatus\)/);
  assert.match(page, /getLatestSubjectGrades\(transcript\.data\)/);
});

test("CP97.08: Atlas imports only complete same-term Seed school marks and never treats them as official THPT", () => {
  const adapter = read("src/lib/seedAtlasScoreAdapter.ts");
  const page = read("src/page/atlas/components/AtlasAdmissionEnginePanel.tsx");
  assert.match(adapter, /row\.status === "COMPLETE" && row\.average !== null/);
  assert.match(adapter, /candidates\.find\(item => item\.availableCombinations\.length > 0\)/);
  assert.match(page, /transcript\.status !== "ready"/);
  assert.match(page, /setScoreBasis\("school"\)/);
  assert.match(page, /scoreBasis === "official_thpt_2026"\s*&& importedSeedKeys\.length === 0/);
});

test("CP97.09: Haven prefill is same-owner, ready-only and yields to manual student edits", () => {
  const page = read("src/page/haven/HavenPage.tsx");
  assert.match(page, /canPrefillFromVerifiedTranscript\(\{/);
  assert.match(page, /transcriptOwnerUid: transcript\.userId/);
  assert.match(page, /transcriptStatus: transcript\.status/);
  assert.match(page, /hasLocalEdits: localInputEdited\.current/);
  assert.match(page, /localInputEdited\.current = true/);
  assert.match(page, /hasSupportedGrades: yearly\.length > 0 \|\|/);
});

test("CP97.10: Gemini explanation remains optional, authenticated and server-secret backed", () => {
  const hook = read("src/page/lumen/hooks/useLumenIntelligence.ts");
  const client = read("src/lib/geminiLumenClient.ts");
  const api = read("api/gemini-lumen.ts");
  const functions = read("functions-gemini/index.mjs");
  assert.match(hook, /cognitive\.scoreAvailable !== true/);
  assert.match(client, /getIdToken\(user\)/);
  assert.match(client, /auth\.currentUser\?\.uid !== user\.uid/);
  assert.match(client, /Authorization: `Bearer \$\{token\}`/);
  assert.match(api, /verifyFirebaseUser\(token, firebaseWebKey\)/);
  assert.match(api, /checkActiveAccount\(token, firebaseProjectId, uid\)/);
  assert.match(api, /enforceInstanceLimit\(uid\)/);
  assert.match(functions, /defineSecret\('GEMINI_API_KEY'\)/);
  assert.match(functions, /defineSecret\('FIREBASE_WEB_API_KEY'\)/);
  assert.doesNotMatch(functions, /VITE_GEMINI_API_KEY/);
});
