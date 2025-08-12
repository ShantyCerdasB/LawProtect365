/**
 * @file Provisions an AWS CloudTrail with optional CloudWatch Logs integration.
 * Includes IAM roles and policies for log delivery, supports KMS encryption,
 * multi-region and organization-level trails, and configurable event selectors.
 */

########################################
# Local Values
########################################

/**
 * @local trail_name
 * Name of the CloudTrail resource, derived from project and environment.
 *
 * @local log_group_name
 * CloudWatch Logs group name for storing CloudTrail logs.
 *
 * @local tags_named
 * Combined resource tags including a Name tag.
 *
 * @local cw_logs_enabled
 * Boolean indicating if CloudWatch Logs integration should be created.
 */
locals {
  trail_name         = "${var.project_name}-cloudtrail-${var.env}"
  log_group_name     = "/aws/cloudtrail/${local.trail_name}"
  tags_named         = merge(var.common_tags, { Name = local.trail_name })
  cw_logs_enabled    = var.create_cloudwatch_logs
}

########################################
# Optional CloudWatch Logs for CloudTrail
########################################

/**
 * @resource aws_cloudwatch_log_group.trail_logs
 * Creates a CloudWatch Log Group for storing CloudTrail logs if enabled.
 *
 * @condition Created when `var.create_cloudwatch_logs` is true.
 * @param retention_in_days Number of days to retain log events.
 * @param kms_key_id Optional KMS key ARN for log encryption.
 */
resource "aws_cloudwatch_log_group" "trail_logs" {
  count             = local.cw_logs_enabled ? 1 : 0
  name              = local.log_group_name
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = var.logs_kms_key_arn == "" ? null : var.logs_kms_key_arn
  tags              = local.tags_named
}

/**
 * @resource aws_iam_role.cloudtrail_logs_role
 * IAM Role assumed by CloudTrail to publish logs to CloudWatch Logs.
 *
 * @condition Created when `var.create_cloudwatch_logs` is true.
 */
resource "aws_iam_role" "cloudtrail_logs_role" {
  count = local.cw_logs_enabled ? 1 : 0
  name  = "${local.trail_name}-to-cwlogs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "cloudtrail.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
  tags = local.tags_named
}

/**
 * @resource aws_iam_role_policy.cloudtrail_logs_policy
 * Inline IAM policy granting CloudTrail permissions to publish logs to CloudWatch Logs.
 *
 * @condition Created when `var.create_cloudwatch_logs` is true.
 * @param role Name/ID of the associated IAM role.
 */
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  count = local.cw_logs_enabled ? 1 : 0
  name  = "${local.trail_name}-to-cwlogs-policy"
  role  = aws_iam_role.cloudtrail_logs_role[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      Resource = "*"
    }]
  })
}

########################################
# CloudTrail
########################################

/**
 * @resource aws_cloudtrail.trail
 * Creates the primary CloudTrail for logging API activity.
 *
 * @description
 * - Supports multi-region and organization-wide logging.
 * - Can include global service events.
 * - Can enable log file integrity validation.
 * - Supports optional KMS encryption.
 * - Can send logs to CloudWatch Logs if enabled.
 * - Event selectors allow fine-grained log inclusion.
 *
 * @param name                          Trail name.
 * @param s3_bucket_name                Destination S3 bucket for CloudTrail logs.
 * @param s3_key_prefix                 Optional S3 prefix for log file storage.
 * @param is_multi_region_trail         Whether the trail logs events from all regions.
 * @param include_global_service_events Whether to include events from global AWS services.
 * @param enable_log_file_validation    Enables validation for log file integrity.
 * @param kms_key_id                    Optional KMS key ARN for log file encryption.
 * @param is_organization_trail         Whether to enable organization-wide logging.
 * @param enable_logging                Enables log delivery for the trail.
 * @param cloud_watch_logs_group_arn    CloudWatch Logs Group ARN for integration.
 * @param cloud_watch_logs_role_arn     IAM Role ARN for CloudWatch Logs delivery.
 * @param event_selector                Defines which events and resources are logged.
 */
resource "aws_cloudtrail" "trail" {
  name                          = local.trail_name
  s3_bucket_name                = var.s3_bucket_name
  s3_key_prefix                 = var.s3_key_prefix
  is_multi_region_trail         = var.is_multi_region_trail
  include_global_service_events = var.include_global_service_events
  enable_log_file_validation    = var.enable_log_file_validation
  kms_key_id                    = var.trail_kms_key_arn == "" ? null : var.trail_kms_key_arn
  is_organization_trail         = var.is_organization_trail
  enable_logging                = var.enable_logging

  cloud_watch_logs_group_arn = local.cw_logs_enabled ? aws_cloudwatch_log_group.trail_logs[0].arn : null
  cloud_watch_logs_role_arn  = local.cw_logs_enabled ? aws_iam_role.cloudtrail_logs_role[0].arn : null

  dynamic "event_selector" {
    for_each = var.event_selectors
    content {
      read_write_type           = lookup(event_selector.value, "read_write_type", "All")
      include_management_events = lookup(event_selector.value, "include_management_events", true)

      dynamic "data_resource" {
        for_each = lookup(event_selector.value, "data_resources", [])
        content {
          type   = data_resource.value.type
          values = data_resource.value.values
        }
      }
    }
  }

  tags = local.tags_named
}
