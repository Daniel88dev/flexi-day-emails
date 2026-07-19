# flexi-day-be integration: send the SES email-confirmation template

> This document is written as a prompt. Paste it into an agent session inside
> the `flexi-day-be` repository to implement the integration.

---

Implement SES-based transactional email sending in this repository
(`flexi-day-be`). The email templates already exist as **native SES templates**
(created by the `flexi-day-emails` repo); this codebase only needs to call
SESv2 `SendEmail` with the `Template` content type. Do not render any HTML
here.

## Current state (verified)

- Email confirmation is **app-driven via better-auth**, not Cognito. There is
  no Cognito in this stack, so no custom-message Lambda trigger is needed —
  wire SES directly into better-auth's hooks.
- `src/utils/auth.ts` configures better-auth with
  `emailVerification.sendVerificationEmail: async ({ user, url, token }) => ...`,
  currently calling the console-logging stub `tempEmailSend`
  (`src/utils/tempEmail.ts`), which **silently skips sending in production**.
  That stub is what you are replacing for verification emails.
- `sendResetPassword` also uses the stub. Only the confirmation template
  exists in SES so far — leave password reset on the stub (or plain-text
  send) and note it as a follow-up.

## SES template contract

Template names (region `eu-central-1`):

| Stage | TemplateName |
| ----- | ------------ |
| dev   | `flexi-day-email-confirmation-dev` |
| prod  | `flexi-day-email-confirmation-prod` |

`TemplateData` variables (all required; SES renders missing variables as
empty strings, so validate before sending):

| Variable | Type | Example | Source in better-auth hook |
| -------- | ---- | ------- | -------------------------- |
| `name` | string | `"Daniel"` | `user.name` |
| `confirmationUrl` | string (absolute URL) | `"https://api.flexi-day.com/api/auth/verify-email?token=..."` | `url` |
| `expiresIn` | string (human-readable) | `"1 hour"` | constant — better-auth's default verification-token expiry is 3600 s; if `emailVerification.expiresIn` is ever configured, keep this string in sync |

Configuration set (optional but available): `flexi-day-emails-dev` /
`flexi-day-emails-production`. Sender address must be on the verified
`flexi-day.com` domain, e.g. `no-reply@flexi-day.com`.

## Implementation instructions

1. Install `@aws-sdk/client-sesv2`.
2. Follow this codebase's existing layering (controllers → services → utils,
   config via `src/config.ts`). Define a small domain-facing port so callers
   never touch the AWS SDK directly:

   ```ts
   // src/services/email/emailSender.ts
   export interface TemplatedEmail {
     to: string;
     template: "email-confirmation";
     data: { name: string; confirmationUrl: string; expiresIn: string };
   }

   export interface EmailSender {
     sendTemplated(email: TemplatedEmail): Promise<void>;
   }
   ```

3. Implement the SES adapter behind that port:

   ```ts
   // src/services/email/sesEmailSender.ts
   import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
   import type { EmailSender, TemplatedEmail } from "./emailSender.js";

   const STAGE = process.env.EMAIL_TEMPLATE_STAGE ?? "dev"; // "dev" | "prod"

   const client = new SESv2Client({
     region: process.env.AWS_REGION ?? "eu-central-1",
   });

   export const sesEmailSender: EmailSender = {
     async sendTemplated({ to, template, data }: TemplatedEmail) {
       await client.send(
         new SendEmailCommand({
           FromEmailAddress: process.env.EMAIL_FROM ?? "no-reply@flexi-day.com",
           Destination: { ToAddresses: [to] },
           ConfigurationSetName: process.env.SES_CONFIGURATION_SET, // optional
           Content: {
             Template: {
               TemplateName: `flexi-day-${template}-${STAGE}`,
               TemplateData: JSON.stringify(data),
             },
           },
         })
       );
     },
   };
   ```

   Extend `src/config.ts` with these env vars following its `envOrThrow`
   pattern (`EMAIL_FROM`, `EMAIL_TEMPLATE_STAGE`, optional
   `SES_CONFIGURATION_SET`) rather than reading `process.env` inline as the
   sketch above does.

4. Wire it into `src/utils/auth.ts`:

   ```ts
   emailVerification: {
     sendVerificationEmail: async ({ user, url }) => {
       await sesEmailSender.sendTemplated({
         to: user.email,
         template: "email-confirmation",
         data: { name: user.name, confirmationUrl: url, expiresIn: "1 hour" },
       });
     },
     ...
   }
   ```

   Keep `tempEmailSend` as the implementation when `config.api.env === "test"`
   (and optionally `"dev"` without AWS credentials) so tests don't hit AWS.

5. Handle send failures: log via the existing `logger` middleware and do not
   crash signup — better-auth surfaces resend, and a failed email must not
   roll back user creation.

## IAM

The App Runner instance role (see `terraform/iam.tf` in this repo) needs:

```json
{
  "Effect": "Allow",
  "Action": ["ses:SendEmail", "ses:SendTemplatedEmail"],
  "Resource": [
    "arn:aws:ses:eu-central-1:<account-id>:identity/flexi-day.com",
    "arn:aws:ses:eu-central-1:<account-id>:template/flexi-day-*",
    "arn:aws:ses:eu-central-1:<account-id>:configuration-set/flexi-day-emails-*"
  ]
}
```

(`ses:SendEmail` covers SESv2; `ses:SendTemplatedEmail` covers the classic
API if ever used. SESv2 authorizes against identity, template and
configuration-set ARNs.)

## SES sandbox caveat

New SES accounts start in **sandbox mode**: emails can only be delivered to
verified addresses/domains, and quotas are minimal. Until production access
is granted, every test recipient must be verified in the SES console
(eu-central-1 → Verified identities). Request production access in the SES
console (Account dashboard → Request production access) before launch —
approval usually takes ~24 h.
