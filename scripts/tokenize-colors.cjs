/* MIGRATION MỘT LẦN: thay mọi màu viết cứng trong src/styles/*.css bằng token ngữ nghĩa.
 *   node scripts/tokenize-colors.cjs --write
 * Sau khi chạy: giá trị light GIỮ NGUYÊN từng pixel; giá trị dark nằm ở 00a-theme-tokens.css.
 * Màu mà dark không cần đổi (nền tối sẵn, lớp phủ trắng mờ...) được để nguyên, không tạo token. */
const fs = require("fs"), path = require("path"), postcss = require("postcss");
const M = require("./theme-map.cjs");
const STYLES = path.join(__dirname, "..", "src", "styles");
const SKIP_FILES = new Set(["00a-theme-tokens.css", "37-cla-orbital-theme.css"]);
const SKIP_PROPS = /^(content|font-family|src|quotes|grid-template-areas)$/;
const SCOPED_VAR = /^--(cla-chat|obs|instrument)-/;
const WRITE = process.argv.includes("--write");

const SRC = path.join(__dirname, "..", "src");
const order = []; // đường dẫn tuyệt đối mọi file .css trong src (gồm CSS đặt cạnh component)
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") walk(p); }
    else if (/\.css$/.test(e.name) && !SKIP_FILES.has(e.name) && !/backup/.test(e.name)) order.push(p);
  }
})(SRC);

const tokens = new Map(); // name -> {light, dark}
const stat = { literal: 0, tokenized: 0, kept: 0 };
const hex6 = (rgb) => rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const ch = (rgb) => rgb.map((v) => Math.round(v)).join(" ");
const aStr = (a) => String(+a.toFixed(3));
const ROLE_KEY = { bg: "bg", border: "bd", text: "tx", fill: "fl", stroke: "sk", shadow: "sh" };

function convert(tok, r) {
  const c = M.parseColor(tok);
  if (!c) return tok;
  stat.literal++;
  const { rgb, a } = c;
  const L = M.toOklch(rgb).L;
  let key, dark, gain = false;
  if (r === "shadow") {
    if (L > 0.7) {                      // highlight sáng (inset trắng)
      if (a < 0.35) { stat.kept++; return tok; }
      const m = M.mapOne(c, "shadow"); key = "hl"; dark = M.parseColor(m).rgb;
    } else { key = "sh"; dark = [2, 6, 20]; gain = true; }
  } else {
    const m = M.mapOne(c, r);
    if (m === null) { stat.kept++; return tok; }
    key = ROLE_KEY[r]; dark = M.parseColor(m).rgb;
  }
  const name = `--tc-${key}-${hex6(rgb)}`;
  const prev = tokens.get(name);
  const entry = { light: ch(rgb), dark: ch(dark) };
  if (prev && (prev.light !== entry.light || prev.dark !== entry.dark)) throw new Error("xung đột token " + name);
  tokens.set(name, entry);
  stat.tokenized++;
  if (gain) return `rgb(var(${name}) / calc(${aStr(a)} * var(--k-sh)))`;
  return a >= 0.999 ? `rgb(var(${name}))` : `rgb(var(${name}) / ${aStr(a)})`;
}
function convertValue(value, r) {
  return value.split(/(url\([^)]*\))/g).map((part) => (part.startsWith("url(") ? part : part.replace(M.COLOR_RE, (t) => convert(t, r)))).join("");
}
function inFontFace(node) { for (let p = node.parent; p; p = p.parent) if (p.type === "atrule" && p.name === "font-face") return true; return false; }

let changedFiles = 0;
for (const f of order) {
  const file = f;
  const root = postcss.parse(fs.readFileSync(file, "utf8"));
  let changed = false;
  root.walkDecls((d) => {
    if (inFontFace(d) || SKIP_PROPS.test(d.prop) || d.value.includes("--tc-")) return;
    let r;
    if (d.prop.startsWith("--")) { if (!SCOPED_VAR.test(d.prop)) return; r = M.roleByName(d.prop); }
    else r = M.role(d.prop);
    const v = convertValue(d.value, r);
    if (v !== d.value) { d.value = v; changed = true; }
  });
  if (changed) { changedFiles++; if (WRITE) fs.writeFileSync(file, root.toString()); }
}

/* ---- Lượt 2: màu trong TSX (thuộc tính SVG, style inline). Tệp có "theme-neutral-file" được bỏ qua. ---- */
const attrRole = (a) => (/^(fill|stopColor|floodColor)$/.test(a) ? "fill" : a === "stroke" ? "stroke" : /^(background|backgroundColor|backgroundImage)$/.test(a) ? "bg" : /border|outline/i.test(a) ? "border" : "text");
const tsx = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets" && e.name !== "data") walk(p); }
    else if (/\.tsx$/.test(e.name)) tsx.push(p);
  }
})(SRC);
let tsxChanged = 0;
for (const file of tsx) {
  const src = fs.readFileSync(file, "utf8");
  if (src.includes("theme-neutral-file")) continue;
  const out = src.split("\n").map((line) => {
    if (line.includes("theme-neutral")) return line;
    line = line.replace(/(\w+)(\s*[=:]\s*\{?\s*[\\"'`]*)(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g, (m, a, mid, t) => a + mid + convert(t, attrRole(a)));
    return line.replace(/([?:]\s*["'])(#[0-9a-fA-F]{3,8})(["'])/g, (m, a, t, b) => a + convert(t, "text") + b);
  }).join("\n");
  if (out !== src) { tsxChanged++; if (WRITE) fs.writeFileSync(file, out); }
}
console.log(`TSX: ${tsxChanged} file đổi`);

const names = [...tokens.keys()].sort();
const block = (sel, key, extra) => `${sel}{\n${extra}${names.map((n) => `  ${n}:${tokens.get(n)[key]};`).join("\n")}\n}\n`;
const css = `/* AUTO-GENERATED bởi scripts/tokenize-colors.cjs – nguồn sự thật duy nhất cho màu light/dark của CSS cũ.
 * Sửa giá trị dark ở đây (hoặc ghi đè trong 37-cla-orbital-theme.css) để tinh chỉnh cả hệ thống.
 * Tên token: --tc-<vai trò>-<hex gốc>. Vai trò: bg nền, tx chữ, bd viền, fl/sk SVG fill/stroke, sh bóng, hl highlight. */
${block(":root", "light", "  --k-sh:1;\n")}${block(':root[data-theme="dark"]', "dark", "  --k-sh:2.2;\n")}`;
console.log(`${WRITE ? "ĐÃ GHI" : "DRY-RUN"}: ${stat.literal} màu → ${stat.tokenized} thay bằng token, ${stat.kept} giữ nguyên (dark không đổi); ${tokens.size} token; ${changedFiles} file`);
if (WRITE) fs.writeFileSync(path.join(STYLES, "00a-theme-tokens.css"), css);
