const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
let ts;
try { ts = require('typescript'); } catch {
  try {
    const { execFileSync } = require('node:child_process');
    const globalNodeModules = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    ts = require(path.join(globalNodeModules, 'typescript'));
  } catch { ts = null; }
}

test('Unknown route presents a real not-found message, while home still logs in', () => {
  const app = read('src/App.tsx');
  assert.match(app, /else if \(path === "\/"\)\s*\{\s*currentPage = <TrangDangNhap\s*\/>/);
  assert.match(app, /notFound = true;\s*currentPage = <NotFoundPage\s*\/>/);
  assert.match(app, /\|\| notFound \? \(/);
  assert.match(app, /Không tìm thấy trang này/);
  const route = read('src/lib/routeExperience.ts');
  assert.match(route, /return 'Không tìm thấy trang'/);
});

test('Fallback button styles cannot outrank local component styles by specificity', () => {
  const css = read('src/styles/49-cla-product-polish.css');
  assert.match(css, /:where\(\.app-root main button:not\(\[class\]\)\)/);
  assert.doesNotMatch(css, /(?:^|,)\s*\.app-root main button:not\(\[class\]\)/m);
});

test('Transcript input accessible names identify learner context and assessment', () => {
  const page = read('src/page/seed/StudentProfilePage.tsx');
  for (const label of ['Điểm thường xuyên ${index + 1}', 'Điểm giữa kỳ', 'Điểm cuối kỳ'])
    assert.ok(page.includes(label), `Missing ${label}`);
  assert.ok((page.match(/aria-label=\{`\$\{subject\} · Lớp/g) || []).length >= 3);
});

test('Chat starts with a short action-focused introduction, not a full score list', () => {
  const chat = read('src/components/common/FloatingAdvisorChat.tsx');
  const match = chat.match(/<p className="cla-chat-intro">([\s\S]+?)<\/p>/);
  assert.ok(match);
  assert.ok(match[1].length < 500, 'Intro must be scannable on mobile');
  assert.doesNotMatch(match[1], /Điểm chuẩn CTU|Điểm chuẩn HUST/);
  assert.match(match[1], /nguồn tuyển sinh chính thức/);
});

test('Account menu is keyboard dismissible and exposes expanded state', () => {
  const menu = read('src/components/common/UserMenu.tsx');
  assert.match(menu, /aria-expanded=\{open\}/);
  assert.match(menu, /aria-controls="cla-account-dropdown"/);
  assert.match(menu, /event.key === "Escape"/);
  assert.match(menu, /menuRoot.current\?\.contains\(event.target as Node\)/);
});

test('No TypeScript syntax errors in the modified UI files', { skip: !ts && 'TypeScript parser requires local/global TypeScript' }, () => {
  const files = ['src/App.tsx', 'src/lib/routeExperience.ts', 'src/components/common/UserMenu.tsx', 'src/components/common/FloatingAdvisorChat.tsx', 'src/page/seed/StudentProfilePage.tsx'];
  for (const name of files) {
    const file = path.join(root, name);
    const source = ts.createSourceFile(file, read(name), ts.ScriptTarget.Latest, true, name.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    assert.equal(source.parseDiagnostics.length, 0, `${name}: ${source.parseDiagnostics.map(x => x.messageText).join('; ')}`);
  }
});
