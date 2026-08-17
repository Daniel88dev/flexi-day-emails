# Inbound email forwarding: mail to any address at flexi-day.com (e.g.
# support@flexi-day.com) is received by SES, stored in S3, and forwarded to a
# personal inbox by a Lambda. SES cannot send from an unverified "From:", so
# the Lambda rewrites From to a verified domain address and puts the original
# sender in Reply-To (see lambda/ses-forwarder/index.js).
#
# The SES domain identity (flexi-day.com) and its DKIM already exist and are
# verified in this region (var.aws_region). Everything below stays in that
# same region so inbound receiving works against the verified identity.
#
# NOTE: activating a receipt rule set is a per-region singleton. This account
# has no inbound receiving today, so activating ours is safe. If inbound rules
# are ever added elsewhere, reconcile them into one active set.

locals {
  mail_bucket_name = "${var.project_name}-incoming-mail-${data.aws_caller_identity.current.account_id}"
  mail_key_prefix  = "incoming/"
}

# --- DNS: point the domain's mail at SES, publish SPF ------------------------

data "aws_route53_zone" "main" {
  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.hosted_zone_name
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.${var.aws_region}.amazonaws.com"]
}

# Route 53 keeps every TXT value for one name in a SINGLE record set, so this
# resource owns the apex TXT outright — anything else that needs a TXT on
# flexi-day.com has to be added to `records` here rather than declared as its
# own aws_route53_record, which would either fail as "already exists" or (with
# allow_overwrite) silently drop SPF and break deliverability. That is why the
# Microsoft Entra domain-ownership token lives in this repo and not next to the
# rest of the Entra wiring in flexi-day-be/terraform.
resource "aws_route53_record" "spf" {
  # Exists when EITHER value is wanted. Gating solely on manage_spf_record —
  # whose own purpose is "SPF is managed elsewhere" — would have taken the
  # Entra token down with it and silently un-verified the domain.
  count = var.manage_spf_record || var.entra_domain_verification_txt != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.hosted_zone_name
  type    = "TXT"
  ttl     = 300
  records = concat(
    var.manage_spf_record ? ["v=spf1 include:amazonses.com ~all"] : [],
    var.entra_domain_verification_txt != "" ? [var.entra_domain_verification_txt] : []
  )
}

# --- S3: raw inbound messages, auto-expired -----------------------------------

resource "aws_s3_bucket" "mail" {
  bucket = local.mail_bucket_name
}

resource "aws_s3_bucket_public_access_block" "mail" {
  bucket                  = aws_s3_bucket.mail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "mail" {
  bucket = aws_s3_bucket.mail.id

  rule {
    id     = "expire-incoming"
    status = "Enabled"

    filter {
      prefix = local.mail_key_prefix
    }

    expiration {
      days = var.mail_retention_days
    }
  }
}

# Let SES write received mail into the bucket (SES uses the aws:Referer =
# account-id condition for the S3 receipt action).
data "aws_iam_policy_document" "mail_bucket" {
  statement {
    sid    = "AllowSESPuts"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.mail.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:Referer"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_s3_bucket_policy" "mail" {
  bucket = aws_s3_bucket.mail.id
  policy = data.aws_iam_policy_document.mail_bucket.json
}

# --- Lambda: rewrite headers and forward via SES ------------------------------

data "archive_file" "forwarder" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/ses-forwarder"
  output_path = "${path.module}/.build/ses-forwarder.zip"
}

data "aws_iam_policy_document" "forwarder_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "forwarder" {
  name               = "${var.project_name}-ses-forwarder"
  assume_role_policy = data.aws_iam_policy_document.forwarder_assume.json
}

data "aws_iam_policy_document" "forwarder" {
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-ses-forwarder:*"]
  }

  statement {
    sid       = "ReadStoredMail"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.mail.arn}/${local.mail_key_prefix}*"]
  }

  statement {
    sid       = "SendForwardedMail"
    effect    = "Allow"
    actions   = ["ses:SendRawEmail"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "forwarder" {
  name   = "ses-forwarder"
  role   = aws_iam_role.forwarder.id
  policy = data.aws_iam_policy_document.forwarder.json
}

resource "aws_lambda_function" "forwarder" {
  function_name    = "${var.project_name}-ses-forwarder"
  role             = aws_iam_role.forwarder.arn
  runtime          = "nodejs24.x"
  handler          = "index.handler"
  filename         = data.archive_file.forwarder.output_path
  source_code_hash = data.archive_file.forwarder.output_base64sha256
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      MAIL_BUCKET     = aws_s3_bucket.mail.id
      MAIL_KEY_PREFIX = local.mail_key_prefix
      FROM_EMAIL      = var.from_email
      FORWARD_TO      = var.forward_to_email
      SUBJECT_PREFIX  = var.subject_prefix
    }
  }
}

resource "aws_lambda_permission" "ses" {
  statement_id   = "AllowSESInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.forwarder.function_name
  principal      = "ses.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
}

# --- SES receipt rules --------------------------------------------------------

resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "${var.project_name}-inbound"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

# One rule matches the whole domain (support@ plus catch-all): store to S3
# first, then invoke the forwarder Lambda (actions run in position order).
resource "aws_ses_receipt_rule" "forward" {
  name          = "forward-to-personal"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  recipients    = [var.hosted_zone_name]
  enabled       = true
  scan_enabled  = true

  s3_action {
    bucket_name       = aws_s3_bucket.mail.id
    object_key_prefix = local.mail_key_prefix
    position          = 1
  }

  lambda_action {
    function_arn    = aws_lambda_function.forwarder.arn
    invocation_type = "Event"
    position        = 2
  }

  depends_on = [
    aws_s3_bucket_policy.mail,
    aws_lambda_permission.ses,
  ]
}