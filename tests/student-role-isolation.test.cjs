const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const source = read("src/data/moduleSubmodules.ts");
const grid = read("src/components/common/ModuleClusterGrid.tsx");
const nav = read("src/components/common/ModuleSectionNav.tsx");
const atlas = read("src/page/atlas/AtlasPage.tsx");
const pulse = read("src/page/pulse/PulsePage.tsx");
const haven = read("src/page/haven/HavenPage.tsx");
const api = read("api/gemini-admission-reader.ts");
const student = source.split("export const studentSubmoduleDirectory:")[1].split("export function getStudentSubmodules")[0];
assert.ok(student, "student-only catalog is mandatory");
for (const name of ["seed", "lumen", "atlas", "orion", "pulse", "haven"]) {
 assert.match(student, new RegExp(`^  ${name}: \{`, "m"));
}
for (const adminOnly of ["Sẵn sàng dữ liệu ML", "Kiểm tra dữ liệu liên thông", "Công cụ đọc đề án", "Báo cáo theo vai trò", "Hỗ trợ phụ huynh & giáo viên", "Knowledge Base"]) {
 assert.ok(!student.includes(adminOnly), `${adminOnly} must not appear in student catalog`);
}
assert.ok(!/^  nexus: \{/m.test(student), "Nexus must stay admin-only");
assert.match(student,/Du học toàn cầu/);
assert.match(student,/Báo cáo của tôi/);
assert.match(student,/Khoảng cách|Điều kiện còn thiếu/);
assert.match(grid,/studentSubmoduleDirectory\[module\.key as StudentModuleKey\]/);
assert.match(nav,/getStudentSubmodules\(moduleKey\)/);
assert.match(atlas,/isAdmin && <>/);
assert.match(atlas,/isAdmin && programs\.length/);
assert.match(pulse,/isAdmin && <section id="pulse-pipeline"/);
assert.match(haven,/<section id="haven-support-roles"/);
assert.doesNotMatch(haven,/parentSummary|teacherSummary/);
assert.match(api,/role !== "admin"/);
assert.match(api,/active\?\.booleanValue !== true/);
console.log("STUDENT ROLE ISOLATION: menu, read-only student flows and admin-only source API PASS");
