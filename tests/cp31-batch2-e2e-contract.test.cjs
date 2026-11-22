/** CP31 Batch 2: source/runner contract; a PASS here never means browser E2E ran. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const manifest = JSON.parse(read('tests/e2e/cp31_nexus_manifest.json'));
const groups = manifest.groups;
const tasks = groups.flatMap(group => group.tasks);
const catalog = read('src/data/adminConsoleDirectory.ts');
const admin = read('src/page/nexus/AdminPage.tsx');
const audit = read('src/page/nexus/AdminAuditPage.tsx');
const runner = read('tools/cp31_browser_e2e.py');

test('CP31-B2-01 source inventory and E2E manifest agree for every task and diagnostic', () => {
  assert.equal(groups.length, 7);
  assert.equal(tasks.length, 22);
  assert.equal(new Set(tasks.map(t => t.id)).size, 22);
  assert.equal(tasks.filter(t => t.diagnostic).length, 22);
  assert.equal(tasks.filter(t => !t.diagnostic).length, 0);
  for (const task of tasks) {
    const escaped = task.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = catalog.match(new RegExp(`\\{ id: "${escaped}", title: "([^"]+)", description: "[^"]+", group: "[^"]+", (?:href: "([^"]+)", )?status: "(limited|planned)" \\}`));
    assert.ok(m, `source task missing ${task.id}`);
    assert.equal(m[1], task.title, task.id);
    assert.equal(m[2] || null, task.diagnostic, task.id);
    assert.equal(m[3], task.status, task.id);
  }
});
test('CP31-B2-02 source exposes stable task IDs and pressed-state cluster selectors', () => {
  assert.match(admin, /data-nexus-cluster=\{activeCluster.key\}/);
  assert.match(admin, /data-nexus-task=\{task.id\}/);
  assert.match(admin, /aria-pressed=\{activeCluster.id === cluster.id\}/);
  assert.match(audit, /data-nexus-audit-id=\{item.id\}/);
});
test('CP31-B2-03 unknown query cannot silently claim to show 22 filtered tasks', () => {
  assert.match(audit, /const invalid = requested !== null && !selected/);
  assert.match(audit, /const visible = invalid \? \[\]/);
  assert.match(audit, /role="alert">Mã tác vụ Nexus không hợp lệ/);
});
test('CP31-B2-04 browser gate uses real sign-in and checks all four roles', () => {
  assert.match(runner, /page\.locator\("form\.login-form button\[type=submit\]"\)\.click\(\)/);
  assert.match(runner, /for role in \("STUDENT", "TEACHER", "PARENT"\)/);
  assert.match(runner, /for group in groups/);
  assert.match(runner, /for task in group\["tasks"\]/);
  assert.match(runner, /page\.reload/);
  assert.match(runner, /390, "height": 844/);
});
test('CP31-B2-05 browser gate forbids untrusted remote URLs and needs QA acknowledgements', () => {
  assert.match(runner, /SAFE_LOOPBACK/);
  assert.match(runner, /CLA_E2E_QA_ACK/);
  assert.match(runner, /checked_origin/);
  // Verify the actual four-role QA guard instead of an obsolete English sentence.
  assert.match(runner, /ROLES = \("ADMIN", "STUDENT", "TEACHER", "PARENT"\)/);
  assert.match(runner, /for role in ROLES:/);
  assert.match(runner, /if len\(\{v\[0\]\.lower\(\) for v in result\.values\(\)\}\) != 4:/);
  assert.doesNotMatch(runner, /page\.route\(|setDoc\(|updateDoc\(|firebaseAdmin/);
});
test('CP31-B2-06 CP31 scripts distinguish static check and real browser gate', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:cp31:browser'], /cp31_browser_e2e\.py/);
  assert.doesNotMatch(pkg.scripts['verify:cp31:batch2'], /test:cp31:browser/);
  assert.match(pkg.scripts['verify:cp31:batch2:full'], /test:cp31:browser/);
});
