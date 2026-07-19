# SES sending identity for flexi-day.com with Easy DKIM.
#
# NOTE: the SES email *templates* are intentionally NOT managed here — they
# are rendered from react-email sources and upserted by src/sync-templates.ts
# (run from CI). Terraform only owns the identity, DKIM and configuration set.

resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.sending_domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# One configuration set per environment; the backend passes its name in
# ConfigurationSetName when sending, so dev/prod sends can be tracked apart.
resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = "${var.project_name}-${var.environment}"

  reputation_options {
    reputation_metrics_enabled = true
  }
}

# DKIM CNAME records in the existing flexi-day.com hosted zone (already
# managed by flexi-day-be's Terraform as a data source, same pattern here).
data "aws_route53_zone" "main" {
  count        = var.manage_route53_dkim_records ? 1 : 0
  name         = var.sending_domain
  private_zone = false
}

resource "aws_route53_record" "dkim" {
  count = var.manage_route53_dkim_records ? 3 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.sending_domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}
