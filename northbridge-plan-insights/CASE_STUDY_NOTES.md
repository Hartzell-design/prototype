# Case study notes: Northbridge Plan Insights, legacy to React

Facts from this build only. Northbridge is fictional, all data is sample data, and no metrics are invented. Time saved was **not measured** in this build, so none is claimed.

## What was built

A Vite + React + TypeScript version of the plan-sponsor engagement dashboard. It has the same information architecture and the same sample data as the two legacy designs, so each piece of the old screens maps to one piece of the new one. All styling comes from the Northbridge token kit (`tokens/tokens.css`). A toggle switches `data-theme` between Northbridge 2026 (the default) and `legacy`, so the token swap is visible live.

Screenshots: `docs/screenshots/northbridge-2026-{desktop,mobile}.png` and `docs/screenshots/legacy-{desktop,mobile}.png`.

## Process, as it actually ran

1. **Inputs:** the brief, two legacy HTML files with PNGs, and the token kit (`tokens.json` in DTCG / Tokens Studio format, generated `tokens.css`, build and validate scripts).
2. **Figma MCP:** not used. The Figma connector failed to connect in this session (the network proxy refused it), so the two Figma files weren't read. As the brief allows, the build worked from the legacy HTML/PNGs plus `tokens/`. Component names follow the library list in the brief; they weren't checked against the Figma file itself. The token kit's README says its CSS variable names match the Figma variables' code syntax.
3. **Data:** copied from the legacy HTML. The 12 monthly participation values aren't printed in either legacy file, so they were read back from the SVG line coordinates. Both legacy files give the same values: 82.1, 82.4, 82.9, 83.0, 83.6, 84.0, 84.2, 84.9, 85.1, 85.3, 85.6, 85.8. Division totals reconcile with the KPIs: 1,284 eligible, 1,102 enrolled, 85.8%.
4. **Build:** one component per Figma library item, each with its own CSS file. The page is composed in `App.tsx`.
5. **Verification:** described under "How it was checked" below.

## Legacy to new: what replaced what

| Legacy A (2011) | Legacy B (2016) | New component | Tokens doing the work |
|---|---|---|---|
| Glossy navy gradient masthead, "NorthBridge Online" serif logo | Teal Bootstrap navbar, "**Northbridge** Plan Insights" | **Top Nav Bar** + **Logo** | `surface-inverse`, `border-inverse`, `text-on-inverse`, `text-on-brand(-muted)`, `text-accent-on-brand`, `surface-brand` |
| Beveled gradient tabs (dashboard under "Overview") | Navbar links (dashboard under "Overview") | **Tab** (a link with `aria-current="page"`). The dashboard moved out of Overview into its own **Engagement** tab, which is the default view | `surface-inverse-hover/-selected`, `accent-highlight` for the 3px underline |
| Glossy plan dropdown | Outlined dropdown + avatar circle | **Select** (native `<select>`, inverse tone) + avatar | `surface-inverse-raised`, `border-inverse`, `identity-role-admin` |
| "Print" / "Export to Excel" gradient buttons | Bootstrap `btn` / `btn-primary` | **Button** (secondary, primary, ghost; md, sm) | `accent-primary(-hover)`, `text-on-brand`, `border-strong`, `shape-radius-control` |
| Yellow gradient "Attention:" bar with an "!" disc | Bootstrap `alert-warning`, "Heads up!" | **Alert** (warning) with a title and a "Send reminder" action | `status-warning-fg/-bg/-border` |
| Four boxes with blue gradient headers, 26px bold Arial numbers | Four panels, 36px light teal numbers | **KPI Card** | `type-label-caps-*`, `type-metric-*` (Source Serif 4 44/500 in 2026; sans 34/600 in legacy), `status-positive-fg` / `status-negative-fg` / `text-muted` for deltas |
| Line chart: navy line, orange dots, blue fill, "Options" button | Teal line and fill, "Export" button | **Chart Card** + `ParticipationChart` | `dataviz-series-1`, `accent-soft` (area), `dataviz-grid`, `dataviz-label`, `dataviz-event` (hover guide) |
| Bar chart with a metallic gradient on every bar | Flat teal bars | **Chart Card** + `DeferralChart` | `dataviz-series-1`, `dataviz-bar-muted` (other bars dim on hover), `dataviz-axis` (baseline) |
| Gridded table, zebra stripes, bold green/orange status text | Bootstrap table, solid green/orange labels | **Table** (`TableHeader`, `TableRow`) + **Badge** + **Input** filter | `bg-subtle` header, `border-subtle` rules, `type-label-caps-*`, `status-positive-*` / `status-warning-*`, `dataviz-track` (inline meter) |
| Footer "SAMPLE DATA - FICTIONAL PLAN" tag | Footer "Sample data · fictional plan" tag | Prototype bar above the nav + "Sample data" **Badge** by the title | `status-info-*`, `surface-chip` |

