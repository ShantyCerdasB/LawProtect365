/**
 * Creates a Route 53 DNS record.
 *
 * Supports:
 * - Simple records with TTL and values.
 * - Alias records (e.g., for CloudFront, ELB, S3 static hosting).
 */
resource "aws_route53_record" "dns_record" {
  zone_id = var.hosted_zone_id
  name    = var.record_name
  type    = var.record_type

  /**
   * Alias configuration block.
   * Only included if `var.alias` is provided.
   */
  dynamic "alias" {
    for_each = var.alias != null ? [var.alias] : []
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = alias.value.evaluate_target_health
    }
  }

  /**
   * Simple record configuration.
   * Used when no alias is defined.
   */
  ttl     = var.alias == null ? var.ttl : null
  records = var.alias == null ? var.records : null
}
