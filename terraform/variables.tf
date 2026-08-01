# General Configuration
variable "aws_region" {
  description = "AWS region for resources (same region flexi-day-be runs in)"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "flexi-day-emails"
}

# GitHub Actions OIDC
#
# This is the exact prefix of the OIDC 'sub' claim GitHub puts in the token,
# minus the trailing ":<context>". Newer repos (this one) use the IMMUTABLE
# format that embeds numeric owner/repo IDs and is stable across renames:
#   repo:Daniel88dev@<ownerId>/flexi-day-emails@<repoId>
# Older repos use the legacy "repo:<owner>/<repo>" format. IAM trust matching
# is case-sensitive, so the case must match GitHub's canonical owner login too.
#
# Get the exact value for any repo with:
#   gh api /repos/<owner>/<repo>/actions/oidc/customization/sub --jq .sub_claim_prefix
variable "github_oidc_sub_prefix" {
  description = "OIDC 'sub' claim prefix GitHub sends for this repo's workflows (from actions/oidc/customization/sub). The trust policy matches this + ':*'."
  type        = string
  default     = "repo:Daniel88dev@64728456/flexi-day-emails@1306024515"
}

variable "create_github_oidc_provider" {
  description = "Create the token.actions.githubusercontent.com OIDC provider. It is account-global and already exists in this account (flexi-day-be uses it), so this defaults to false and the provider is looked up instead."
  type        = bool
  default     = false
}

# Inbound email forwarding
variable "hosted_zone_name" {
  description = "Route 53 public hosted zone for the domain that receives mail. Its zone is looked up, not created (managed alongside flexi-day-be)."
  type        = string
  default     = "flexi-day.com"
}

variable "forward_to_email" {
  description = "Personal inbox that inbound mail is forwarded to. Must be reachable; if the SES account is still in sandbox mode it must also be a verified identity."
  type        = string
  default     = "daniel@hrynusiw.cz"
}

variable "from_email" {
  description = "Verified domain address used as the rewritten From on forwarded mail (SES cannot send from an unverified address). Original sender goes to Reply-To."
  type        = string
  default     = "support@flexi-day.com"
}

variable "subject_prefix" {
  description = "Optional prefix prepended to the Subject of forwarded mail."
  type        = string
  default     = ""
}

variable "mail_retention_days" {
  description = "Days to keep raw received messages in S3 before lifecycle expiry."
  type        = number
  default     = 30
}

variable "manage_spf_record" {
  description = "Publish an SPF TXT record (v=spf1 include:amazonses.com ~all) at the apex. Disable if an apex TXT/SPF is managed elsewhere."
  type        = bool
  default     = true
}
