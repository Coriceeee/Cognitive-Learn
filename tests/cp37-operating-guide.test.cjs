const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("CP37-01: student guide route is registered and allowed for students", () => {
  const app = read("src/App.tsx");
  const gate = read("src/components/common/AccessGate.tsx");
  const vercel = JSON.parse(read("vercel.json"));
  assert.ok(app.includes('path === "/student/guide"'));
  assert.ok(app.includes('lazy(routeModules.studentGuide)'));
  assert.ok(read('src/lib/routeModules.ts').includes("import('../page/seed/StudentGuidePage')"));
  assert.ok(gate.includes('"/student/guide"'));
  assert.ok(vercel.rewrites.some(item => item.source === "/student/guide" && item.destination === "/index.html"));
});

test("CP37-02: dashboard and task finder link to the practical operating guide", () => {
  const dashboard = read("src/page/seed/components/LearningCircuit.tsx");
  const finder = read("src/page/seed/StudentModulesPage.tsx");
  assert.match(dashboard, /href:\s*"\/student\/guide"/);
  assert.ok(dashboard.includes('label:"Hướng dẫn sử dụng"'));
  assert.match(finder, /href\s*=\s*"\/student\/guide"/);
});

test("CP37-03: student guide keeps practical onboarding and hides internal limitation disclosures", () => {
  const guide = read("src/page/seed/StudentGuidePage.tsx");
  for (const phrase of [
    "Nạp hồ sơ demo 3 năm", "synthetic", "Luồng sử dụng từng bước",
    "Dữ liệu đang đi như thế nào?", "Mở bảng điểm của tôi",
  ]) assert.ok(guide.includes(phrase), `Missing practical guide content: ${phrase}`);
  for (const phrase of [
    "cla-ops-warning-grid", "Không có dữ liệu tự sinh cho tài khoản mới",
    "Chưa có ML dự báo production", "Chưa phải vòng lặp tự động hoàn chỉnh",
  ]) assert.ok(!guide.includes(phrase), `Internal limitation disclosure must not appear in student guide: ${phrase}`);
});

test("CP37-04: guide CSS is imported after CP36 styles", () => {
  const styles = read("src/styles.css");
  assert.ok(styles.includes('26-operating-guide.css'));
  assert.ok(styles.indexOf('25-p1-task-scholarship.css') < styles.indexOf('26-operating-guide.css'));
});
