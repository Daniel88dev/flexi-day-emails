output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (set as AWS_GHA_ROLE_ARN repository variable)"
  value       = aws_iam_role.github_actions.arn
}

output "inbound_mail_bucket" {
  description = "S3 bucket storing raw received messages"
  value       = aws_s3_bucket.mail.id
}

output "ses_forwarder_function" {
  description = "Lambda function that forwards inbound mail"
  value       = aws_lambda_function.forwarder.function_name
}

output "inbound_mx_record" {
  description = "MX record published for inbound SES receiving"
  value       = "${aws_route53_record.mx.name} MX ${join(" ", aws_route53_record.mx.records)}"
}
