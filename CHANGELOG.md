# Changelog

Notable changes to the prototypes in this repository, newest first. Each entry names the prototype it affects.

## Northbridge Plan Insights v1.0 — 2026-11-19

**Live:** https://hartzell-design.github.io/prototype/northbridge-plan-insights/
**Shipped commit:** `d39ac3d` (tag `northbridge-v1.0`)

A new prototype: a plan-sponsor participant engagement dashboard, rebuilt from two legacy designs (2011 and 2016) on the Northbridge 2026 design system. It's a Vite + React + TypeScript app. Northbridge is fictional, and every figure is sample data.

### Added
- **Five working tabs**, each with its own URL (`#overview`, `#engagement`, `#participants`, `#contributions`, `#reports`). The back button and deep links work.
  - **Engagement** (the default view): the rebuilt legacy dashboard, with the beneficiary alert, 4 KPI cards, a 12-month participation chart, the deferral rate distribution, and a sortable, filterable division table.
  - **Overview:** summary cards that link to each tab, a "Needs attention" list, and plan details.
  - **Participants:** enrollment counts, not-enrolled by division, and a directory of 30 sample records you can search and filter. `#participants?beneficiary=missing` opens it pre-filtered.
  - **Contributions:** year-to-date totals, a stacked monthly chart (employee deferrals and employer match), contributions by source, and payroll remittances.
  - **Reports:** seven CSV downloads built from the sample data, plus key plan-year dates.
- **Theme toggle** between Northbridge 2026 and Legacy. It works by switching `data-theme` on the page, and `?theme=legacy` links straight to the legacy look.
- **Legacy era skin:** in legacy mode the app looks circa 2011, with a glossy masthead, beveled tabs and buttons, gradient title bars, gridded zebra tables, metallic chart bars, Verdana type and a fixed-width page. Colors still come from the legacy token palette.
- **Component library** that mirrors the Figma list: Logo, Button, Badge, Tab, Input/Select, Alert, KPI Card, Chart Card, Top Nav Bar and Table, plus Card, BarList and PageHeader.
- **Accessibility features:** every chart has a Chart/Table switch, plus semantic landmarks, a skip link, sortable tables with `aria-sort`, and visible keyboard focus.
- **Token checks:** `npm run lint:tokens` (no hard-coded colors, fonts or px sizes outside the documented exception files) and `npm run tokens:check` (the generated `tokens.css` is up to date).
- **Docs:** `northbridge-plan-insights/README.md`, `CASE_STUDY_NOTES.md`, and screenshots in `docs/screenshots/`.

### Changed
- **Pages workflow** (`.github/workflows/pages.yml`): it now installs Node, runs `npm run check` for Northbridge, and publishes its built `dist/`. The other prototypes are copied as before.
- **Repository README:** lists the new prototype and explains the build step.

### Verified before release
- The build, typecheck, token lint and token freshness check all pass, locally and in the Pages workflow (run #6).
- axe-core 4.10.3 reports 0 violations on all five tabs, in both themes, at 1280px and 390px, with no sideways page scroll.
- Playwright smoke tests covered theme switching, routing and deep links, sorting and filtering, CSV downloads, and the shared reminder state, with no console errors.
- Not tested: real screen readers, Safari, Firefox, or printing on paper.

### Known limitations
- The Figma MCP wasn't used (the connector couldn't connect from the build session). The build worked from the legacy HTML and PNGs plus the token kit.
- The legacy skin is a documented exception to "tokens only," because gradients, bevels and period fonts can't be expressed as tokens.
- On phones, wide tables scroll sideways inside their cards instead of reflowing.
