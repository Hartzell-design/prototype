# prototype

Static prototypes for [Hartzell Design](https://hartzell.design). There is no build step. GitHub Pages serves the repository root.

Live site: https://hartzell-design.github.io/prototype/

The root `index.html` redirects to the onboarding copilot prototype.

## Prototypes

- [Onboarding Copilot](https://hartzell-design.github.io/prototype/onboarding-copilot/) — an AI copilot that turns a long account-opening form into a guided conversation, with document extraction, confidence indicators, and a human review step.
- [Demosmith](https://hartzell-design.github.io/prototype/demosmith/) — an AI sales demo platform that builds a tailored product demo for each prospect.
- [Wayloom](https://hartzell-design.github.io/prototype/wayloom/) — an AI journey-mapping app for process owners.

## Publishing

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which deploys the repository root with the official GitHub Pages actions. `.nojekyll` keeps Pages from processing the files with Jekyll.

Pages source is GitHub Actions, so each push to `main` publishes the site.
