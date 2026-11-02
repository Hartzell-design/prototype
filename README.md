# prototype

Static prototypes for [Hartzell Design](https://hartzell.design). There is no build step. GitHub Pages serves the repository root.

Live site: https://hartzell-design.github.io/prototype/

The root `index.html` redirects to the current prototype.

## Prototypes

- [Onboarding Copilot](onboarding-copilot/) — an AI copilot that turns a long account-opening form into a guided conversation, with document extraction, confidence indicators, and a human review step.

## Publishing

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which deploys the repository root with the official GitHub Pages actions. `.nojekyll` keeps Pages from processing the files with Jekyll.

The repository owner needs to set **Settings → Pages → Source** to **GitHub Actions** before the site will publish.
