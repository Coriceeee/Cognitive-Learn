/* Lõi ánh xạ màu light → dark (OKLCH). Dùng chung cho tokenize-colors.cjs và check-colors.cjs.
 * Quy tắc theo VAI TRÒ của màu (nền / chữ / viền / bóng / SVG), giữ nguyên hue. */
/* ---------- màu ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function toOklch([r, g, b]) {
  r = lin(r / 255); g = lin(g / 255); b = lin(b / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
}
function fromOklch({ L, C, h }) {
  for (let i = 0; i < 24; i++) {
    const A = C * Math.cos(h), B = C * Math.sin(h);
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return rgb.map((v) => Math.round(gam(clamp(v, 0, 1)) * 255));
    C *= 0.92;
  }
  const g = Math.round(gam(clamp(L, 0, 1)) * 255);
  return [g, g, g];
}
const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };
function parseColor(tok) {
  tok = tok.trim().toLowerCase();
  if (NAMED[tok]) return { rgb: NAMED[tok], a: 1 };
  if (tok[0] === "#") {
    let h = tok.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { rgb: [n(0), n(2), n(4)], a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const m = tok.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,\/]+/).filter(Boolean);
    if (p.length < 3 || p.some((x) => x.includes("var("))) return null;
    const ch = (x) => (x.endsWith("%") ? (parseFloat(x) / 100) * 255 : parseFloat(x));
    let a = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return { rgb: [ch(p[0]), ch(p[1]), ch(p[2])], a };
  }
  return null;
}
const fmt = (rgb, a) =>
  a >= 0.999 ? "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("")
             : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${+a.toFixed(3)})`;

/* ---------- ánh xạ theo vai trò ---------- */
const NAVY = (262 * Math.PI) / 180; // hue xanh navy cho màu trung tính
const tint = (C, h, c0) => (C < 0.012 ? { C: c0, h: NAVY } : { C, h });
const mapBg = ({ L, C, h }) => {
  if (L < 0.62) return { L, C, h };
  const t = tint(Math.min(C * 0.8, 0.1), h, 0.032);
  return { L: clamp(0.19 + (1 - L) * 1.6, 0.17, 0.4), ...t };
};
const mapText = ({ L, C, h }) => {
  if (L >= 0.74) return { L, C, h };
  const t = tint(C * 0.85, h, 0.02);
  const Ln = clamp(0.97 - 0.5 * L, 0.62, 0.94);
  if (Ln <= L + 0.005) return { L, C, h }; // đã đủ sáng trên nền tối: giữ nguyên, không làm tối/nhạt
  return { L: Ln, ...t };
};
const mapBorder = ({ L, C, h }) => {
  if (L < 0.7) return { L, C, h };
  const t = tint(Math.min(C, 0.04), h, 0.03);
  return { L: 0.27 + (1 - L) * 0.5, ...t };
};
function role(prop) {
  if (/shadow|drop-shadow/.test(prop)) return "shadow";
  if (/^(background|background-color|background-image)$/.test(prop)) return "bg";
  if (/border|outline|column-rule/.test(prop)) return "border";
  if (prop === "stroke") return "stroke";
  if (prop === "fill" || prop === "stop-color" || prop === "flood-color") return "fill";
  return "text";
}
function roleByName(name) {
  if (/bg|surface|paper|page|canvas|panel|card|soft|wash|tint/.test(name)) return "bg";
  if (/line|border|rule/.test(name)) return "border";
  return "text";
}
function mapOne(color, r) { // trả về chuỗi màu dark, hoặc null nếu dark giữ nguyên
  const { rgb, a } = color;
  const k = toOklch(rgb);
  let o, alpha = a;
  // Lớp phủ trắng trong suốt (kính trên nền tối) giữ nguyên ở dark mode.
  if ((r === "bg" || r === "border") && k.L > 0.7 && a < 0.35) return null;
  if (r === "shadow") {
    return k.L > 0.7 ? fmt(fromOklch({ L: 0.3, C: 0.02, h: k.h }), Math.min(a, 0.5)) : fmt([2, 6, 20], clamp(a * 2 + 0.06, 0, 0.7));
  }
  if (r === "fill") o = k.L >= 0.82 ? mapBg(k) : mapText(k);
  else if (r === "stroke") o = k.L >= 0.7 ? mapBorder(k) : mapText(k);
  else o = r === "bg" ? mapBg(k) : r === "border" ? mapBorder(k) : mapText(k);
  const rgb2 = fromOklch(o);
  if (rgb2.every((v, i) => Math.abs(v - rgb[i]) < 2)) return null;
  return fmt(rgb2, alpha);
}
const COLOR_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^()]*\)|\b(?:white|black)\b/g;
function mapValue(value, r) {
  let changed = false;
  const out = value.replace(COLOR_RE, (tok) => {
    const c = parseColor(tok);
    if (!c) return tok;
    const m = mapOne(c, r);
    if (m === null) return tok;
    changed = true;
    return m;
  });
  return changed ? out : null;
}


module.exports = { toOklch, fromOklch, parseColor, mapOne, mapBg, mapText, mapBorder, role, roleByName, COLOR_RE, NAVY, clamp, lin };
