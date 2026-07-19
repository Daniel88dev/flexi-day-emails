# flexi-day-emails

Transactional email templates for **flexiday**, built with
[react-email](https://react.email), rendered to static HTML at build time and
synced to **AWS SES as native templates** (Handlebars-style `{{variable}}`
placeholders).

There is no runtime rendering service and no Lambda — the backend
(`flexi-day-be`) sends via SESv2 `SendEmail` with the `Template` content type
(see [INTEGRATION.md](INTEGRATION.md)). The only recurring cost is SES
sending fees.

```
emails/                  react-email templates (one file per template)
src/theme.ts             design tokens extracted from the flexi-day frontend
src/components/          shared layout: Logo, EmailLayout, Button
src/render.ts            renders all templates to out/ (HTML + text + manifest)
src/verify.ts            asserts {{placeholders}} survived rendering
src/sync-templates.ts    idempotent upsert to SES via @aws-sdk/client-sesv2
terraform/               SES identity + DKIM + config set + GitHub OIDC role
.github/workflows/       CI: verify on PR, sync on main (dev → approved prod)
```

## Local preview

```sh
npm install
npm run dev        # react-email preview server on http://localhost:3000
```

The preview shows the literal `{{placeholders}}` — that's correct; SES
substitutes them at send time.

## Adding a new template

1. Create `emails/<template-name>.tsx`. It must:
   - `export default` a React component whose **props default to the literal
     placeholder strings** (e.g. `name = "{{name}}"`);
   - `export const subject = "..."` (placeholders allowed in the subject too);
   - use `EmailLayout`, `Button` and `theme.ts` for consistent branding.
2. `npm run build` — renders `out/<template-name>.html` / `.txt` and updates
   `out/manifest.json` (variables are auto-detected from the output).
3. Merge to `main` — CI creates `flexi-day-<template-name>-dev` /
   `-prod` in SES. Then add the variable contract to INTEGRATION.md.

### The placeholder/escaping constraint

SES templates use Handlebars-style `{{variable}}` tokens. The rendered HTML
must contain them **literally** — including inside `href` attributes. React
leaves `{` `}` untouched in text and attributes, but anything that
URL-encodes hrefs or HTML-escapes braces breaks the template.
`src/verify.ts` runs on every build and fails if a token is missing,
URL-encoded (`%7B%7B`) or entity-escaped (`&#123;`). Don't pass placeholders
through `encodeURIComponent`, `new URL()`, or markdown renderers.

## Rendering & syncing

```sh
npm run build      # render out/ + verify placeholders
npm run sync:dev   # build + upsert flexi-day-*-dev templates to SES
npm run sync:prod  # build + upsert flexi-day-*-prod templates to SES
```

Sync is an idempotent upsert (`GetEmailTemplate` → create or update) —
running it twice is safe. Region defaults to `eu-central-1` (override with
`AWS_REGION`). Locally it uses your default AWS credential chain; in CI it
uses the GitHub OIDC role — no long-lived keys anywhere.

## Terraform bootstrap (one-time, run locally)

Terraform manages the SES **infrastructure** only (identity, DKIM,
configuration set, CI role). Templates themselves are owned by the sync
script. State is local, matching `flexi-day-be`'s convention.

```sh
cd terraform
cp terraform.tfvars.example terraform.tfvars   # adjust if needed
terraform init
terraform plan
terraform apply
```

Notes:

- **DKIM**: with `manage_route53_dkim_records = true` (default) the three
  CNAMEs are created in the existing `flexi-day.com` hosted zone. Domain
  verification flips to verified once they propagate (minutes to ~1 h).
- **OIDC provider**: `token.actions.githubusercontent.com` is account-global.
  If another repo already created it, set
  `create_github_oidc_provider = false` (it will be looked up instead).
- After apply, copy the `github_actions_role_arn` output into the GitHub
  repo as an **Actions variable** named `AWS_GHA_ROLE_ARN`
  (Settings → Secrets and variables → Actions → Variables).
- Terraform apply is deliberately manual/local — CI never applies infra.

## CI flow (`.github/workflows/deploy.yml`)

- **Pull request**: `npm ci` → typecheck → render + placeholder verification.
  A broken or escaped `{{token}}` fails the PR.
- **Push to `main`**: same build, then sync to **dev** automatically, then
  sync to **prod** gated by the `production` GitHub environment. Configure a
  required reviewer on that environment
  (Settings → Environments → production → Required reviewers) to make the
  prod sync a one-click manual approval.

## SES sandbox

Until production access is granted (SES console → Account dashboard →
Request production access), SES only delivers to verified recipients — verify
your own address in the console for end-to-end testing.
