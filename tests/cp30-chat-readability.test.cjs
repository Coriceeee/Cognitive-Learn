const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles/22-cla-chat-readability.css'), 'utf8');
const chat = fs.readFileSync(path.join(root, 'src/components/common/FloatingAdvisorChat.tsx'), 'utf8');

function block(selector) {
  const at = css.indexOf(selector + ' {');
  assert.ok(at >= 0, `Missing CSS selector: ${selector}`);
  return css.slice(at, css.indexOf('}', at) + 1);
}
function contrast(foreground, background) {
  function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(s => parseInt(s, 16)/255)
      .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055)/1.055)**2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  }
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

test('CP30 chat readability layer loads after the final CP28 theme', () => {
  // CP37 and later layers may follow CP30: verify relative order, not the last import.
  assert.ok(entry.indexOf('25-p1-task-scholarship.css') < entry.indexOf('26-operating-guide.css'));
  assert.match(entry, /26-operating-guide\.css/);
  assert.ok(entry.indexOf('21-cla-design-system.css') < entry.indexOf('22-cla-chat-readability.css'));
  assert.ok(entry.indexOf('22-cla-chat-readability.css') < entry.indexOf('23-scientific-visuals.css'));
  assert.ok(entry.indexOf('23-scientific-visuals.css') < entry.indexOf('24-cla-subpages-ui.css'));
  assert.ok(entry.indexOf('24-cla-subpages-ui.css') < entry.indexOf('25-p1-task-scholarship.css'));
  assert.match(entry, /22-cla-chat-readability\.css/);
  assert.match(css, /\.cla-chat-root \{/);
});

test('CP30 keeps readable chat typography instead of legacy 9–11px labels', () => {
  assert.match(block('.cla-chat-root .cla-chat-header-copy strong'), /font-size:\s*18px/);
  assert.match(block('.cla-chat-root .cla-chat-header-copy > span'), /font-size:\s*14px/);
  assert.match(block('.cla-chat-root .cla-chat-intro'), /font-size:\s*14px/);
  assert.match(block('.cla-chat-root .cla-chat-message p'), /font-size:\s*15px/);
  assert.match(block('.cla-chat-root .cla-chat-suggestions button'), /font-size:\s*14px/);
  assert.match(block('.cla-chat-root .cla-chat-form textarea'), /font-size:\s*15px/);
  assert.match(block('.cla-chat-root .cla-chat-form textarea::placeholder'), /font-size:\s*14px/);
  assert.match(block('.cla-chat-root .cla-chat-footer a'), /font-size:\s*13px/);
  assert.match(block('.cla-chat-root .cla-chat-suggestions button'), /min-height:\s*44px/);
  assert.match(block('.cla-chat-root .cla-chat-form button'), /min-height:\s*48px/);
});

test('CP30 brand palette has WCAG AA normal-text contrast on the corresponding solid surface', () => {
  for (const [name, fg, bg] of [
    ['message text', '#102a43', '#f1f7ff'],
    ['intro text', '#102a43', '#f2f8ff'],
    ['assistant secondary text', '#294968', '#fff' .replace('#fff', '#ffffff')],
    ['context badge text', '#164a80', '#ffffff'],
    ['suggestion text', '#103e89', '#eaf4ff'],
    ['user message text', '#ffffff', '#174ea6'],
    ['input placeholder', '#405e7d', '#ffffff'],
    ['disabled send text', '#375371', '#dde8f5'],
    ['footer link', '#124a96', '#edf6ff'],
    ['warning copy', '#66410e', '#fff5df'],
  ]) {
    assert.ok(contrast(fg, bg) >= 4.5, `${name}: contrast ${contrast(fg, bg).toFixed(2)} < 4.5:1`);
  }
});

test('CP30 preserves mascot, assistant routing and accessible keyboard treatment', () => {
  assert.match(chat, /claChatMascot/);
  assert.match(chat, /routeAdvisorQuestion/);
  assert.match(chat, /safeAdvisorDestination/);
  assert.match(css, /:is\(button, a, textarea\):focus-visible/);
  assert.match(css, /outline:\s*3px solid #0e56b5/);
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
