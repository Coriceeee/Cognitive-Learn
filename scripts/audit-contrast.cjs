/* Kiểm toán tương phản: với mỗi rule có cả màu chữ lẫn màu nền, tính WCAG contrast ở light và dark.
 *   node scripts/audit-contrast.cjs [--all]   → in các rule bị TỆ ĐI ở dark (contrast < 3 trong khi light ≥ 3). */
const fs = require("fs"), path = require("path"), postcss = require("postcss");
const M = require("./theme-map.cjs");
const SRC = path.join(__dirname, "..", "src");
const tok = fs.readFileSync(path.join(SRC, "styles", "00a-theme-tokens.css"), "utf8");
const [lightBlock, darkBlock] = tok.split(':root[data-theme="dark"]');
const tbl = (b) => Object.fromEntries([...b.matchAll(/(--tc-[\w-]+):([\d ]+);/g)].map((m) => [m[1], m[2].trim().split(" ").map(Number)]));
const T = { light: tbl(lightBlock), dark: tbl(darkBlock) };
const RE = /rgb\(var\((--tc-[\w-]+)\)(?:\s*\/\s*(?:calc\(([\d.]+) \* var\(--k-sh\)\)|([\d.]+)))?\)/;
function colorOf(v, theme) {
  const m = v.match(RE);
  if (m) { const c = T[theme][m[1]]; return { rgb: c, a: m[3] ? +m[3] : 1 }; }
  const lit = (v.match(M.COLOR_RE) || [])[0];
  const c = lit && M.parseColor(lit);
  return c ? { rgb: c.rgb, a: c.a } : null;
}
const rl = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const cr = (a, b) => { const x = rl(a), y = rl(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== "assets") walk(p); } else if (/\.css$/.test(e.name) && !/00a-|37-|backup/.test(e.name)) files.push(p); } })(SRC);
const worse = []; let checked = 0;
for (const f of files) postcss.parse(fs.readFileSync(f, "utf8")).walkRules((r) => {
  let tx, bg;
  r.walkDecls((d) => { if (d.prop === "color") tx = d.value; if (/^background(-color)?$/.test(d.prop) && !/gradient|url/.test(d.value)) bg = d.value; });
  if (!tx || !bg) return;
  const out = {};
  for (const th of ["light", "dark"]) { const t = colorOf(tx, th), b = colorOf(bg, th); if (!t || !b || b.a < 0.6 || t.a < 0.6) return; out[th] = cr(t.rgb, b.rgb); }
  checked++;
  if (out.dark < 3 && (out.light >= 3 || process.argv.includes("--abs"))) worse.push({ at: `${path.relative(SRC, f)}:${r.source.start.line}`, sel: r.selector.slice(0, 60), light: out.light.toFixed(1), dark: out.dark.toFixed(1) });
});
console.log(`Đã kiểm ${checked} rule có cả chữ và nền; ${worse.length} rule tệ đi ở dark.`);
worse.slice(0, process.argv.includes("--all") ? 999 : 25).forEach((w) => console.log(`${w.at}  ${w.sel}  light ${w.light} → dark ${w.dark}`));
process.exitCode = worse.length ? 1 : 0;
