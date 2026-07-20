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
variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to assume the template-sync role. MUST match the owner's canonical case exactly — GitHub's OIDC 'sub' claim preserves it (repo:Daniel88dev/...) and the IAM trust policy uses case-sensitive StringLike."
  type        = string
  default     = "Daniel88dev/flexi-day-emails"
}

variable "create_github_oidc_provider" {
  description = "Create the token.actions.githubusercontent.com OIDC provider. It is account-global and already exists in this account (flexi-day-be uses it), so this defaults to false and the provider is looked up instead."
  type        = bool
  default     = false
}
