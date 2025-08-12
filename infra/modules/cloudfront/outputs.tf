/**
 * @file Output values for the CloudFront module.
 * Exposes key identifiers and attributes for referencing the CloudFront distribution
 * and integrating with other modules or automation scripts.
 */

/**
 * @output domain_name
 * Public domain name assigned by CloudFront.
 *
 * @description Use this as the CDN URL in your application if no custom domain is configured.
 * @value aws_cloudfront_distribution.cdn.domain_name
 */
output "domain_name" {
  description = "The CloudFront domain name to use in your app URLs."
  value       = aws_cloudfront_distribution.cdn.domain_name
}

/**
 * @output distribution_id
 * Unique identifier of the CloudFront distribution.
 *
 * @description Required for actions like creating invalidations.
 * @value aws_cloudfront_distribution.cdn.id
 */
output "distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.cdn.id
}

/**
 * @output distribution_arn
 * Amazon Resource Name (ARN) of the CloudFront distribution.
 *
 * @description Useful for referencing in IAM policies and logging configurations.
 * @value aws_cloudfront_distribution.cdn.arn
 */
output "distribution_arn" {
  description = "ARN of the CloudFront distribution."
  value       = aws_cloudfront_distribution.cdn.arn
}

/**
 * @output hosted_zone_id
 * Route 53 hosted zone ID for CloudFront.
 *
 * @description Useful when creating DNS records pointing to the CloudFront distribution.
 * @value aws_cloudfront_distribution.cdn.hosted_zone_id
 */
output "hosted_zone_id" {
  description = "CloudFront hosted zone ID (for Route 53 alias records)."
  value       = aws_cloudfront_distribution.cdn.hosted_zone_id
}

/**
 * @output distribution_status
 * Current status of the CloudFront distribution.
 *
 * @description Typically `Deployed` when ready or `InProgress` during updates.
 * @value aws_cloudfront_distribution.cdn.status
 */
output "distribution_status" {
  description = "Deployment status of the CloudFront distribution."
  value       = aws_cloudfront_distribution.cdn.status
}

/**
 * @output distribution_etag
 * ETag (entity tag) of the CloudFront distribution configuration.
 *
 * @description Can be used for conditional updates or API calls that require configuration version.
 * @value aws_cloudfront_distribution.cdn.etag
 */
output "distribution_etag" {
  description = "ETag of the CloudFront distribution configuration."
  value       = aws_cloudfront_distribution.cdn.etag
}
