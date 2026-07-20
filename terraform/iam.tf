# GitHub Actions OIDC federation for template sync — no long-lived AWS keys.
#
# The role can only be assumed by workflows in var.github_repository and can
# only manage SES email templates (least privilege).
#
# This is the ONLY resource this repo's Terraform creates. The SES domain
# identity (flexi-day.com), its Easy DKIM records, and the configuration set
# (flexi-day-emails-production) already exist in the account — created in the
# console / verified — and are intentionally not managed here. Import them
# (see terraform/README.md) only if you want full IaC ownership later.

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_provider_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}

data "aws_iam_policy_document" "template_sync" {
  statement {
    sid    = "ManageProjectTemplates"
    effect = "Allow"
    actions = [
      "ses:CreateEmailTemplate",
      "ses:UpdateEmailTemplate",
      "ses:GetEmailTemplate",
    ]
    resources = [
      "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:template/flexi-day-*",
    ]
  }

  statement {
    sid       = "ListTemplates"
    effect    = "Allow"
    actions   = ["ses:ListEmailTemplates"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

resource "aws_iam_role_policy" "template_sync" {
  name   = "ses-template-sync"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.template_sync.json
}
