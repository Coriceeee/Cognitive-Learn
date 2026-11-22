const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("UX-V7-02: Student dashboard exposes six connected student spaces in the learning circuit", () => {
  const page = read("src/page/seed/StudentPage.tsx");
  const circuit = read("src/page/seed/components/LearningCircuit.tsx");
  assert.match(page, /import LearningCircuit from ".\/components\/LearningCircuit"/);
  assert.match(page, /<LearningCircuit profilePath={profilePath} \/>/);
  for (const [code, path] of [["SEED", "/student/profile"], ["LUMEN", "/lumen"], ["ATLAS", "/atlas"], ["ORION", "/orion"], ["PULSE", "/pulse"], ["HAVEN", "/haven"]]) {
    assert.ok(circuit.includes(`code:"${code}"`), `missing learning space: ${code}`);
    assert.ok(circuit.includes(`href:"${path}"`), `missing student destination: ${path}`);
  }
  assert.match(circuit, /Sáu hệ trí tuệ/);
  assert.match(circuit, /aria-label="Sơ đồ sáu không gian học tập"/);
  assert.doesNotMatch(page, /href:\s*["']\/admin/);
});

test("UX-V7-03: Student module navigator filters actions and uses real links only", () => {
  const grid = read("src/components/common/ModuleClusterGrid.tsx");
  const catalog = read("src/data/moduleSubmodules.ts");
  assert.match(grid, /Tìm chức năng trong phân hệ/);
  assert.match(grid, /filteredActions/);
  assert.match(grid, /module-path-action-open/);
  assert.match(grid, /status === "planned"/);
  assert.match(catalog, /studentSubmoduleDirectory/);
  assert.match(catalog, /id: "scholarships", title: "Cơ hội học bổng"/);
  assert.match(catalog, /id: "abroad", title: "Chạm thế giới"/);
});

test("UX-V7-04: Admin remains outside student navigation", () => {
  const admin = read("src/page/nexus/AdminPage.tsx");
  const student = read("src/page/seed/StudentPage.tsx");
  assert.match(admin, /NEXUS CONSOLE/);
  assert.match(admin, /CHỨC NĂNG QUẢN TRỊ/);
  assert.doesNotMatch(student, /\/admin\/diagnostics/);
  assert.doesNotMatch(student, /Nexus Console/);
});

test("UX-V7-05: V7 UI layer is imported and has responsive/accessibility treatments", () => {
  const styles = read("src/styles.css");
  const ux = read("src/styles/20-ux-v7.css");
  assert.match(styles, /20-ux-v7\.css/);
  assert.ok(styles.indexOf('20-ux-v7.css') < styles.indexOf('99-responsive.css'));
  assert.ok(styles.indexOf('99-responsive.css') < styles.indexOf('21-cla-design-system.css'));
  assert.match(ux, /max-width:900px/);
  assert.match(ux, /max-width:640px/);
  assert.match(ux, /focus-visible/);
  assert.match(ux, /prefers-reduced-motion/);
  assert.match(ux, /cla-chat-header-mascot/);
});


test("CP28-01: Account role labels are restored and sourced from the Firestore profile", () => {
  const userMenu = read("src/components/common/UserMenu.tsx");
  const login = read("src/page/auth/LoginPage.tsx");
  const admin = read("src/page/nexus/AdminPage.tsx");
  for (const label of ["Học sinh", "Quản trị viên"]) {
    assert.ok(userMenu.includes(label), `missing account role label: ${label}`);
  }
  assert.match(userMenu, /profile\?\.role/);
  assert.match(userMenu, /Vai trò hiện tại/);
  assert.match(userMenu, /profile\?\.active === true/);
  assert.doesNotMatch(userMenu, /profile\?\.active !== false/);
  assert.match(login, /Tài khoản học sinh được tạo tự động/);
  assert.doesNotMatch(userMenu, /Giáo viên|Phụ huynh/);
  assert.match(admin, /Không gian học sinh và quản trị/);
  assert.match(admin, /ROLE WORKSPACES · ADMIN PREVIEW/);
  assert.match(admin, /không đổi vai trò tài khoản/);
});

test("CP28-02: CLA design system is loaded last and chat is light", () => {
  const styles = read("src/styles.css");
  const theme = read("src/styles/21-cla-design-system.css");
  assert.match(styles, /21-cla-design-system\.css/);
  assert.ok(styles.indexOf("20-ux-v7.css") < styles.indexOf("21-cla-design-system.css"));
  assert.match(theme, /--cla-hero/);
  for (const file of ["11-cognitive-growth.css", "12-lumen.css", "16-shared-reports.css", "19-module-subnav.css"]) {
    assert.ok(styles.includes(file), `missing global style import: ${file}`);
  }
  assert.match(theme, /\.cla-chat-context-link/);
  assert.match(theme, /\.cla-chat-panel\s*\{[\s\S]*?background:\s*#fff\s*!important/);
  assert.match(theme, /\.nexus-rail\s*\{[\s\S]*?linear-gradient\(180deg, #f8fbff/);
  assert.match(theme, /\.cla-study-abroad-page\s*\{[\s\S]*?background:\s*var\(--cla-page\)/);
});
