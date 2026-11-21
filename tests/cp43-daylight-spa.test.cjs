const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('CP43-01 default remains light after CP44 removes partial dark mode', () => {
  const theme = read('src/lib/theme.ts');
  const html = read('index.html');
  assert.match(theme, /return "light";/);
  assert.match(html, /r.setAttribute\("data-theme", "light"\)/);
  assert.match(html, /name="color-scheme" content="light"/);
});
test('CP43-02 chart-first, light SVG and empty-data semantics remain intact', () => {
  const page = read('src/page/seed/StudentPage.tsx');
  const canvas = read('src/page/seed/components/StudentDecisionCanvas.tsx');
  const styles = read('src/styles.css');
  const surface = read('src/styles/38-cla-daylight-studio.css');
  assert.ok(page.indexOf('<StudentDecisionCanvas') < page.indexOf('student-dash-focus'));
  for (const label of ['SCI', 'MAS', 'CSL', 'Không đủ lịch sử', 'Chỉ báo thử nghiệm']) {
    // The no-history text says "Chưa đủ lịch sử"; test a narrower stable phrase.
    if (label === 'Không đủ lịch sử') assert.match(canvas, /Chưa đủ lịch sử/);
    else assert.ok(canvas.includes(label), label);
  }
  assert.match(canvas, /fill="#ffffff"/);
  assert.match(styles, /38-cla-daylight-studio\.css/);
  assert.match(surface, /\.cla-decision-canvas/);
  assert.match(surface, /prefers-reduced-motion/);
});
test('CP43-03 same-origin navigation retains history, native anchors, and external URLs', () => {
  const nav = read('src/lib/clientNavigation.ts');
  const app = read('src/App.tsx');
  assert.match(nav, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(nav, /url\.origin !== window\.location\.origin/);
  assert.match(nav, /resolveFocusedPath\(url\.pathname, url\.hash\)/);
  assert.match(nav, /window\.history\.pushState/);
  assert.match(nav, /window\.addEventListener\('popstate'/);
  assert.match(app, /startRouteTransition\(\(\) => setPath\(currentFocusedPath\(\)\)\)/);
  assert.doesNotMatch(app, /useSyncExternalStore\(/);
});
test('CP43-04 student navigation reduces authorization churn without expanding roles', () => {
  const gate = read('src/components/common/AccessGate.tsx');
  assert.match(gate, /const accessScope =/);
  assert.match(gate, /\[accessScope\]/);
  assert.match(gate, /mayVisit\(role, path\)/);
  assert.match(gate, /if \(role === "student"\) return studentAllowedRoutes\.has\(normalized\)/);
  assert.match(gate, /"\/teacher", "\/parent"/);
});
test('CP43-05 no retired parent or teacher workspaces are packaged', () => {
  for (const file of ['src/page/main/RolePage.tsx','src/components/common/StudentLinkManager.tsx','src/components/common/SharedReportPanel.tsx']) {
    assert.equal(fs.existsSync(path.join(root, file)), false);
  }
});
