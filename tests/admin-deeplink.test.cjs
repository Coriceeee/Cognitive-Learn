/** Nexus admin actions must remain in admin-owned routes, never student workflows.
 * These assertions check source contracts, not Firestore Emulator or E2E. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const admin=read('src/page/nexus/AdminPage.tsx');
const catalog=read('src/data/adminConsoleDirectory.ts');
const diagnostics=read('src/page/nexus/AdminDiagnosticsPage.tsx');
assert.match(admin,/adminConsoleDirectory/);
assert.doesNotMatch(admin,/moduleSubmoduleDirectory|nexus-legacy-tests|getAdminPath/);
const rolePreview = admin.split('className="nexus-role-switcher"')[1] || "";
assert.ok(rolePreview, "explicit admin role-preview section is required");
assert.match(rolePreview, /href="\/student\?from=admin"/);
assert.doesNotMatch(rolePreview, /href="\/teacher\?from=admin"/);
assert.doesNotMatch(rolePreview, /href="\/parent\?from=admin"/);
assert.match(rolePreview, /không đổi vai trò tài khoản/i);
assert.doesNotMatch(admin.split('className="nexus-role-switcher"')[0], /href="\/(?:student|teacher|parent)(?:["?])/,
  "role workspaces must not be mixed into the admin task directory");
for(const module of ['nexus','seed','lumen','atlas','orion','pulse','haven']) {
  assert.match(catalog,new RegExp(`^  ${module}: \\{`,'m'),`${module}: missing admin group`);
}
const views=['health','roles','seed','cognitive','ml','atlas','orion','pulse','haven'];
for(const view of views){
  assert.match(catalog,new RegExp(`/admin/diagnostics\\?view=${view}`),`${view} diagnostic not linked`);
  assert.match(diagnostics,new RegExp(`(?:${view}:|view === "${view}"|\\"${view}\\")`),`${view} not recognized`);
}
const allLinks=[...catalog.matchAll(/href: "([^"]+)"/g)].map(x=>x[1]);
assert.ok(allLinks.length>=9,`Expected >=9 admin diagnosis links, got ${allLinks.length}`);
for(const link of allLinks) assert.ok(link.startsWith('/admin/diagnostics?view='),`Not admin-only: ${link}`);
assert.match(admin,/nexus-role-preview/);
console.log(`ADMIN ROUTE CONTRACT: ${allLinks.length} admin-only links across 7 modules; no student business links PASS`);
