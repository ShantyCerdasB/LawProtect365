/**
 * Fully qualified domain name (FQDN) of the created Route 53 record.
 */
output "fqdn" {
  description = "Fully qualified domain name of the record created."
  value       = aws_route53_record.dns_record.fqdn
}

/**
 * Internal Route 53 record ID.
 * Useful for referencing this record in other resources.
 */
output "record_id" {
  description = "Internal ID of the Route 53 record."
  value       = aws_route53_record.dns_record.id
}
