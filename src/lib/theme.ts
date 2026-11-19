export type ThemePref = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

const KEY = "cla_theme";
const META_COLOR: Record<ThemeResolved, string> = { light: "#f2f5fb", dark: "#060b1a" };

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* bỏ qua: trình duyệt chặn storage */
  }
  return "system";
}

export function resolveTheme(pref: ThemePref): ThemeResolved {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePref): ThemeResolved {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-pref", pref);
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[resolved]);
  return resolved;
}

export function setThemePref(pref: ThemePref): ThemeResolved {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* bỏ qua */
  }
  return applyTheme(pref);
}
