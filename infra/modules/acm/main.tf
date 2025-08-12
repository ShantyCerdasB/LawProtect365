/**
 * @file Terraform configuration for provisioning an AWS ACM certificate in `us-east-1`
 * and validating it through Route 53 DNS records.
 */

provider "aws" {
  region = "us-east-1"
}

/**
 * @resource aws_acm_certificate.cert
 * Provisions a public ACM (AWS Certificate Manager) certificate for the specified domain.
 *
 * @param domain_name               Primary domain name for the certificate.
 * @param subject_alternative_names List of additional domain names (SANs) included in the certificate.
 * @param validation_method         Uses DNS validation to prove domain ownership.
 * @param tags                      Metadata for resource identification and environment tracking.
 */
resource "aws_acm_certificate" "cert" {
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

/**
 * @resource aws_route53_record.validation
 * Creates one DNS record per ACM validation option in the specified Route 53 hosted zone.
 *
 * @param for_each Iterates through each domain validation option from the ACM certificate.
 * @param zone_id  The Route 53 hosted zone ID where the validation records will be created.
 * @param name     The DNS record name required for validation.
 * @param type     The DNS record type (e.g., CNAME).
 * @param ttl      Time-to-live in seconds for the validation record.
 * @param records  The DNS record values required for validation.
 */
resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

/**
 * @resource aws_acm_certificate_validation.cert_validation
 * Finalizes the ACM certificate validation process by linking the created DNS validation records.
 *
 * @param certificate_arn         ARN of the ACM certificate being validated.
 * @param validation_record_fqdns Fully qualified domain names of the DNS records used for validation.
 */
resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}
