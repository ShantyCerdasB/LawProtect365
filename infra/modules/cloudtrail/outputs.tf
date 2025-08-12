/**
 * @file Output values for the AWS CloudTrail module.
 * Exposes key attributes of the CloudTrail trail, S3 bucket, and
 * optional CloudWatch Logs integration for use by other modules.
 */

########################################
# Trail identifiers
########################################

/**
 * @output trail_name
 * The name of the CloudTrail trail.
 *
 * @type string
 * @example "lawprotect365-cloudtrail-dev"
 */
output "trail_name" {
  description = "CloudTrail name."
  value       = aws_cloudtrail.trail.name
}

/**
 * @output trail_arn
 * The Amazon Resource Name (ARN) of the CloudTrail trail.
 *
 * @type string
 */
output "trail_arn" {
  description = "CloudTrail ARN."
  value       = aws_cloudtrail.trail.arn
}

/**
 * @output trail_home_region
 * The AWS home region for the CloudTrail trail.
 *
 * @type string
 * @example "us-east-1"
 */
output "trail_home_region" {
  description = "Home region for the trail."
  value       = aws_cloudtrail.trail.home_region
}

########################################
# Log storage
########################################

/**
 * @output trail_s3_bucket
 * The S3 bucket that receives CloudTrail logs.
 *
 * @type string
 * @example "lawprotect365-cloudtrail-logs"
 */
output "trail_s3_bucket" {
  description = "S3 bucket receiving CloudTrail logs."
  value       = aws_cloudtrail.trail.s3_bucket_name
}

########################################
# Optional CloudWatch Logs integration
########################################

/**
 * @output cloudwatch_log_group_name
 * The name of the CloudWatch Log Group for CloudTrail if it was created.
 *
 * @description Returns an empty string if CloudWatch Logs were not enabled.
 * @type string
 * @example "/aws/cloudtrail/lawprotect365-cloudtrail-dev"
 */
output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group for CloudTrail (if created)."
  value       = length(aws_cloudwatch_log_group.trail_logs) == 0 ? "" : aws_cloudwatch_log_group.trail_logs[0].name
}
