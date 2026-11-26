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
  assert.ok(dashboard.includes('href:"/student/guide"'));
  assert.ok(dashboard.includes('label:"Hướng dẫn sử dụng"'));
  assert.ok(finder.includes('href="/student/guide"'));
});

test("CP37-03: guide distinguishes real student data, Admin synthetic demo, and incomplete integrations", () => {
  const guide = read("src/page/seed/StudentGuidePage.tsx");
  for (const phrase of [
    "Nạp hồ sơ demo 3 năm", "synthetic", "Không có dữ liệu tự sinh cho tài khoản mới",
    "Chưa có ML dự báo production", "Pulse chưa tự đọc và hợp nhất",
    "Checklist hiện chỉ giữ trong phiên trang", "không phải dự báo ML đã kiểm định",
  ]) assert.ok(guide.includes(phrase), `Missing guide explanation: ${phrase}`);
});

test("CP37-04: guide CSS is imported after CP36 styles", () => {
  const styles = read("src/styles.css");
  assert.ok(styles.includes('26-operating-guide.css'));
  assert.ok(styles.indexOf('25-p1-task-scholarship.css') < styles.indexOf('26-operating-guide.css'));
});
