/**
 * @file variables.tf
 * @module sns
 * @description
 * Defines input variables for provisioning an Amazon SNS topic with optional encryption,
 * FIFO support, access policies, subscriptions, and delivery policies.
 */

########################################
# Identity & Tags
########################################

/**
 * @variable topic_name
 * @description
 * The name of the SNS topic.
 * If `fifo` is set to true, the name must end with `.fifo`.
 */
variable "topic_name" {
  description = "SNS topic name. If fifo=true, it must end with .fifo"
  type        = string
}

/**
 * @variable tags
 * @description
 * Key-value tags to apply to the SNS topic for resource identification and cost allocation.
 */
variable "tags" {
  description = "Tags to apply to the SNS topic"
  type        = map(string)
  default     = {}
}

########################################
# Encryption (Recommended)
########################################

/**
 * @variable kms_master_key_id
 * @description
 * The ARN or alias of a KMS CMK for server-side encryption (SSE) of SNS messages.
 * If null, AWS-managed keys will be used.
 */
variable "kms_master_key_id" {
  description = "KMS CMK ARN or alias for SNS SSE. Null = AWS-managed key"
  type        = string
  default     = null
}

########################################
# FIFO (Optional)
########################################

/**
 * @variable fifo
 * @description
 * Whether to create the topic as a FIFO topic.
 * If true, `topic_name` must end with `.fifo`.
 */
variable "fifo" {
  description = "Create a FIFO topic (.fifo suffix required in topic_name)"
  type        = bool
  default     = false
}

/**
 * @variable content_based_deduplication
 * @description
 * Enables content-based deduplication for FIFO topics.
 * When enabled, messages with identical content are considered duplicates.
 */
variable "content_based_deduplication" {
  description = "Use content-based dedup for FIFO topics"
  type        = bool
  default     = true
}

########################################
# Access Policy
########################################

/**
 * @variable allowed_publish_arns
 * @description
 * List of ARNs that are allowed to publish to this topic.
 * If empty, any AWS principal in the account can publish.
 */
variable "allowed_publish_arns" {
  description = "List of ARNs allowed to Publish to this topic (principals). Empty means any AWS principal in the account."
  type        = list(string)
  default     = []
}

/**
 * @variable allow_cloudwatch_alarms
 * @description
 * Allows the CloudWatch Alarms service to publish notifications to this topic.
 */
variable "allow_cloudwatch_alarms" {
  description = "Allow CloudWatch Alarms service to Publish notifications"
  type        = bool
  default     = true
}

########################################
# Subscriptions (Optional)
########################################

/**
 * @variable subscriptions
 * @description
 * List of subscriptions to create for this topic.
 * Each subscription includes protocol, endpoint, and optional delivery/filter settings.
 *
 * @example
 * protocol = "email"
 * endpoint = "admin@example.com"
 */
variable "subscriptions" {
  description = "Optional subscriptions to create on this topic"
  type = list(object({
    protocol                 = string
    endpoint                 = string
    raw_message_delivery     = optional(bool, false)
    filter_policy            = optional(string, null)
    delivery_policy          = optional(string, null)
    redrive_policy           = optional(string, null) # For SQS endpoints only
    subscription_role_arn    = optional(string, null) # For Kinesis/Firehose
  }))
  default = []
}

########################################
# Delivery Policy (Optional)
########################################

/**
 * @variable topic_delivery_policy
 * @description
 * Optional JSON delivery policy applied at the topic level.
 */
variable "topic_delivery_policy" {
  description = "Optional JSON delivery policy for the topic"
  type        = string
  default     = null
}

########################################
# Data Protection / Message Size (Optional)
########################################

/**
 * @variable application_success_feedback_role_arn
 * @description
 * IAM role ARN for application success feedback.
 */
variable "application_success_feedback_role_arn" {
  description = "IAM role ARN for application success feedback"
  type        = string
  default     = null
}

/**
 * @variable application_success_feedback_sample_rate
 * @description
 * Percentage (0-100) of successful deliveries for which to sample feedback.
 */
variable "application_success_feedback_sample_rate" {
  description = "Sample rate for success feedback (0-100)"
  type        = number
  default     = null
}

/**
 * @variable application_failure_feedback_role_arn
 * @description
 * IAM role ARN for application failure feedback.
 */
variable "application_failure_feedback_role_arn" {
  description = "IAM role ARN for application failure feedback"
  type        = string
  default     = null
}

/**
 * @variable http_success_feedback_role_arn
 * @description
 * IAM role ARN for HTTP success feedback.
 */
variable "http_success_feedback_role_arn" {
  description = "IAM role ARN for HTTP success feedback"
  type        = string
  default     = null
}

/**
 * @variable http_success_feedback_sample_rate
 * @description
 * Percentage (0-100) of successful HTTP deliveries for which to sample feedback.
 */
variable "http_success_feedback_sample_rate" {
  description = "Sample rate for HTTP success feedback (0-100)"
  type        = number
  default     = null
}

/**
 * @variable http_failure_feedback_role_arn
 * @description
 * IAM role ARN for HTTP failure feedback.
 */
variable "http_failure_feedback_role_arn" {
  description = "IAM role ARN for HTTP failure feedback"
  type        = string
  default     = null
}
