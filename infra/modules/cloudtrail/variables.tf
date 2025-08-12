/**
 * @file Input variables for the AWS CloudTrail module.
 * Configures CloudTrail logging, optional CloudWatch Logs integration, encryption,
 * multi-region and organization-level trails, and event selectors.
 */

########################################
# Identification & tagging
########################################

/**
 * @variable project_name
 * Prefix for resource names.
 *
 * @description Example: `lawprotect365`
 * @type string
 */
variable "project_name" {
  description = "Prefix for resource names (e.g., lawprotect365)."
  type        = string
}

/**
 * @variable env
 * Deployment environment identifier.
 *
 * @description Example: `dev` or `prod`.
 * @type string
 */
variable "env" {
  description = "Deployment environment (dev|prod)."
  type        = string
}

/**
 * @variable common_tags
 * Map of common tags applied to all resources.
 *
 * @type map(string)
 * @default {}
 */
variable "common_tags" {
  description = "Common tags to apply to all resources."
  type        = map(string)
  default     = {}
}

########################################
# Storage
########################################

/**
 * @variable s3_bucket_name
 * Name of the existing S3 bucket where CloudTrail will deliver logs.
 *
 * @type string
 */
variable "s3_bucket_name" {
  description = "S3 bucket name where CloudTrail will deliver logs."
  type        = string
}

/**
 * @variable s3_key_prefix
 * Optional S3 key prefix for CloudTrail logs.
 *
 * @type string
 * @default "cloudtrail/"
 */
variable "s3_key_prefix" {
  description = "S3 key prefix for CloudTrail logs."
  type        = string
  default     = "cloudtrail/"
}

########################################
# Encryption
########################################

/**
 * @variable trail_kms_key_arn
 * Optional KMS key ARN for encrypting CloudTrail log files.
 *
 * @description If not set, default AWS-managed keys are used.
 * @type string
 * @default ""
 */
variable "trail_kms_key_arn" {
  description = "KMS key ARN for encrypting CloudTrail log files (optional)."
  type        = string
  default     = ""
}

########################################
# Optional CloudWatch Logs integration
########################################

/**
 * @variable create_cloudwatch_logs
 * Whether to create a CloudWatch Log Group and IAM role for CloudTrail delivery.
 *
 * @type bool
 * @default true
 */
variable "create_cloudwatch_logs" {
  description = "Create a CloudWatch Log Group and IAM role for CloudTrail delivery."
  type        = bool
  default     = true
}

/**
 * @variable cloudwatch_log_retention_days
 * Retention period in days for the CloudWatch Log Group.
 *
 * @type number
 * @default 30
 */
variable "cloudwatch_log_retention_days" {
  description = "Retention in days for the CloudWatch Log Group."
  type        = number
  default     = 30
}

/**
 * @variable logs_kms_key_arn
 * Optional KMS key ARN for encrypting the CloudWatch Log Group.
 *
 * @type string
 * @default ""
 */
variable "logs_kms_key_arn" {
  description = "KMS key ARN for encrypting the CloudWatch Log Group (optional)."
  type        = string
  default     = ""
}

########################################
# Trail behavior
########################################

/**
 * @variable is_multi_region_trail
 * Whether the trail captures events from all regions.
 *
 * @type bool
 * @default true
 */
variable "is_multi_region_trail" {
  description = "Capture events from all regions."
  type        = bool
  default     = true
}

/**
 * @variable include_global_service_events
 * Whether to include events from global AWS services (e.g., IAM).
 *
 * @type bool
 * @default true
 */
variable "include_global_service_events" {
  description = "Include global events (e.g., IAM)."
  type        = bool
  default     = true
}

/**
 * @variable enable_log_file_validation
 * Whether to enable log file integrity validation.
 *
 * @type bool
 * @default true
 */
variable "enable_log_file_validation" {
  description = "Enable log file integrity validation."
  type        = bool
  default     = true
}

/**
 * @variable is_organization_trail
 * Whether the trail is an AWS Organizations trail.
 *
 * @type bool
 * @default false
 */
variable "is_organization_trail" {
  description = "Whether this is an AWS Organizations trail."
  type        = bool
  default     = false
}

/**
 * @variable enable_logging
 * Whether to enable logging for the trail.
 *
 * @type bool
 * @default true
 */
variable "enable_logging" {
  description = "Enable or pause logging."
  type        = bool
  default     = true
}

########################################
# Event selectors
########################################

/**
 * @variable event_selectors
 * List of event selector objects defining which management and data events are captured.
 *
 * @description
 * - `read_write_type`: `"All"`, `"ReadOnly"`, or `"WriteOnly"`.
 * - `include_management_events`: Whether to include management events.
 * - `data_resources`: List of data resource ARNs and types to capture (e.g., S3 objects, Lambda functions).
 *
 * @example
 * [
 *   {
 *     read_write_type           = "All"
 *     include_management_events = true
 *     data_resources = [
 *       { type = "AWS::S3::Object", values = ["arn:aws:s3:::my-bucket/"] },
 *       { type = "AWS::Lambda::Function", values = ["arn:aws:lambda:us-east-1:123456789012:function:*"] }
 *     ]
 *   }
 * ]
 *
 * @type list(object({
 *   read_write_type           = optional(string)
 *   include_management_events = optional(bool)
 *   data_resources = optional(list(object({
 *     type   = string
 *     values = list(string)
 *   })))
 * }))
 * @default []
 */
variable "event_selectors" {
  description = <<-EOT
    List of event selector objects:
    [
      {
        read_write_type           = "All" | "ReadOnly" | "WriteOnly"
        include_management_events = true
        data_resources = [
          { type = "AWS::S3::Object", values = ["arn:aws:s3:::my-bucket/"] },
          { type = "AWS::Lambda::Function", values = ["arn:aws:lambda:us-east-1:123456789012:function:*"] }
        ]
      }
    ]
  EOT
  type = list(object({
    read_write_type           = optional(string)
    include_management_events = optional(bool)
    data_resources = optional(list(object({
      type   = string
      values = list(string)
    })))
  }))
  default = []
}
