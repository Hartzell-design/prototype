import type { Theme } from "../theme";
import "./Segmented.css";

export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="nb-segmented" role="group" aria-label="Design system theme">
      <button type="button" aria-pressed={theme === "northbridge-2026"} onClick={() => onChange("northbridge-2026")}>Northbridge 2026</button>
      <button type="button" aria-pressed={theme === "legacy"} onClick={() => onChange("legacy")}>Legacy</button>
    </div>
  );
}
