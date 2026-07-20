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
