output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (set as AWS_GHA_ROLE_ARN repository variable)"
  value       = aws_iam_role.github_actions.arn
}

output "dkim_tokens" {
  description = "Easy DKIM tokens. If manage_route53_dkim_records = false, publish each as CNAME <token>._domainkey.<domain> -> <token>.dkim.amazonses.com"
  value       = aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens
}

output "ses_identity_verification_status" {
  description = "Whether SES has verified the domain identity (flips after DKIM records propagate)"
  value       = aws_sesv2_email_identity.domain.verified_for_sending_status
}

output "configuration_set_name" {
  description = "SES configuration set name for this environment (pass as ConfigurationSetName when sending)"
  value       = aws_sesv2_configuration_set.main.configuration_set_name
}
