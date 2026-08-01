# Terraform scope

This configuration manages two things this repo needs that don't already exist:

1. The IAM role that GitHub Actions assumes (via OIDC) to sync SES email templates.
2. **Inbound email forwarding** (`email-forwarding.tf`): mail to any address at
   `flexi-day.com` (e.g. `support@`) is received by SES, stored in S3, and
   forwarded to a personal inbox by a Lambda. See "Inbound email forwarding" below.

## What is intentionally NOT managed here

These already exist in the AWS account and are referenced/assumed, not created:

| Resource                                            | Where it lives                | Why not in TF                                                                                 |
| --------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| SES domain identity `flexi-day.com`                 | SES console, **verified**     | Recreating means re-verifying a live identity                                                 |
| Easy DKIM CNAMEs                                    | Route 53 zone `flexi-day.com` | Managed by SES's Easy DKIM already                                                            |
| Configuration set `flexi-day-emails-production`     | SES console                   | Created manually; the backend just references its name                                        |
| OIDC provider `token.actions.githubusercontent.com` | IAM, account-global           | Shared with `flexi-day-be`; looked up via data source (`create_github_oidc_provider = false`) |

## Apply

```sh
terraform init
terraform plan -out=tfplan
terraform apply tfplan   # run this yourself
```

After apply, wire the role into GitHub:

```sh
gh variable set AWS_GHA_ROLE_ARN \
  --repo daniel88dev/flexi-day-emails \
  --body "$(terraform output -raw github_actions_role_arn)"
```

## Optional: bring the existing SES resources under Terraform later

If you ever want full IaC ownership, re-add the resources (see git history for
the original `ses.tf`) and `terraform import` the live ones instead of applying
them fresh — for example:

```sh
terraform import aws_sesv2_email_identity.domain flexi-day.com
terraform import aws_sesv2_configuration_set.main flexi-day-emails-production
# DKIM CNAMEs use for_each; import each with its record key.
```

Import writes them into state without recreating, so nothing is disrupted.

## Inbound email forwarding

`email-forwarding.tf` receives mail sent to `flexi-day.com` and forwards it to a
personal inbox. It stays entirely in `var.aws_region` (`eu-central-1`), where the
domain identity is already verified — SES email receiving is supported there.

Flow: `MX -> SES receipt rule -> S3 (raw message) -> Lambda -> SES SendRawEmail`.
SES cannot send from an unverified `From:`, so the Lambda
(`lambda/ses-forwarder/index.js`) rewrites `From:` to `var.from_email` (a verified
domain address) and preserves the original sender in `Reply-To`. One receipt rule
matches the whole domain, so `support@` **and** any other address are caught.

Key variables (see `variables.tf`): `forward_to_email`, `from_email`,
`subject_prefix`, `mail_retention_days`, `manage_spf_record`.

### Prerequisites

- **SES production access.** If the account is still in the SES sandbox, outbound
  sends only reach verified identities — verify `forward_to_email` in SES, or
  request production access, first. (Prod template sending already works, so the
  account is likely already out of the sandbox.)
- **No conflicting MX.** `flexi-day.com` has no existing MX today; this publishes
  one pointing at SES. Do not also run another mail provider on the apex.
- **Active rule set is a per-region singleton.** This applies one and activates it.

### Cost

Effectively $0/month for a support inbox — no fixed charges. All usage-metered and
within free tiers: SES inbound (1k/mo free), Lambda (free tier), S3 (KBs, expired
after `mail_retention_days`), SES outbound and the MX record (negligible).

### Apply

```sh
terraform init      # picks up the archive provider on first run
terraform plan -out=tfplan
terraform apply tfplan   # run this yourself
```

DNS (MX/SPF) propagation takes a few minutes. Test by emailing `support@flexi-day.com`
and confirming it arrives at `forward_to_email`; the Lambda's CloudWatch logs
(`/aws/lambda/flexi-day-emails-ses-forwarder`) show each forward.
