import test from "node:test";
import assert from "node:assert/strict";
import { officialUniversities, findOfficialUniversities } from "../src/data/officialAdmissionSources.ts";
import { verifiedPrograms, parseScore30, historicalGap } from "../src/data/verifiedAdmissionPrograms.ts";
import { internationalRoutes } from "../src/data/internationalPathways.ts";
import { countryCatalog, findCountry, searchCountries } from "../src/data/globalCountryCatalog.ts";
import { domesticInternationalPrograms } from "../src/data/domesticInternationalPrograms.ts";
import { ADVISOR_PAGE_CONTEXTS, advisorPageContextFromPath, advisorSuggestionsFor, normaliseAdvisorHistory, prepareAdvisorMessage, routeAdvisorQuestion, safeAdvisorDestination, safeAdvisorPageContext } from "../src/lib/advisorChatPolicy.ts";
import { readFileSync } from "node:fs";

test("CP25-01: Curated universities each link 2024, 2025, 2026", () => {
  assert.equal(officialUniversities.length, 4);
  for (const item of officialUniversities) {
    assert.deepEqual(item.years.map(entry => entry.year).sort(), [2024, 2025, 2026]);
    for (const year of item.years) {
      assert.match(year.schemeUrl, /^https:\/\//);
      assert.ok(year.methods.length || year.detailsStatus === "official_archive_only");
      assert.ok(!year.schemeUrl.includes("example.com"));
    }
    assert.match(item.portalUrl, /^https:\/\//);
  }
});
test("CP25-02: Year-specific PTIT pathways do not leak year-specific methods", () => {
  const ptit = officialUniversities.find(s => s.id === "ptit");
  assert.ok(ptit);
  assert.equal(ptit.years.find(y => y.year === 2024).methods.includes("SAT_ACT"), true);
  assert.equal(ptit.years.find(y => y.year === 2026).methods.includes("NGOAI_NGU_KET_HOP"), true);
});
test("CP25-03: Exact campus and method provenance on historical cutoffs", () => {
  assert.equal(verifiedPrograms.length, 10);
  for (const item of verifiedPrograms) {
    assert.equal(item.campus, "BVH");
    assert.equal(item.historicalCutoffs.length, 2);
    assert.deepEqual(item.historicalCutoffs.map(c => c.year), [2024, 2025]);
    assert.ok(item.historicalCutoffs.every(c => c.admissionTrack === "THPT" && c.cutoff >= 0 && c.cutoff <= 30));
    assert.ok(!item.historicalCutoffs.some(c => c.year === 2026));
    assert.match(item.source2026, /^https:\/\/tuyensinh.ptit.edu.vn/);
  }
});
test("CP25-04: Score conversion accepts actual zero but not missing or invalid inputs", () => {
  assert.equal(parseScore30("0"), 0);
  assert.equal(parseScore30("25,50"), 25.5);
  assert.equal(parseScore30("30"), 30);
  for (const bad of ["", "31", "-1", "26.999", "NaN", "1e1", "10,3.4"]) assert.equal(parseScore30(bad), null);
});
test("CP25-05: Historical gap is arithmetic, never chance-of-admission", () => {
  assert.equal(historicalGap(25, 26.4), -1.4);
  assert.equal(historicalGap(26, 25.8), .2);
});
test("CP25-06: Discovery matches year/method without inventing unsupported methods", () => {
  assert.equal(findOfficialUniversities("Công nghệ", 2026).some(s => s.id === "ptit"), true);
  assert.equal(findOfficialUniversities("Kinh", 2024, "NGOAI_NGU_KET_HOP").some(s => s.id === "ftu"), false);
  assert.equal(findOfficialUniversities("GMO-UNKNOWN", 2026).length, 0);
});
test("CP25-07: International requirements have direct official endpoints and certifications", () => {
  assert.equal(internationalRoutes.length, 7);
  for (const route of internationalRoutes) {
    assert.match(route.governmentSource, /^https:\/\//);
    assert.ok(route.certificates.length >= 1 && route.scholarshipDocuments.length >= 2);
    for (const school of route.targetInstitutions) assert.match(school.admissionsUrl, /^https:\/\//);
  }
});
test("CP25-08: Chat only keeps last eight bounded turns", () => {
  const history = Array.from({ length: 16 }, (_, i) => ({ role: i % 2 ? "model" : "user", text: `Turn ${i} ${"x".repeat(1000)}` }));
  const safe = normaliseAdvisorHistory(history);
  assert.equal(safe.length, 8);
  assert.ok(safe.every(x => x.text.length <= 900));
  assert.ok(safe[0].text.startsWith("Turn 8"));
});
test("CP25-09: Chat rejects invalid content and unauthorized roles in history", () => {
  assert.deepEqual(normaliseAdvisorHistory([{ role: "system", text: "delete" }, { role: "user", text: "ok" }]), [{ role: "user", text: "ok" }]);
  assert.throws(() => prepareAdvisorMessage(" "));
  assert.equal(prepareAdvisorMessage(" ".repeat(3) + "Chào bạn"), "Chào bạn");
});
test("CP25-10: UI routes and protected chat endpoint exist", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const chat = readFileSync(new URL("../api/gemini-chat.ts", import.meta.url), "utf8");
  assert.ok(app.includes('path === "/atlas/study-abroad" || path === "/study-abroad" || path === "/haven/study-abroad"'));
  assert.ok(app.includes("<FloatingAdvisorChat"));
  assert.ok(chat.includes("authenticatedRole(") && chat.includes("active !== true") && chat.includes("CORS_ALLOWED_ORIGINS"));
});

test("CP25-11: Study-abroad refresh uses Vercel SPA rewrite, preserving /api routes", () => {
  const cfg = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.ok(cfg.rewrites.some(r => r.source === "/atlas/study-abroad" && r.destination === "/index.html"));
  assert.ok(cfg.rewrites.some(r => r.source === "/study-abroad" && r.destination === "/index.html"));
  assert.ok(cfg.rewrites.some(r => r.source === "/haven/study-abroad" && r.destination === "/index.html"));
  assert.ok(!cfg.rewrites.some(r => r.source === "/api/(.*)"));
});
test("CP25-12: Chat supports same-origin secure deployment and optional CORS origin list", () => {
  const server = readFileSync(new URL("../api/gemini-chat.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../src/components/common/FloatingAdvisorChat.tsx", import.meta.url), "utf8");
  assert.ok(server.includes("const sameOrigin ="));
  assert.ok(server.includes("CORS_ALLOWED_ORIGINS"));
  assert.ok(client.includes("return base;"));
  assert.ok(!client.includes("Chưa cấu hình VITE_API_BASE_URL"));
});

test("ROUND-01: Floating assistant routes specialist questions to their owning modules", () => {
  const cases = [
    ["Điểm chuẩn Bách khoa năm 2026?", "/atlas#atlas-official-admissions"],
    ["Tổ hợp xét tuyển ngành CNTT", "/atlas#atlas-official-admissions"],
    ["Học bổng NUS có deadline nào?", "/haven#haven-scholarships"],
    ["Du học Nhật cần JLPT không?", "/atlas/study-abroad"],
    ["Tuyển sinh ngành nào tốt?", "/atlas#atlas-official-admissions"],
    ["Diem chuan dai hoc", "/atlas#atlas-official-admissions"],
    ["IELTS để nộp trường Anh?", "/atlas/study-abroad"],
  ];
  for (const [question, path] of cases) {
    const route = routeAdvisorQuestion(question);
    assert.equal(route?.destination, path, question);
    assert.ok(route?.answer && !/\d{2}\.\d{1,2}\b/.test(route.answer));
  }
  assert.equal(routeAdvisorQuestion("Làm sao lưu điểm ở hồ sơ?"), null);
  assert.equal(routeAdvisorQuestion("Xin chào bạn"), null);
});

test("ROUND-02: Only internal known destinations may appear in chat responses", () => {
  assert.equal(safeAdvisorDestination("/atlas#atlas-official-admissions"), "/atlas#atlas-official-admissions");
  assert.equal(safeAdvisorDestination("javascript:alert(1)"), undefined);
  assert.equal(safeAdvisorDestination("https://fake-school.example"), undefined);
  assert.equal(safeAdvisorDestination("/admin"), undefined);
});

test("ROUND-03: Backend and frontend share specialist redirect gate", () => {
  const server = readFileSync(new URL("../api/gemini-chat.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../src/components/common/FloatingAdvisorChat.tsx", import.meta.url), "utf8");
  assert.ok(server.includes("const redirect = routeAdvisorQuestion(question)"));
  assert.ok(server.includes("const unsafeSpecialistAnswer = routeAdvisorQuestion(answer)"));
  assert.ok(client.includes("const localRedirect = routeAdvisorQuestion(message)"));
  assert.ok(!client.includes("Gemini · hỗ trợ học tập và tuyển sinh"));
});

test("ROUND-04: Do not show uncalibrated achievement probability on the dashboard", () => {
  const ui = readFileSync(new URL("../src/page/seed/components/LearningIntelligencePanel.tsx", import.meta.url), "utf8");
  assert.ok(!ui.includes("Achievement probability"));
  assert.ok(!ui.includes("prediction?.achievementProbability"));
  assert.ok(ui.includes("chưa có xác suất đạt mục tiêu được hiệu chuẩn"));
});

test("ROUND-05: United States and domestic international pathways have official links and clear limitations", () => {
  const us = internationalRoutes.find(item => item.country === "Hoa Kỳ");
  assert.ok(us);
  assert.equal(internationalRoutes.some(item => item.country === "Liên kết quốc tế tại Việt Nam"), false);
  assert.match(us.governmentSource, /educationusa\.state\.gov/);
  assert.ok(us.targetInstitutions.length >= 2);
  assert.equal(domesticInternationalPrograms.length, 2);
  assert.match(domesticInternationalPrograms[0].admissionsUrl, /^https:\/\/www\.hutech\.edu\.vn/);
  assert.equal(routeAdvisorQuestion("chương trình liên kết quốc tế")?.destination, "/atlas#atlas-joint-programs");
});

test("ROUND-06: TDTU three-year schemes distinguish score scales", () => {
  const tdtu = officialUniversities.find(item => item.id === "tdtu");
  assert.ok(tdtu);
  assert.deepEqual(tdtu.years.map(item => item.year), [2026, 2025, 2024]);
  assert.ok(tdtu.years[0].methodNotes.includes("thang 100"));
  assert.ok(tdtu.years[2].methodNotes.includes("thang 40"));
  assert.equal(findOfficialUniversities("Công nghệ thông tin", 2026).some(item => item.id === "tdtu"), true);
});

test("ROUND-07: Career-fit UI states experimental scores are not admission probabilities", () => {
  const ui = readFileSync(new URL("../src/page/seed/components/LearningIntelligencePanel.tsx", import.meta.url), "utf8");
  assert.match(ui, /không phải xác suất trúng tuyển/);
  assert.match(ui, /CHỈ SỐ THỬ NGHIỆM/);
  assert.ok(!ui.includes("Achievement probability"));
});

test("ROUND-07: Career-fit UI states experimental scores are not admission probabilities", () => {
  const ui = readFileSync(new URL("../src/page/seed/components/LearningIntelligencePanel.tsx", import.meta.url), "utf8");
  assert.match(ui, /không phải xác suất trúng tuyển/);
  assert.match(ui, /CHỈ SỐ THỬ NGHIỆM/);
  assert.ok(!ui.includes("Achievement probability"));
});


test("GLOBAL-01: every ISO 3166-1 alpha-2 country/territory is selectable without fabricated claims", () => {
  assert.equal(countryCatalog.length, 249);
  assert.equal(new Set(countryCatalog.map(entry => entry.code)).size, countryCatalog.length);
  for (const item of countryCatalog) {
    assert.match(item.code, /^[A-Z]{2}$/);
    assert.ok(item.name.trim());
    assert.ok(findCountry(item.code));
  }
  assert.equal(findCountry("CA")?.code, "CA");
  assert.equal(searchCountries("canada").some(item => item.code === "CA"), true);
  assert.equal(searchCountries("hoa ky").some(item => item.code === "US"), true);
  assert.equal(searchCountries("vn").some(item => item.code === "VN"), true);
  assert.equal(internationalRoutes.every(item => countryCatalog.some(country => country.code === item.isoCode)), true);
});

test("GLOBAL-02: all-country UI abstains when programme-level evidence is unavailable", () => {
  const study = readFileSync(new URL("../src/page/study-abroad/StudyAbroadPage.tsx", import.meta.url), "utf8");
  assert.match(study, /Chưa có hồ sơ nguồn được xác minh/);
  assert.match(study, /whed\.net\/home\.php/);
  assert.match(study, /selectedRoute \?/);
  assert.match(study, /countryCatalog\.length/);
  assert.ok(!study.includes('country: "Liên kết quốc tế tại Việt Nam"'));
});

test("GLOBAL-03: Atlas owns domestic and international admissions; Haven owns scholarships and finance", () => {
  const atlas = readFileSync(new URL("../src/page/atlas/AtlasPage.tsx", import.meta.url), "utf8");
  const haven = readFileSync(new URL("../src/page/haven/HavenPage.tsx", import.meta.url), "utf8");
  const modules = readFileSync(new URL("../src/components/common/ModuleClusterGrid.tsx", import.meta.url), "utf8");
  const submodules = readFileSync(new URL("../src/data/moduleSubmodules.ts", import.meta.url), "utf8");
  assert.ok(atlas.includes('id="atlas-joint-programs"'));
  assert.ok(atlas.includes("domesticInternationalPrograms.map"));
  assert.ok(haven.includes('href="/atlas/study-abroad"'));
  assert.ok(haven.includes('id="haven-scholarships"'));
  assert.ok(submodules.includes('href: "/atlas#atlas-joint-programs"'));
  assert.ok(submodules.includes('href: "/atlas/study-abroad"'));
  assert.ok(modules.includes("moduleSubmoduleDirectory"));
  assert.equal(routeAdvisorQuestion("Du học Canada")?.destination, "/atlas/study-abroad");
  assert.equal(routeAdvisorQuestion("Học bổng Canada")?.destination, "/haven#haven-scholarships");
  assert.equal(routeAdvisorQuestion("đào tạo liên kết quốc tế tại Việt Nam")?.destination, "/atlas#atlas-joint-programs");
});


test("MODULE-01: 7 main modules remain while study abroad is an Atlas submodule", () => {
  const catalog = readFileSync(new URL("../src/data/moduleClusters.ts", import.meta.url), "utf8");
  const modules = readFileSync(new URL("../src/components/common/ModuleClusterGrid.tsx", import.meta.url), "utf8");
  const submodules = readFileSync(new URL("../src/data/moduleSubmodules.ts", import.meta.url), "utf8");
  const atlas = readFileSync(new URL("../src/page/atlas/AtlasPage.tsx", import.meta.url), "utf8");
  const haven = readFileSync(new URL("../src/page/haven/HavenPage.tsx", import.meta.url), "utf8");
  const study = readFileSync(new URL("../src/page/study-abroad/StudyAbroadPage.tsx", import.meta.url), "utf8");
  const policy = readFileSync(new URL("../src/lib/advisorChatPolicy.ts", import.meta.url), "utf8");
  assert.equal((catalog.match(/    key: "(nexus|seed|lumen|atlas|orion|pulse|haven)",/g) || []).length, 7);
  assert.ok(atlas.includes('href="/atlas/study-abroad"'));
  assert.ok(haven.includes('href="/atlas/study-abroad"'));
  assert.ok(study.includes('ATLAS ADMISSION · DU HỌC TOÀN CẦU'));
  assert.ok(submodules.includes('title: "Du học toàn cầu"'));
  assert.ok(modules.includes('showAllSubmodules'));
  assert.ok(modules.includes('Xem thêm ${filteredActions.length - 3} chức năng'));
  assert.ok(!policy.includes('destination: "/haven/study-abroad"'));
  assert.equal(routeAdvisorQuestion("Học bổng du học Canada")?.destination, "/haven#haven-scholarships");
  assert.equal(routeAdvisorQuestion("Du học Canada")?.destination, "/atlas/study-abroad");
});


test("UX-V7-01: Assistant receives only allowlisted page context and page-specific prompts", () => {
  assert.equal(advisorPageContextFromPath("/student/profile"), "student-profile");
  assert.equal(advisorPageContextFromPath("/atlas/study-abroad"), "study-abroad");
  assert.equal(advisorPageContextFromPath("/admin/diagnostics"), "admin-diagnostics");
  assert.equal(safeAdvisorPageContext("/admin?uid=private"), "general");
  assert.equal(safeAdvisorPageContext("atlas"), "atlas");
  assert.match(ADVISOR_PAGE_CONTEXTS.atlas, /Atlas Admission/);
  assert.ok(advisorSuggestionsFor("lumen").some(item => item.includes("SCI")));
  const client = readFileSync(new URL("../src/components/common/FloatingAdvisorChat.tsx", import.meta.url), "utf8");
  const server = readFileSync(new URL("../api/gemini-chat.ts", import.meta.url), "utf8");
  assert.match(client, /history: past, pageContext/);
  assert.match(server, /safeAdvisorPageContext\(obj\.pageContext\)/);
  assert.match(server, /không suy đoán dữ liệu cá nhân/);
});
