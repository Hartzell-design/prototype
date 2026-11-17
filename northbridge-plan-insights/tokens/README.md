# Northbridge design tokens

Design tokens pulled from the Northbridge Plan Insights dashboard prototype. Northbridge is a fictional record-keeper, and every color, size and font here comes from the prototype's CSS.

| File | What it is |
|---|---|
| `tokens.json` | **Source of truth.** W3C Design Tokens (DTCG) format, arranged as Tokens Studio token sets |
| `tokens.css` | Generated CSS custom properties. Don't edit it by hand |
| `build.mjs` | Builds `tokens.css` and `figma/*.json` from `tokens.json` (Node 18+, no dependencies) |
| `validate.mjs` | Checks the JSON, aliases, mode parity, source fidelity, regeneration and brand rules |
| `figma/` | Generated plain DTCG files, one per Figma collection mode, for Figma's native variable import |

```bash
node build.mjs          # regenerate tokens.css + figma/*.json
node build.mjs --check  # fail if the generated files are stale
node validate.mjs       # full validation against the dashboard HTML
```

## Structure

`tokens.json` has three token sets plus Tokens Studio metadata (`$themes`, `$metadata`):

- **`primitive`**: raw values with no meaning attached, shared by both versions.
  - **Color ramps:** `forest` (the 2026 signature, `900` = #123F37), `brass` (accent, `500` = #B08D57), `stone` (ivory and stone), `neutral`, `ink`, `gray`, `slate`, `red`, `green`, and the legacy-only `teal`, `cool`, `amber`, `violet` and `blue`. There is also `alpha`, which holds translucent colors as 8-digit hex.
  - **Type and layout scales:** `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `space`, `radius`, `border-width`, `shadow`, `easing` and `duration`.
  - **Ramp step numbers** follow lightness: higher means darker. Gaps are intentional. Only steps the dashboards actually use exist, so nothing is interpolated.
- **`northbridge-2026`** and **`legacy`**: semantic sets with *identical* paths. Each value is an alias such as `{color.forest.900}`, so the two sets act as two modes of one collection. The semantic groups are:
  - `bg`, `surface`, `text`, `border` and `accent`
  - `status.positive`, `status.warning`, `status.negative` and `status.info` (positive means *Observed*, warning means *Inferred*, info means *Not inferred* or privacy), plus `status.live`
  - `focus` and `overlay`
  - `dataviz.series.*`, `dataviz.categorical.*`, axis, grid, track and the heatmap end points
  - `identity` (role avatars), `elevation` (shadows), `shape` (radii), `font` and `type` (typography composites)

Aliases follow the Tokens Studio convention, so the set name is left out: `{color.forest.900}`, not `{primitive.color.forest.900}`.

### Why one collection with two modes

The semantic layer is a single collection, **Semantic**, with modes `northbridge-2026` and `legacy`. Primitives are a separate single-mode collection, **Primitives**. Components bind to semantic variables only, so switching a frame between the current look and the pre-rebrand look is one mode switch in Figma, or one `data-theme` attribute in code. Primitives hold both palettes because neither version overrides a raw value. Only the semantic mapping changes.

## Import into Figma

**Option A: Tokens Studio (recommended)**
1. In the Tokens Studio plugin, choose *Load from file* (or sync a repo) and pick `tokens.json`. You'll get the sets `primitive`, `northbridge-2026` and `legacy`, plus the themes from `$themes`.
2. Two theme groups are defined:
   - **Primitives**, with one theme, `value`, that enables `primitive`.
   - **Semantic**, with themes `northbridge-2026` and `legacy`. In each, `primitive` is a *source* set and the matching semantic set is enabled.
3. Run *Styles & Variables → Export to Figma*, with variables and themes selected. You'll get a **Primitives** collection and a **Semantic** collection with two modes, and semantic variables alias the primitives. Shadow and typography tokens become effect and text styles, since Figma variables can't hold composites. Exporting themes as modes requires Tokens Studio Pro.

**Option B: Figma's native variable import (DTCG JSON)**
1. Run `node build.mjs`.
2. Create the collection *Primitives*, then import `figma/primitives.json`.
3. Create the collection *Semantic* and import `figma/semantic.northbridge-2026.json` as its first mode. Add a mode named `legacy` and import `figma/semantic.legacy.json` into it.
4. Shadow and typography composites aren't variable types, so the importer may skip them. Use Option A, or create those styles by hand.

Not tested inside Figma: the import steps above follow the DTCG layout these tools expect, but they haven't been run against Figma itself. Colors are plain hex strings, the format these importers accept most widely, not the 2025 DTCG color objects. Letter spacing uses `em`, which Tokens Studio and CSS accept but strict DTCG `dimension` (px/rem only) does not.

## Use in React

```jsx
// main.jsx
import "@northbridge/tokens/tokens.css"; // or a relative path to tokens.css

// Theme switch: the default is northbridge-2026; legacy is one attribute away
export function ThemeScope({ legacy = false, children }) {
  return <div data-theme={legacy ? "legacy" : undefined}>{children}</div>;
}

// Components reference semantic variables only, never primitives
const Card = ({ title, value }) => (
  <section style={{
    background: "var(--nb-surface-default)",
    border: "1px solid var(--nb-border-default)",
    borderRadius: "var(--nb-shape-radius-card)",
    boxShadow: "var(--nb-elevation-card)",
    padding: "var(--nb-space-16)",
  }}>
    <h4 style={{ font: "var(--nb-type-label-caps-font-weight) var(--nb-type-label-caps-font-size)/var(--nb-type-label-caps-line-height) var(--nb-type-label-caps-font-family)", color: "var(--nb-text-muted)" }}>{title}</h4>
    <div style={{ fontFamily: "var(--nb-type-metric-font-family)", fontSize: "var(--nb-type-metric-font-size)", fontVariantNumeric: "tabular-nums lining-nums" }}>{value}</div>
  </section>
);
```

Naming: `--nb-` followed by the token path joined with dashes. For example, `bg.canvas` becomes `--nb-bg-canvas`, `status.positive.fg` becomes `--nb-status-positive-fg`, and `color.forest.900` becomes `--nb-color-forest-900`. Typography composites expand into `-font-family`, `-font-size`, `-font-weight`, `-line-height` and `-letter-spacing`. Tailwind or CSS-in-JS can map their theme keys to these same variables.

## Provenance and gaps

- **Current values** come from `engagement-dashboard/index.html`, from its `:root` and the "Institutional identity layer" CSS. **Legacy values** come from the pre-rebrand build, `/tmp/engagement-dashboard-pre-redesign.html`.
- **No colors were added.** Every primitive color appears in the source HTML, and `validate.mjs` checks this. Two of them, the `alpha.*-heat-*` values, are the end points of the cohort-heatmap formula in the dashboard's JavaScript.
- **Left out on purpose:**
  - One-off hover and selected tints used by a single element (for example #F7F9F8 and #F5F8F7).
  - The legacy gradient (`--grad`) and the unused `--ai1`/`--ai2` variables.
  - SVG logo stroke widths.
  - JavaScript-only animation timings.
- **`status.negative`** (#B42318) is the standard error red. It is used only for errors, never as a brand color. The brand palettes have no maroon or burgundy, and the validator checks for it.
