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

# SES Configuration
variable "sending_domain" {
  description = "Domain to verify as an SES sending identity. Must match the Route 53 hosted zone."
  type        = string
  default     = "flexi-day.com"
}

variable "manage_route53_dkim_records" {
  description = "Create the three DKIM CNAME records in the existing Route 53 hosted zone. Set to false to publish them manually from the dkim_tokens output."
  type        = bool
  default     = true
}

# GitHub Actions OIDC
variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to assume the template-sync role"
  type        = string
  default     = "daniel88dev/flexi-day-emails"
}

variable "create_github_oidc_provider" {
  description = "Create the token.actions.githubusercontent.com OIDC provider. The provider is account-global — set to false and it is looked up instead, if another repo already created it."
  type        = bool
  default     = true
}
