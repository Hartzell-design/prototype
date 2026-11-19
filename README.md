# prototype

Static prototypes for [Hartzell Design](https://hartzell.design). Most are single static HTML files with no build step. Northbridge Plan Insights is a Vite + React app; the Pages workflow builds it and publishes its `dist/`.

Live site: https://hartzell-design.github.io/prototype/

The root `index.html` redirects to the onboarding copilot prototype.

## Prototypes

- [Onboarding Copilot](https://hartzell-design.github.io/prototype/onboarding-copilot/) — an AI copilot that turns a long account-opening form into a guided conversation, with document extraction, confidence indicators, and a human review step.
- [Stageiron](https://hartzell-design.github.io/prototype/stageiron/) — an AI sales demo platform that builds a tailored product demo for each prospect, with a phone preview in the builder, desktop and phone side-by-side present mode, a QR code to open the demo on a phone, a 390px layout, and a 10-step tour.
- [Wayloom](https://hartzell-design.github.io/prototype/wayloom/) — an AI journey-mapping app for process owners.
- [Northbridge Plan Insights](https://hartzell-design.github.io/prototype/northbridge-plan-insights/) — a plan-sponsor engagement dashboard rebuilt from two legacy designs on the Northbridge 2026 design system, with a live toggle between the new and legacy token themes. Vite + React + TypeScript; see its [README](northbridge-plan-insights/README.md) and [case study notes](northbridge-plan-insights/CASE_STUDY_NOTES.md).

## Changes

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Publishing

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which builds Northbridge Plan Insights, copies everything else as-is, and deploys with the official GitHub Pages actions. `.nojekyll` keeps Pages from processing the files with Jekyll.

Pages source is GitHub Actions, so each push to `main` publishes the site.
