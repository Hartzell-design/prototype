/**
 * SVG gradient definitions used only by the legacy era skin (src/styles/legacy-skin.css),
 * for the 2011-style "chrome" chart bars and area fill. Stop colors are set in CSS from tokens.
 */
export function LegacyDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="nb-legacy-bar" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className="nb-legacy-stop--teal-dark" />
          <stop offset=".45" className="nb-legacy-stop--teal-light" />
          <stop offset="1" className="nb-legacy-stop--teal-dark" />
        </linearGradient>
        <linearGradient id="nb-legacy-bar-2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className="nb-legacy-stop--amber-dark" />
          <stop offset=".45" className="nb-legacy-stop--amber-light" />
          <stop offset="1" className="nb-legacy-stop--amber-dark" />
        </linearGradient>
        <linearGradient id="nb-legacy-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="nb-legacy-stop--area-top" />
          <stop offset="1" className="nb-legacy-stop--area-bottom" />
        </linearGradient>
      </defs>
    </svg>
  );
}
