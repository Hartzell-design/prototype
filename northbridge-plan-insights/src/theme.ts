import { useCallback, useEffect, useState } from "react";

export type Theme = "northbridge-2026" | "legacy";
const KEY = "nb-theme";

function read(): Theme {
  return document.documentElement.getAttribute("data-theme") === "legacy" ? "legacy" : "northbridge-2026";
}

/** The theme lives on <html data-theme>. The default (no attribute) is northbridge-2026. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(read);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "legacy") root.setAttribute("data-theme", "legacy");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage can be blocked; the toggle still works for this visit */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  return [theme, setTheme];
}
