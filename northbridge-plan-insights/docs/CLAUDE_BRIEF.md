# Northbridge Plan Insights: legacy-to-React upgrade (Claude Code brief)

## Goal
Build a working React prototype of "Northbridge Plan Insights," a plan-sponsor participant engagement dashboard. Upgrade it from two dated designs to the new Northbridge 2026 design system. This is a portfolio case study for chrishartzell.com. The story is Figma design, then the Figma MCP, then Claude Code, then a production-quality React build.

## Inputs (in this folder)
- `legacy/legacy-a-2011.html` + `.png`: dated version A (glossy navy, 960px fixed width).
- `legacy/legacy-b-2016.html` + `.png`: dated version B (Bootstrap 3, old teal brand #0E5E57).
- `tokens/`: Northbridge design tokens. Read `tokens/README.md` first. `tokens.json` is the DTCG source and `tokens.css` holds the CSS custom properties. The current brand sits under `:root` and the old brand under `[data-theme="legacy"]`.
- Figma (read through the Figma MCP if the plan's call limit allows):
  - Legacy dashboards: https://www.figma.com/design/L2L0fKBWaSgg8si8uGRosy (Legacy A at node 2-2, Legacy B at node 1-2)
  - Northbridge Design System: https://www.figma.com/design/utyeTL8IPCMtFItpJtfNEz (variables and components; their code syntax matches `tokens.css`, e.g. `var(--nb-bg-canvas)`)

If Figma MCP calls are blocked, build from the legacy HTML and PNGs plus `tokens/`. The content and data are the same.

## Build
- Use Vite + React + TypeScript. Style with `tokens.css` custom properties only, with no hard-coded colors, sizes or fonts.
- Components should mirror the Figma library: Logo, Button, Badge, Tab, Input/Select, Alert, KPI Card, Chart Card, Top Nav Bar, Table (header and rows).
- Layout: a top nav bar (no sidebar), one alert, 4 KPI cards, a 12-month participation chart, a deferral distribution chart, and a 5-row division table.
- Keep the same information architecture and sample data as the legacy files, so before and after map one-to-one.
- Add a theme toggle that switches `data-theme` between `legacy` and the default, so the token swap is visible live.
- Type: Source Serif 4 for headings, Inter for UI, and tabular figures (`font-variant-numeric: tabular-nums`) on every number.
- Make it responsive and accessible: semantic HTML, keyboard focus states, and AA contrast.

## Brand rules (hard)
- Northbridge is fictional. Never imitate Vanguard: no maroon or burgundy, no ship or sailing imagery, no lookalike wordmark.
- Use sample data only, labelled "Sample data" in the UI. No real screens, copy, data or metrics from any employer.

## Deliverables
1. The React app, with a README covering how to run it.
2. `CASE_STUDY_NOTES.md`: what changed from legacy to new, which tokens and components replaced what, and any decisions or tradeoffs. Use only facts from this build and invent no metrics. If you track time saved, label it measured or estimate.
3. Screenshots of the new dashboard in both themes.
