# CLAUDE.md

Guidance for Claude Code working in `flexi-day-emails`, the transactional email templates for
Flexi Day. React Email components in `emails/` are rendered to **native SES templates** and pushed
to AWS SES; `flexi-day-be` sends them by name and never renders HTML itself.

## Handlebars placeholders must survive rendering literally

SES substitutes `{{variable}}` tokens at send time, so they have to reach the rendered template
byte-for-byte. Keep them out of anything that transforms text — `encodeURIComponent`, `new URL()`,
markdown — and interpolate them as plain JSX text or raw attribute values. `npm run build` runs
`src/verify.ts`, which fails the build when a token comes out URL-encoded or entity-escaped.

## Pipeline

`npm run build` renders (`src/render.ts`) into `out/` and then verifies. `npm run sync:dev` /
`sync:prod` build and push to SES, naming each template `flexi-day-{template}-{stage}` in
`eu-central-1` — the exact names the backend resolves via `EMAIL_TEMPLATE_STAGE`. `npm run dev`
opens the React Email preview, which binds `:3000` and so collides with the frontend dev server.

There are no tests and no lint. `npm run typecheck` plus `npm run build` is the full check.

## Adding a template

Add the component under `emails/`, share styling through `src/styles.ts` / `src/theme.ts` and
`src/components/` rather than inlining, then `npm run build` to confirm it renders and verifies.
A new template only reaches the backend once `sync:dev` / `sync:prod` has pushed it and the backend
sends that name — see [`INTEGRATION.md`](INTEGRATION.md) for the send-side contract.
