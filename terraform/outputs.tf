output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (set as AWS_GHA_ROLE_ARN repository variable)"
  value       = aws_iam_role.github_actions.arn
}
