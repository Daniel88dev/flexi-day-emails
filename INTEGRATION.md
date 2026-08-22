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
  `emailVerification.sendVerificationEmail: async ({ user, url, token }) => ...`.
  This originally called the console-logging stub `tempEmailSend`
  (`src/utils/tempEmail.ts`), which **silently skipped sending in production**.
  That stub was what you replaced for verification emails.
- `sendResetPassword` used the same stub, which meant password reset sent
  nothing at all in production. It now uses the `password-reset` template
  below. With no callers left, `src/utils/tempEmail.ts` has been deleted —
  `logEmailSender` covers the no-AWS case.

## SES template contract

Template names (region `eu-central-1`):

| Stage | TemplateName                        |
| ----- | ----------------------------------- |
| dev   | `flexi-day-email-confirmation-dev`  |
| prod  | `flexi-day-email-confirmation-prod` |

`TemplateData` variables (all required; SES renders missing variables as
empty strings, so validate before sending):

| Variable          | Type                    | Example                                                       | Source in better-auth hook                                                                                                                          |
| ----------------- | ----------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | string                  | `"Daniel"`                                                    | `user.name`                                                                                                                                         |
| `confirmationUrl` | string (absolute URL)   | `"https://api.flexi-day.com/api/auth/verify-email?token=..."` | `url`                                                                                                                                               |
| `expiresIn`       | string (human-readable) | `"1 hour"`                                                    | constant — better-auth's default verification-token expiry is 3600 s; if `emailVerification.expiresIn` is ever configured, keep this string in sync |

Configuration set (optional but available): `flexi-day-emails-dev` /
`flexi-day-emails-production`. Sender address must be on the verified
`flexi-day.com` domain, e.g. `no-reply@flexi-day.com`.

## Password reset template

`password-reset` is sent by better-auth's `sendResetPassword` hook when
someone asks for a reset from `/forgot-password/`.

| Template         | Recipient         | Variables                       |
| ---------------- | ----------------- | ------------------------------- |
| `password-reset` | the account owner | `name`, `resetUrl`, `expiresIn` |

`resetUrl` points at better-auth's **own** endpoint
(`{API}/api/auth/reset-password/{token}?callbackURL=…`), not at the frontend:
that endpoint checks the token before bouncing the browser to
`{APP_URL}/reset-password/` with it. The backend overwrites `callbackURL`
rather than trusting the one the request carried, so the mailed link always
lands on a page that can handle it.

This is also how someone who only ever signed in with Google or Microsoft
gets a password — better-auth's `resetPassword` creates the credential
account when the user has none — so the copy must not assume a previous
password existed.

Account mail: it always sends, regardless of
`user_settings.emailNotifications`.

## Two-factor sign-in code template

`two-factor-code` is sent by the better-auth `twoFactor` plugin's `sendOTP`
hook when a user with 2FA enabled requests a code by email — at sign-in or
while enrolling from Settings.

| Template          | Recipient         | Variables                   |
| ----------------- | ----------------- | --------------------------- |
| `two-factor-code` | the account owner | `name`, `code`, `expiresIn` |

`code` is the 6-digit OTP, passed as a **string** (a leading zero must
survive). `expiresIn` is pre-formatted (e.g. `"3 minutes"`) and must match the
plugin's OTP expiry. The subject deliberately carries no code — it would leak
into lock-screen and inbox previews.

Security mail: it always sends, regardless of
`user_settings.emailNotifications`.

## Vacation workflow templates

Four more templates cover the request lifecycle. They follow the same naming
convention (`flexi-day-<name>-<stage>`) and the same rule: **every variable
must be present and non-empty** — pass a placeholder such as `"—"` rather than
an empty string for optional fields (note, reason).

| Template                    | Recipient                                           | Variables                                                                                                                    |
| --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `vacation-approval-request` | group approver                                      | `approverName`, `employeeName`, `teamName`, `leaveType`, `dateRange`, `dayCount`, `note`, `requestUrl`                       |
| `vacation-approved`         | requesting employee                                 | `employeeName`, `approverName`, `teamName`, `leaveType`, `dateRange`, `dayCount`, `requestUrl`                               |
| `vacation-rejected`         | requesting employee                                 | `employeeName`, `approverName`, `teamName`, `leaveType`, `dateRange`, `dayCount`, `reason`, `requestUrl`                     |
| `vacation-cancelled`        | employee, or the approver when the employee cancels | `recipientName`, `employeeName`, `cancelledByName`, `teamName`, `leaveType`, `dateRange`, `dayCount`, `reason`, `requestUrl` |
| `vacation-comment`          | the other party (requester ⇄ approver)              | `recipientName`, `employeeName`, `commenterName`, `teamName`, `leaveType`, `dateRange`, `message`, `requestUrl`              |

`requestUrl` is an absolute frontend URL pointing at the request
(`https://www.flexi-day.com/requests/?vacationId=…`). `dateRange` and
`dayCount` are pre-formatted by the backend (e.g. `"12 – 16 Aug 2026"`,
`"5 days"`) so the templates stay free of formatting logic.

All four are workflow notifications and must respect the recipient's
`emailNotifications` preference (`user_settings` in flexi-day-be); the
confirmation email is transactional and always sends.

## Group invite template

`group-invite` is sent when a group admin invites someone by email
(`POST /api/group-user/{groupId}/invites` in flexi-day-be). It follows the same
naming convention and the same all-variables-non-empty rule.

| Template       | Recipient          | Variables                                                                                     |
| -------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `group-invite` | the invited person | `groupName`, `inviterName`, `inviteCode`, `signUpUrl`, `joinUrl`, `invitedEmail`, `expiresIn` |

The code lives in the email **body only** — `signUpUrl` is the plain sign-up
page and carries no token, so forwarding the link alone grants nothing. The
code is single-use, bound to `invitedEmail`, and expires after `expiresIn`.

This one goes to an address that may not have an account yet, so there is no
`user_settings` row to consult: like the confirmation email it is transactional
and always sends.

**Never put a placeholder inside a `<Heading>`.** The plain-text render
uppercases headings, so `{{groupName}}` becomes `{{GROUPNAME}}` — a token SES
does not substitute, leaving the raw braces visible to anyone reading the text
part. `src/verify.ts` fails the build when the text and HTML parts disagree on
a placeholder's case.

## Subscription grace template

`subscription-grace` is sent by flexi-day-be's Paddle webhook handler when a
subscription payment fails or the subscription is cancelled. Full limits keep
working through a 14-day grace window; after `graceEndsDate`, groups over the
plan's limits become read-only (nothing is deleted).

| Template             | Recipient                        | Variables                                                  |
| -------------------- | -------------------------------- | ---------------------------------------------------------- |
| `subscription-grace` | the organization's billing email | `recipientName`, `planName`, `graceEndsDate`, `billingUrl` |

- `planName` is the plan's display token (`PRO` / `ENTERPRISE`).
- `graceEndsDate` is a pre-formatted human date (e.g. `25 August 2026`) — the
  backend formats it; the template must not.
- `billingUrl` points at the app's billing page (`{APP_URL}/billing/`).

It is billing mail, so it ignores `user_settings.emailNotifications`.

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
         }),
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

   Swap the sender for `logEmailSender` when `config.api.env === "test"` (and
   in `"dev"` without AWS credentials) so tests don't hit AWS. `src/services/
email/index.ts` already does this — do not reintroduce the old
   `tempEmailSend` stub, which is deleted.

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
