/** CP29 / A4: Route and SPA rewrite contract. Browser E2E still required. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('src/App.tsx');
const gate=read('src/components/common/AccessGate.tsx');
const vercel=JSON.parse(read('vercel.json'));
const firebase=JSON.parse(read('firebase.json'));
const required=[
 '/admin','/admin/diagnostics','/student','/student/profile','/student/transcript',
 '/student/consent','/student/companion','/student/guide',
 '/atlas','/atlas/vietnam','/atlas/study-abroad','/atlas/study-abroad/programs',
 '/lumen','/lumen/history','/orion','/orion/scenarios','/pulse','/pulse/reports',
 '/haven','/haven/scholarships',
];
test('CP29-A4-01 all 20 current critical paths are registered by the root app',()=>{
 for(const route of required) {
  const prefixRoute=route.startsWith("/atlas/study-abroad/") && app.includes('path.startsWith("/atlas/study-abroad/")');
  assert.ok(app.includes(`"${route}"`) || prefixRoute,`${route} missing from router`);
 }
});
test('CP29-A4-02 Vercel rewrites every critical deep link to SPA without shadowing APIs',()=>{
 for(const route of required) {
  const rewrites=vercel.rewrites.filter(item=>item.source===route);
  assert.equal(rewrites.length,1,`rewrite count for ${route}`);
  assert.equal(rewrites[0].destination,'/index.html');
 }
 assert.ok(!vercel.rewrites.some(item=>item.source.startsWith('/api') || item.source==='/:path*'));
});
test('CP29-A4-03 Firebase Hosting has SPA fallback',()=>{
 assert.ok(firebase.hosting.rewrites.some(item=>item.source==='**'&&item.destination==='/index.html'));
});
test('CP29-A4-04 route guard enforces student-only scope and retired route denial',()=>{
 for (const route of ['/student','/student/profile','/student/transcript','/student/consent','/atlas','/lumen','/orion','/pulse','/haven']) {
  assert.ok(gate.includes(`"${route}"`),`missing student allowlist: ${route}`);
 }
 assert.ok(gate.includes('if (role === "student") return studentAllowedRoutes.has(normalized)'));
 assert.ok(gate.includes('["/teacher", "/parent", "/role"].includes(normalized)) return false'));
 for (const retired of ["/teacher","/parent","/role"]) { assert.ok(!app.includes(`"${retired}"`)); assert.ok(!vercel.rewrites.some(x=>x.source===retired)); }
 assert.match(app, /<AccessGate path=\{path\}>/);
});
test('CP29-A4-05 protected pages mount chatbot only inside AccessGate',()=>{
 assert.match(app,/<AccessGate path=\{path\}>[\s\S]*?<AppNotificationCenter \/>[\s\S]*?<FloatingAdvisorChat \/>[\s\S]*?<\/AccessGate>/);
});