### Changes beyond a reskin

- **Chart/Table switch** on each chart card, in place of the legacy "Options"/"Export" buttons. It shows the same numbers as a real HTML table, which serves keyboard and screen-reader users as well as anyone who wants exact values.
- **Sortable, filterable division table:** sorting uses `aria-sort` and header buttons, and the filter shows an empty-state message when nothing matches. Each row's first cell is a `<th scope="row">`. Division and location are split onto two lines so the name scans first.
- **Inline participation meters** in the table, drawn from the existing data. No new data was added.
- **The alert has a title and an action.** "Send reminder" only marks the reminder as drafted and announces that nothing was sent; it is a prototype.
- **Export CSV** downloads the division table as a CSV headed "Sample data - fictional plan". It replaces "Export to Excel" / "Export CSV", which did nothing in the legacy files.
- **Deltas are spoken in full** ("Up 2.1 points versus last quarter") through visually hidden text. The arrow glyph is hidden from screen readers.
- **Responsive.** The legacy designs were fixed at 960px and 1170px. The new layout runs from 4 to 2 to 1 KPI columns and from a 7/5 split to stacked charts; the nav tabs scroll sideways under the logo, and the table scrolls inside its card.

## The other tabs (added after the first review)

The legacy designs had four tabs, but only Overview was designed. After the first review the dashboard moved into its own **Engagement** tab (the default view), and Overview, Participants, Contributions and Reports were built out with the same components and tokens. Tabs are URL hashes (`#participants` and so on), so the back button and deep links work.

- **Overview:** four section summaries (each card links to its tab), a "Needs attention" list and plan details.
- **Participants:** enrollment KPIs, not-enrolled counts by division, and a directory of 30 sample records you can search and filter by division, status and beneficiary. The alert's "Review participants" link opens it pre-filtered to missing beneficiaries.
- **Contributions:** year-to-date KPIs, a stacked monthly chart (employee deferrals and employer match, with a Table view), contributions by source, and a sortable payroll remittance table.
- **Reports:** seven CSV downloads, filterable by category, plus four key plan-year dates.

New components: **Card**, **BarList** (horizontal bars written as a real list, so it reads without the bars), **PageHeader**, **ButtonLink** and **ContributionsChart**. Everything still passes the token lint.

**About this data.** The legacy files only cover the engagement screen, so the other tabs need more sample data. Where possible it's *derived* from the legacy figures in code rather than typed in:
- 1,284 eligible, 1,102 enrolled and 182 not enrolled are summed from the division table. Not enrolled by division is eligible minus enrolled.
- The deferral distribution adds up to the 1,102 enrolled.
- Contribution totals, the source split and each payroll's amounts are calculated from the monthly figures.

The new values that are made up are all fictional: the 30 participant names, the monthly contribution amounts, the 28% Roth share, rollovers, plan details such as the match formula, and the key dates. The directory says it shows 30 sample records out of 1,284.

The "Send reminder" state is shared: it updates the Engagement alert, the Overview task and the Participants button together.

## Token usage

- **121 distinct tokens** are referenced in `src/` across all five tabs. The first build (Engagement only) used 118: 78 semantic and 40 primitive.
- **Every color is semantic.** `src/` has zero `--nb-color-*` references, so the legacy mode changes every color on the page.
- The **primitives used are scales only**: `space` (13), `font-size` (9), `line-height` (5), `font-weight` (3), `border-width` (3), `letter-spacing` (2), `duration` (2), `easing` (1), `radius-pill` (1) and `shadow-sm` (1). The token set has no semantic layer for spacing or type size outside its typography composites, so these come straight from the scale.
- `npm run lint:tokens` fails the build on any hard-coded hex, rgb/hsl, named color, font family or px size in `src/`. It currently passes.
- `npm run tokens:check` confirms that `tokens.css` matches what `tokens.json` generates.

### The legacy era skin (added after review)

At first the legacy theme was only the token kit's legacy mode: teal colors, rounder corners, sans type and card shadows. That read as circa 2016, not old enough. What really dates a UI to around 2011 can't be expressed as a token: glossy gradient mastheads, beveled tabs and buttons, embossed text, Verdana at 11px, gridded zebra tables, "chrome" gradient chart bars, and a fixed-width white sheet framed on a grey page. So these live in a separate stylesheet, `src/styles/legacy-skin.css`, that applies only under `data-theme="legacy"`.

