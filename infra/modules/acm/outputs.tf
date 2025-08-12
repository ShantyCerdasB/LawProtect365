/**
 * @output certificate_arn
 * Exposes the Amazon Resource Name (ARN) of the ACM certificate after validation.
 *
 * @description Useful for referencing the certificate in other Terraform modules or AWS resources.
 * @value aws_acm_certificate.cert.arn
 */
output "certificate_arn" {
  description = "ARN of the validated ACM certificate."
  value       = aws_acm_certificate.cert.arn
}

/**
 * @output certificate_domain
 * Exposes the primary domain name associated with the validated ACM certificate.
 *
 * @description Useful for verifying or referencing the domain for which the certificate was issued.
 * @value aws_acm_certificate.cert.domain_name
 */
output "certificate_domain" {
  description = "Domain name of the validated ACM certificate."
  value       = aws_acm_certificate.cert.domain_name
}
