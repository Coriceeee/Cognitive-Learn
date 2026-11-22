const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const login = fs.readFileSync(path.join(root, 'src/page/auth/LoginPage.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src/styles/01-auth.css'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'src/styles/99-responsive.css'), 'utf8');

test('CP77: agreed two-sentence manifesto appears in accessible main heading', () => {
  assert.match(login, /<h1 className="cla-login-manifesto">\s*Mỗi con người là một tiềm năng chưa có giới hạn\.\s*<br \/>\s*Mỗi tương lai là một hành trình chưa được viết nên\.\s*<\/h1>/);
  assert.doesNotMatch(login, /Hiểu bản thân học tập\.|Mở đường tương lai\./);
});

test('CP77: approved subtitle uses exact full copy', () => {
  const caption = login.match(/<p className="cla-login-manifesto-caption">([\s\S]*?)<\/p>/)?.[1] || '';
  assert.equal(caption.replace(/\s+/g, ' ').trim(), 'CLA — Nơi dữ liệu trở thành sự thấu hiểu, nhận thức mở ra lựa chọn và mỗi học sinh tìm thấy con đường của chính mình.');
});

test('CP77: preserves login card, all account entry paths and showcase illustration', () => {
  for (const piece of ['className="auth-side"', 'className="login-card"', 'handleLogin', 'handleRegister', 'handleGoogleLogin', 'handlePasswordReset', 'handleResumeVerification', 'className="profile-showcase-card"', 'className="showcase-stats"', 'className="showcase-note"']) {
    assert.ok(login.includes(piece), `${piece} must remain`);
  }
});

test('CP77: headline uses scoped adaptive typography rather than changing all global headings', () => {
  assert.match(styles, /\.showcase-copy \.cla-login-manifesto\s*\{[\s\S]*?font-size: clamp\(/);
  assert.match(styles, /\.showcase-copy \.cla-login-manifesto-caption\s*\{/);
  assert.match(responsive, /@media \(max-width: 560px\)[\s\S]*?\.showcase-copy \.cla-login-manifesto\s*\{/);
});
