/* Guard chống tái phát nguyên nhân gốc: báo mọi màu viết cứng mà dark mode sẽ cần đổi.
 *   node scripts/check-colors.cjs        (thoát mã 1 nếu có vi phạm → gắn vào CI/pre-commit)
 * Cách sửa: dùng token (var(--t-ink), var(--t-line)...) hoặc rgb(var(--tc-...)) thay vì #hex / rgba(). */
const fs = require("fs"), path = require("path"), postcss = require("postcss");
const M = require("./theme-map.cjs");
const SRC = path.join(__dirname, "..", "src");
const IGNORE = [/styles[\\/]00a-theme-tokens\.css$/, /styles[\\/]37-cla-orbital-theme\.css$/, /lib[\\/]theme\.ts$/, /[\\/]data[\\/]/, /backup/];
const bad = [];
const attrRole = (a) => (/^(fill|stopColor|floodColor)$/.test(a) ? "fill" : a === "stroke" ? "stroke" : /^(background|backgroundColor|backgroundImage)$/.test(a) ? "bg" : /border|outline/i.test(a) ? "border" : "text");
function test(tok, r, where) {
  const c = M.parseColor(tok);
  if (!c) return;
  const L = M.toOklch(c.rgb).L;
  if (r === "shadow") { if (L > 0.7 && c.a < 0.35) return; bad.push(`${where}  ${tok}  (vai trò ${r})`); return; }
  if (M.mapOne(c, r) !== null) bad.push(`${where}  ${tok}  (vai trò ${r})`);
}
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") walk(p); continue; }
    if (IGNORE.some((re) => re.test(p))) continue;
    const rel = path.relative(SRC, p);
    if (/\.css$/.test(e.name)) {
      postcss.parse(fs.readFileSync(p, "utf8")).walkDecls((d) => {
        if (d.prop.startsWith("--") && !/^--(cla-chat|obs|instrument)-/.test(d.prop)) return;
        if (/^(content|font-family|src)$/.test(d.prop)) return;
        const r = d.prop.startsWith("--") ? M.roleByName(d.prop) : M.role(d.prop);
        (d.value.split(/(url\([^)]*\))/g).filter((x) => !x.startsWith("url(")).join("").match(M.COLOR_RE) || []).forEach((t) => test(t, r, `${rel}:${d.source.start.line}`));
      });
    } else if (/\.tsx?$/.test(e.name)) {
      const text = fs.readFileSync(p, "utf8");
      if (text.includes("theme-neutral-file")) continue;
      text.split("\n").forEach((line, i) => {
        if (line.includes("theme-neutral")) return; // màu cố ý không đổi theo theme (vd. canvas luôn tối)
        for (const m of line.matchAll(/(\w+)\s*[=:]\s*\{?\s*[\\"'`]*(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g)) test(m[2], attrRole(m[1]), `${rel}:${i + 1}`);
        // literal đứng một mình (vd. phép toán ba ngôi): coi là vai trò "text"
        for (const m of line.matchAll(/[?:]\s*["'](#[0-9a-fA-F]{3,8})["']/g)) test(m[1], "text", `${rel}:${i + 1}`);
      });
    }
  }
})(SRC);
if (bad.length) { console.log(`${bad.length} màu viết cứng sẽ sai ở dark mode:\n` + bad.join("\n")); process.exit(1); }
console.log("OK: không còn màu viết cứng nào phụ thuộc theme.");
