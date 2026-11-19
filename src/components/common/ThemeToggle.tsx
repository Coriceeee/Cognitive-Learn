import { useEffect, useState, type ReactElement } from "react";
import { applyTheme, getThemePref, setThemePref, type ThemePref } from "../../lib/theme";

const OPTIONS: { value: ThemePref; label: string; icon: ReactElement }[] = [
  {
    value: "light",
    label: "Chế độ sáng",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Theo thiết bị",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 0 0 16z" className="fill" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Chế độ tối",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
      </svg>
    ),
  },
];

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>(() => getThemePref());

  // Khi chọn "theo thiết bị", cập nhật ngay khi hệ điều hành đổi sáng/tối.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function choose(next: ThemePref) {
    setPref(next);
    setThemePref(next);
  }

  return (
    <div className="cla-theme-toggle" role="group" aria-label="Giao diện sáng hoặc tối">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={pref === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => choose(o.value)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
