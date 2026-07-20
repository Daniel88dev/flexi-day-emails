# Terraform scope

This configuration manages **only** the IAM role that GitHub Actions assumes
(via OIDC) to sync SES email templates. That's the one thing this repo needs
that doesn't already exist.

## What is intentionally NOT managed here

These already exist in the AWS account and are referenced/assumed, not created:

| Resource | Where it lives | Why not in TF |
| --- | --- | --- |
| SES domain identity `flexi-day.com` | SES console, **verified** | Recreating means re-verifying a live identity |
| Easy DKIM CNAMEs | Route 53 zone `flexi-day.com` | Managed by SES's Easy DKIM already |
| Configuration set `flexi-day-emails-production` | SES console | Created manually; the backend just references its name |
| OIDC provider `token.actions.githubusercontent.com` | IAM, account-global | Shared with `flexi-day-be`; looked up via data source (`create_github_oidc_provider = false`) |

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
