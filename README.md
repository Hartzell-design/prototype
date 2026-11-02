# prototype

Static prototypes for [Hartzell Design](https://hartzell.design). There is no build step. GitHub Pages serves the repository root.

Live site: https://hartzell-design.github.io/prototype/

The root `index.html` redirects to the current prototype.

## Prototypes

- [Onboarding Copilot](onboarding-copilot/) — an AI copilot that turns a long account-opening form into a guided conversation, with document extraction, confidence indicators, and a human review step.
- [NULLDRIVE: Overclock](nulldrive/) — Slipstream design system and a playable three-lap neon street race at the fictional Neo-Kyoto Night GP.

## Publishing

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which deploys the repository root with the official GitHub Pages actions. `.nojekyll` keeps Pages from processing the files with Jekyll.

Pages source is GitHub Actions, so each push to `main` publishes the site.