- **Colors still come from tokens.** The skin uses the legacy palette primitives (`--nb-color-teal-*`, `cool-*`, `amber-*`), and gloss highlights and shadows are `color-mix()` blends of them. SVG gradient stops read the same tokens through CSS (`LegacyDefs.tsx`).
- **It's a deliberate exception to "tokens only".** Pixel sizes and the Verdana/Arial/Georgia font stacks are period detail, so the file is excluded from the token lint (the lint comment says why). Everything the 2026 theme renders is still token-only and still passes the lint.
- **Nothing changes for 2026.** Every rule is scoped to `[data-theme="legacy"]`.
- **Tradeoff:** this is the clearest place where tokens stop. A token swap changes color, type and shape. It doesn't change visual era, and that takes component-level styling.
- Accessibility still holds: axe reports 0 violations on all five tabs in the skinned legacy theme, at desktop and phone widths. Focus uses a period-style dotted outline, kept at 2px.

### What the legacy toggle does and doesn't show

The `legacy` mode is the token kit's pre-rebrand mapping (the teal brand), plus the era skin above, which borrows the *treatments* of Legacy A (2011): gloss, bevels, gradient title bars, Verdana. It keeps the teal brand rather than Legacy A's navy, because navy isn't in the token kit. So the toggle shows the new layout and information architecture dressed in the old brand and the old era's styling. It isn't a pixel copy of either original screen. The two originals are served unchanged at `legacy/` and linked from the footer for a real before/after.

## Decisions and tradeoffs

- **Layout constants are a token gap.** The kit has no tokens for content width, breakpoints or chart height. Three constants live in `src/styles/layout.css` (content max 1200px, gutter, chart height) and are excluded from the lint. Breakpoints (720px, 1040px) are repeated in `@media` rules because CSS can't read custom properties there. All of these are candidates for the token set.
- **Chart geometry lives in TypeScript.** Margins, the 240px plot height and bar-width ratios are numbers in the chart components. They're geometry, not style; all chart colors and type come from tokens through CSS classes.
- **Tabular figures are scoped, not global.** Setting `tabular-nums` on `<body>` widened hyphens and parentheses in Inter ("plan - year", "401 (k)"). It's applied instead to tables, KPI values and deltas, chart text, and the "Data as of" date.
- **Native `<select>`** rather than a custom listbox, for built-in keyboard and screen-reader behavior.
- **The theme toggle sits in a "Prototype" bar above the product nav**, so the demo control doesn't read as a product feature. It's a two-button group using `aria-pressed`.
- **Fonts:** only Source Serif 4 and Inter are loaded. The legacy mode's accent serif (Newsreader) isn't loaded, because the page never uses `--nb-font-accent`.
- **Brand rules:** no maroon or burgundy (the only red is `status-negative`, used for the one negative delta). The logo is an abstract arch with a north tick at its crown: no ships, sails, or lookalike wordmark.
- **Known exceptions to "tokens only":** the favicon is an inline SVG data URL in `index.html` with literal hex values, because a favicon can't read CSS variables. The visually-hidden utility uses the standard 1px clip and is marked `lint-allow`.

## How it was checked

- **TypeScript** in strict mode; `npm run build` passes.
- **axe-core 4.10.3** on all five tabs, both themes, at 1280px and 390px: 0 violations, with no sideways page scroll at either width. The original check for the first build was at 1280px with the WCAG 2.0/2.1 A/AA and best-practice rule sets: **0 violations in both themes**. The first run flagged two landmark issues (the prototype bar was outside a landmark, and two landmarks shared a name); both were fixed.
- **Contrast for SVG text and marks,** which axe doesn't fully cover, was calculated from the token hex values:

  | Pair | 2026 | Legacy |
  |---|---|---|
  | Axis labels on white | 5.78:1 | 5.81:1 |
  | Line and bar color on white | 11.72:1 | 5.32:1 |
  | Warning text on warning background | 5.40:1 | 5.05:1 |
  | Muted text on canvas | 5.24:1 | 5.35:1 |
  | Focus ring on the dark nav | 6.47:1 | n/a |

  The dimmed bars shown on hover (`dataviz-bar-muted`) are 1.52:1 against white. That's intentional de-emphasis while another bar is hovered; every bar keeps its value label.
- **Keyboard:** a skip link, a visible `:focus-visible` ring on everything interactive (brass on the dark nav), and a logical tab order through the toggle, nav, plan select, actions, chart switches, filter and sort headers.
- **Interaction smoke test** in Playwright: the theme toggles both ways, sorting sets `aria-sort`, the filter narrows rows and shows the empty state, the chart Table view renders 12 rows, the reminder announces through `role="status"`, the CSV downloads, and the other tabs show a placeholder. No console errors.
- **Not tested:** real screen readers (VoiceOver, NVDA), Safari, Firefox, and printing on paper. Print CSS exists but wasn't checked against a printout.
