const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("CP35-01: student navigation opens focused pages and preserves the six student modules", () => {
  const app = read("src/App.tsx");
  const nav = read("src/components/common/ModuleSectionNav.tsx");
  const access = read("src/components/common/AccessGate.tsx");
  const routes = [
    "/atlas/vietnam", "/atlas/study-abroad", "/atlas/joint", "/atlas/recommendations", "/atlas/sources",
    "/lumen/indices", "/lumen/history", "/lumen/insights", "/lumen/assistant",
    "/orion/inputs", "/orion/scenarios", "/orion/roadmap",
    "/pulse/progress", "/pulse/reports", "/pulse/actions",
    "/haven/scholarships", "/haven/finance", "/haven/plan",
  ];
  for (const route of routes) {
    assert.ok(app.includes(`"${route}"`), `App route missing: ${route}`);
    assert.ok(access.includes(`"${route}"`), `Student allowlist missing: ${route}`);
  }
  assert.match(nav, /cla-module-subnav-links/);
  assert.match(nav, /href=\{item\.href\}/);
  assert.doesNotMatch(nav, /items\.slice\(0, 3\)/);
  assert.doesNotMatch(access, /return role === "student"/);
});

test("CP35-02: PTIT is an explicitly scoped sample, never a default school recommendation", () => {
  const dashboard = read("src/page/seed/data/studentDashboardData.ts");
  const atlas = read("src/page/atlas/AtlasPage.tsx");
  const explorer = read("src/page/atlas/components/OfficialAdmissionsExplorer.tsx");
  const engine = read("src/page/atlas/components/AtlasAdmissionEnginePanel.tsx");
  assert.doesNotMatch(dashboard, /Ưu tiên PTIT/);
  assert.match(dashboard, /Chưa xếp hạng trường/);
  assert.match(atlas, /cla-evidence-sample/);
  assert.match(explorer, /cla-major-history-disclosure/);
  assert.match(explorer, /không đại diện toàn bộ tuyển sinh Việt Nam|PTIT BVH/);
  assert.match(engine, /math: ""/);
  // Step 06: a complete 3-subject combination replaces the obsolete all-8-subject gate.
  assert.match(engine, /completeCombinations\.length > 0/);
  assert.match(engine, /Chưa đủ 3 môn/);
  assert.match(engine, /scoreBasis === "official_thpt_2026"/);
});

test("CP35-03: study-abroad starts with no country selected and preserves country selection across subpages", () => {
  const study = read("src/page/study-abroad/StudyAbroadPage.tsx");
  const app = read("src/App.tsx");
  const access = read("src/components/common/AccessGate.tsx");
  assert.ok(study.includes('get("country") || ""'));
  assert.match(study, /<option value="">Chọn quốc gia\/vùng lãnh thổ/);
  assert.ok(!study.includes('useState("SG")'));
  assert.ok(study.includes("/atlas/study-abroad/programs"));
  assert.ok(study.includes("/atlas/study-abroad/requirements"));
  assert.ok(study.includes("/atlas/study-abroad/sources"));
  assert.ok(app.includes('path.startsWith("/atlas/study-abroad/")'));
  assert.ok(access.includes('"/atlas/study-abroad/programs"'));
});

test("CP35-04: student data status and transcript screens do not expose backend collection names", () => {
  const storage = read("src/page/seed/StudentStorageStatusPage.tsx");
  const transcript = read("src/page/seed/StudentTranscriptPage.tsx");
  const student = read("src/page/seed/StudentPage.tsx");
  assert.match(storage, /Dữ liệu của tôi/);
  assert.doesNotMatch(storage, /projectId|Firestore|row\.collection|row\.details|<code>/);
  assert.ok(!transcript.includes("learning_profiles/{uid}") && !transcript.includes("student_transcripts/{uid}"));
  assert.match(transcript, /Bảng điểm đã được lưu trong hồ sơ/);
  assert.doesNotMatch(student, /StudentLinkManager|SharedReportPanel|Mã kết nối/);
});

test("CP35-05: Admin-only system tools remain outside the student route allowlist", () => {
  const access = read("src/components/common/AccessGate.tsx");
  const catalog = read("src/data/moduleSubmodules.ts");
  const pulse = read("src/page/pulse/PulsePage.tsx");
  const atlas = read("src/page/atlas/AtlasPage.tsx");
  const student = catalog.split("export const studentSubmoduleDirectory:")[1].split("export function getStudentSubmodules")[0];
  assert.doesNotMatch(student, /Nexus Core|Kiểm tra dữ liệu liên thông|Công cụ đọc đề án|Knowledge Base|Evidence Record/);
  assert.match(pulse, /isAdmin && <section id="pulse-pipeline"/);
  assert.match(atlas, /isAdmin && <>/);
  assert.ok(access.includes('if (role === "admin") return true'));
  assert.ok(access.includes("studentAllowedRoutes.has(normalized)"));
});

test("CP35-06: official source register distinguishes method-verified entries from archive-only sources", () => {
  const data = read("src/data/officialAdmissionSources.ts");
  const registry = read("src/page/atlas/components/AtlasOfficialSourceRegistry.tsx");
  const atlas = read("src/page/atlas/AtlasPage.tsx");
  for (const id of ["hcmus", "uit", "hcmut"]) assert.match(data, new RegExp(`id: "${id}"`));
  assert.match(data, /detailsStatus: "institution_method_verified"/);
  assert.match(data, /detailsStatus: "official_archive_only"/);
  assert.match(registry, /methodVerifiedCount/);
  assert.match(registry, /archiveOnlyCount/);
  assert.match(registry, /không phải toàn bộ đại học Việt Nam/);
  assert.ok(atlas.includes("<AtlasOfficialSourceRegistry />"));
});

test("CP35-07: focused pages use the shared CLA design layer and SPA rewrites", () => {
  const css = read("src/styles/24-cla-subpages-ui.css");
  const styles = read("src/styles.css");
  const vercel = JSON.parse(read("vercel.json"));
  assert.ok(styles.includes("24-cla-subpages-ui.css"));
  assert.ok(css.includes(".cla-focus-nav"));
  assert.doesNotMatch(css, /\[data-cla-route=/);
  for (const [route, page] of [["/atlas/vietnam", "atlas/AtlasPage"], ["/lumen/history", "lumen/LumenPage"], ["/orion/scenarios", "orion/OrionPage"], ["/pulse/reports", "pulse/PulsePage"], ["/haven/finance", "haven/HavenPage"]]) {
    assert.ok(read(`src/page/${page}.tsx`).includes(`view === "${route}"`), `React route guard missing ${route}`);
    assert.ok(vercel.rewrites.some(item => item.source === route && item.destination === "/index.html"), `SPA rewrite missing ${route}`);
  }
});

test("CP35-08: Seed profile uses the full ISO country catalog instead of a seven-country shortlist", () => {
  const profile = read("src/page/seed/StudentProfilePage.tsx");
  const catalog = read("src/data/globalCountryCatalog.ts");
  assert.ok(profile.includes('import { countryCatalog } from "../../data/globalCountryCatalog"'));
  assert.ok(profile.includes("countryCatalog.map((country)"));
  assert.ok(!profile.includes("<option>Singapore</option>"));
  assert.ok(catalog.includes('"code": "AF"'));
  assert.ok(catalog.includes('"code": "VN"'));
  assert.ok(catalog.includes('"code": "ZW"'));
});
