const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const patch = fs.readFileSync('firestore.rules.orion-drafts.patch', 'utf8');
const draftHook = fs.readFileSync('src/lib/useModuleDraft.ts', 'utf8');
const orionPage = fs.readFileSync('src/page/orion/OrionPage.tsx', 'utf8');

test('Orion production patch is owner-bound, active-account and product-consent gated', () => {
  assert.match(patch, /request\.auth\.uid == uid/);
  assert.match(patch, /users\/\$\(uid\)/);
  assert.match(patch, /data\.active == true/);
  assert.match(patch, /student_consents\/\$\(uid\)/);
  assert.match(patch, /productAccepted == true/);
  assert.match(patch, /noticeVersion == 'cla-student-privacy-v1'/);
  assert.match(patch, /allow list: if false/);
  assert.match(patch, /allow delete: if false/);
});

test('Orion production patch enforces create revision 1 and monotonic update revisions', () => {
  assert.match(patch, /allow create:[\s\S]*?revision == 1/);
  assert.match(patch, /allow update:[\s\S]*?revision == resource\.data\.get\('revision', 0\) \+ 1/);
  assert.match(patch, /updatedAt == request\.time/);
  assert.match(patch, /data is map/);
});

test('Orion client surfaces permission-denied instead of silently hiding failed autosave', () => {
  assert.match(draftHook, /errorCode === "permission-denied"/);
  assert.match(draftHook, /Rules Production cần được bổ sung quyền owner-only/);
  assert.match(orionPage, /catch \(error\)[\s\S]*?setAutosaveState\("pending"\)[\s\S]*?setSaveNotice/);
});

test('Atlas focused daylight hero overrides legacy white hero text without theme-attribute dependency', () => {
  const base = fs.readFileSync('src/styles/21-cla-design-system.css', 'utf8');
  const focused = fs.readFileSync('src/styles/53-cla-focused-admission.css', 'utf8');
  assert.match(base, /\.cla-study-hero\.cla-study-focused-hero :is\(h1,h2,h3,strong\)[\s\S]*?color: #142941 !important/);
  assert.match(focused, /\.cla-study-abroad-page \.cla-study-hero\.cla-study-focused-hero :is\(p,small\)[\s\S]*?color: #405a72 !important/);
});
