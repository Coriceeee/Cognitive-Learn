const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const tsx = fs.readFileSync(path.join(root, "src/components/common/FloatingAdvisorChat.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "src/styles/18-admissions-chat.css"), "utf8");

test("CLA chatbot launcher uses the custom mascot and has an accessible toggle", () => {
  assert.match(tsx, /import claChatMascot from "\.\.\/\.\.\/assets\/cla-chat-mascot\.webp"/);
  assert.match(tsx, /className="cla-chat-launcher-image"/);
  assert.match(tsx, /aria-label=\{open \? "Đóng trợ lý CLA" : "Mở trợ lý CLA"\}/);
  assert.match(tsx, /aria-expanded=\{open\}/);
  assert.match(tsx, /onClick=\{\(\) => setOpen\(value => !value\)\}/);
  assert.ok(fs.statSync(path.join(root, "src/assets/cla-chat-mascot.webp")).size > 1000);
});

test("CLA mascot launcher is circular, fixed to the bottom right, and responsive", () => {
  assert.match(css, /\.cla-chat-root \{[^}]*position:fixed;[^}]*right:/);
  assert.match(css, /\.cla-chat-launcher \{[^}]*width:92px;height:92px;[^}]*border-radius:50%/);
  assert.match(css, /\.cla-chat-launcher-image \{[^}]*object-fit:cover;[^}]*border-radius:50%/);
  assert.match(css, /max-width:480px\) \{ \.cla-chat-launcher \{ width:74px;height:74px/);
});
