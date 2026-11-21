/** CP44: only the light theme is supported and contrast-tested. This compatibility
 * facade retains old types but prevents stored dark/system preferences activating
 * a partially styled mode. Reintroduce theme choice only after full-site audits. */
export type ThemePref = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

export function getThemePref(): ThemePref { return "light"; }
export function resolveTheme(_pref: ThemePref): ThemeResolved { return "light"; }
export function applyTheme(_pref: ThemePref): ThemeResolved {
  const root = document.documentElement;
  root.setAttribute("data-theme", "light");
  root.setAttribute("data-theme-pref", "light");
  root.style.colorScheme = "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f6f8fc");
  return "light";
}
export function setThemePref(_pref: ThemePref): ThemeResolved {
  return applyTheme("light");
}
