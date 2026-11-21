const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function luminance(hex) {
  const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i+2), 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
function ratio(a,b) {
  const [max,min] = [luminance(a), luminance(b)].sort((x,y)=>y-x);
  return (max + .05) / (min + .05);
}
const css = read('src/styles/38-cla-daylight-studio.css');
const token = name => {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'));
  assert.ok(match, `Missing role token ${name}`);
  return match[1];
};
const surfaces = ['--cla-bg-page', '--cla-bg-canvas', '--cla-bg-subtle'];
const roles = ['--cla-text-primary','--cla-text-secondary','--cla-text-muted',
  '--cla-text-link','--cla-text-accent-teal','--cla-text-accent-violet','--cla-text-accent-amber'];

test('CP44: every standard text role reaches WCAG 2.2 AA 4.5:1 on each light surface', () => {
  for (const role of roles) for (const bg of surfaces) {
    const r = ratio(token(role), token(bg));
    assert.ok(r >= 4.5, `${role} on ${bg}: ${r.toFixed(2)}:1`);
  }
});
test('CP44: dashboard numeric series labels use validated contrast colors', () => {
  const canvas = read('src/page/seed/components/StudentDecisionCanvas.tsx');
  for (const color of ['#17685f','#5264c9','#8f561e']) {
    assert.ok(canvas.includes(`color: '${color}'`));
    assert.ok(ratio(color,'#ffffff') >= 4.5);
  }
  assert.match(canvas, /scoreAvailable === true/);
  assert.match(canvas, /status === 'VERIFIED'/);
});
test('CP44: no retired CP42 dark Observatory layer can override daylight canvas', () => {
  const imports = read('src/styles.css');
  assert.doesNotMatch(imports, /34-student-observatory|35-cla-spectral-observatory/);
  assert.match(imports, /38-cla-daylight-studio/);
  assert.doesNotMatch(css, /:root\[data-theme='dark'\]/);
  for (const cls of ['.cla-canvas-grid','.cla-spectral-layout','.cla-canvas-flow','.cla-canvas-switch']) {
    assert.ok(css.includes(cls), `Structural contract missing: ${cls}`);
  }
});
test('CP44: legacy dark foreground on newly light hero surfaces is corrected', () => {
  for (const cls of ['.profile-head','.nexus-hero','.student-intelligence-hero','.student-panel.dark','.profile-showcase-left','.student-hero','.module-path-detail','.about-hero-premium','.contact-hero-premium']) {
    assert.ok(css.includes(cls));
  }
  assert.match(css, /\.user-dropdown-head \.user-role-badge/);
  assert.match(css, /\.student-dash \.cla-intro-target \{ display: grid;/);
});
test('CP44: app cannot silently revert into incomplete dark skin', () => {
  const app = read('src/App.tsx');
  const theme = read('src/lib/theme.ts');
  const html = read('index.html');
  assert.doesNotMatch(app, /<ThemeToggle\s*\/>/);
  assert.match(theme, /export function resolveTheme\(_pref: ThemePref\): ThemeResolved \{ return "light";/);
  assert.match(html, /r\.setAttribute\("data-theme", "light"\)/);
  assert.match(html, /name="color-scheme" content="light"/);
});
