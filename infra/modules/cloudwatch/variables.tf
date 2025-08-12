/**
 * @file Input variables for the AWS CloudWatch Monitoring module.
 * Defines configuration for log groups, alarms, and dashboards.
 */

########################################
# Service metadata
########################################

/**
 * @variable service_name
 * Friendly name of the microservice (used in resource names and dashboard title).
 *
 * @type string
 * @example "auth-service"
 */
variable "service_name" {
  description = "Friendly name of the microservice (used in resource names and dashboard title)"
  type        = string
}

/**
 * @variable env
 * Environment name (dev/stage/prod).
 *
 * @type string
 * @example "dev"
 */
variable "env" {
  description = "Environment name (dev/stage/prod)"
  type        = string
}

/**
 * @variable tags
 * Tags applied to all resources.
 *
 * @type map(string)
 * @default {}
 */
variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}

########################################
# Logs
########################################

/**
 * @variable retention_in_days
 * CloudWatch Logs retention period for created log groups.
 *
 * @type number
 * @default 30
 */
variable "retention_in_days" {
  description = "CloudWatch Logs retention period for created log groups"
  type        = number
  default     = 30
}

/**
 * @variable kms_key_arn
 * Optional KMS key ARN to encrypt log groups.
 *
 * @type string|null
 */
variable "kms_key_arn" {
  description = "Optional KMS key ARN to encrypt log groups"
  type        = string
  default     = null
}

/**
 * @variable lambda_function_names_map
 * Map of Lambda function names to use in CloudWatch alarms.
 *
 * @type map(string)
 * @default {}
 */
variable "lambda_function_names_map" {
  description = "Map of Lambda function names to use in CloudWatch alarms"
  type        = map(string)
  default     = {}
}

/**
 * @variable create_apigw_log_group
 * If true, creates a log group for API Gateway with the given name.
 *
 * @type bool
 * @default false
 */
variable "create_apigw_log_group" {
  description = "If true, creates a log group for API Gateway with the given name"
  type        = bool
  default     = false
}

/**
 * @variable apigw_log_group_name
 * CloudWatch Log Group name API Gateway will write to (must also be configured in API Gateway stage).
 *
 * @type string|null
 */
variable "apigw_log_group_name" {
  description = "CloudWatch Log Group name API Gateway will write to (must also be configured in API Gateway stage)"
  type        = string
  default     = null
}

/**
 * @variable log_subscription_destination_arn
 * Optional destination ARN (Lambda/Kinesis/Firehose) for log subscription filters.
 *
 * @type string|null
 */
variable "log_subscription_destination_arn" {
  description = "Optional destination ARN (Lambda/Kinesis/Firehose) for log subscription filters"
  type        = string
  default     = null
}

/**
 * @variable log_subscription_role_arn
 * IAM role ARN that allows CloudWatch Logs to put data into your destination (required for Kinesis/Firehose).
 *
 * @type string|null
 */
variable "log_subscription_role_arn" {
  description = "IAM role ARN that allows CloudWatch Logs to put data into your destination (required for Kinesis/Firehose)"
  type        = string
  default     = null
}

/**
 * @variable log_subscription_filter_pattern
 * Filter pattern for subscription filter; empty matches all events.
 *
 * @type string
 * @default ""
 */
variable "log_subscription_filter_pattern" {
  description = "Filter pattern for subscription filter; empty matches all events"
  type        = string
  default     = ""
}

########################################
# Alarms – Wiring
########################################

/**
 * @variable alarm_sns_topic_arn
 * SNS topic ARN to notify on ALARM.
 *
 * @type string|null
 */
variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN to notify on ALARM"
  type        = string
  default     = null
}

/**
 * @variable ok_sns_topic_arn
 * SNS topic ARN to notify on OK.
 *
 * @type string|null
 */
variable "ok_sns_topic_arn" {
  description = "SNS topic ARN to notify on OK"
  type        = string
  default     = null
}

/**
 * @variable treat_missing_data
 * How to treat missing data in alarms (missing, notBreaching, breaching, ignore).
 *
 * @type string
 * @default "notBreaching"
 */
variable "treat_missing_data" {
  description = "How to treat missing data in alarms (missing, notBreaching, breaching, ignore)"
  type        = string
  default     = "notBreaching"
}

########################################
# Alarms – API Gateway (HTTP API v2)
########################################

/**
 * @variable apigw_api_id
 * API Gateway v2 API ID (for alarms).
 *
 * @type string|null
 */
variable "apigw_api_id" {
  description = "API Gateway v2 API ID (for alarms)"
  type        = string
  default     = null
}

/**
 * @variable apigw_stage
 * Stage name for the API (for alarms).
 *
 * @type string|null
 */
variable "apigw_stage" {
  description = "Stage name for the API (for alarms)"
  type        = string
  default     = null
}

/**
 * @variable apigw_5xx_threshold
 * Threshold for API Gateway 5XX count within the period.
 *
 * @type number
 * @default 1
 */
variable "apigw_5xx_threshold" {
  description = "Threshold for API Gateway 5XX count within the period"
  type        = number
  default     = 1
}

/**
 * @variable apigw_latency_p99_threshold_ms
 * Threshold for API Gateway p99 latency (ms).
 *
 * @type number
 * @default 1500
 */
variable "apigw_latency_p99_threshold_ms" {
  description = "Threshold for API Gateway p99 latency (ms)"
  type        = number
  default     = 1500
}

/**
 * @variable apigw_period_seconds
 * Alarm period (seconds) for API Gateway alarms.
 *
 * @type number
 * @default 300
 */
variable "apigw_period_seconds" {
  description = "Alarm period (seconds) for API Gateway alarms"
  type        = number
  default     = 300
}

########################################
# Alarms – Lambda
########################################

/**
 * @variable lambda_error_threshold
 * Errors > threshold triggers alarm.
 *
 * @type number
 * @default 0
 */
variable "lambda_error_threshold" {
  description = "Errors > threshold triggers alarm"
  type        = number
  default     = 0
}

/**
 * @variable lambda_throttle_threshold
 * Throttles > threshold triggers alarm.
 *
 * @type number
 * @default 0
 */
variable "lambda_throttle_threshold" {
  description = "Throttles > threshold triggers alarm"
  type        = number
  default     = 0
}

/**
 * @variable lambda_p95_duration_threshold_ms
 * p95 Duration (ms) threshold for alarm.
 *
 * @type number
 * @default 2000
 */
variable "lambda_p95_duration_threshold_ms" {
  description = "p95 Duration (ms) threshold for alarm"
  type        = number
  default     = 2000
}

/**
 * @variable lambda_period_seconds
 * Alarm period (seconds) for Lambda alarms.
 *
 * @type number
 * @default 300
 */
variable "lambda_period_seconds" {
  description = "Alarm period (seconds) for Lambda alarms"
  type        = number
  default     = 300
}

########################################
# Alarms – DynamoDB
########################################

/**
 * @variable dynamodb_table_names
 * DynamoDB tables to watch.
 *
 * @type list(string)
 * @default []
 */
variable "dynamodb_table_names" {
  description = "DynamoDB tables to watch"
  type        = list(string)
  default     = []
}

/**
 * @variable dynamodb_throttle_threshold
 * Read/WriteThrottleEvents > threshold triggers alarm.
 *
 * @type number
 * @default 0
 */
variable "dynamodb_throttle_threshold" {
  description = "Read/WriteThrottleEvents > threshold triggers alarm"
  type        = number
  default     = 0
}

/**
 * @variable dynamodb_period_seconds
 * Alarm period (seconds) for DynamoDB alarms.
 *
 * @type number
 * @default 300
 */
variable "dynamodb_period_seconds" {
  description = "Alarm period (seconds) for DynamoDB alarms"
  type        = number
  default     = 300
}

########################################
# Alarms – SQS
########################################

/**
 * @variable sqs_queue_names
 * SQS queue names to monitor.
 *
 * @type list(string)
 * @default []
 */
variable "sqs_queue_names" {
  description = "SQS queue names to monitor"
  type        = list(string)
  default     = []
}

/**
 * @variable sqs_oldest_age_threshold_seconds
 * ApproximateAgeOfOldestMessage > threshold seconds.
 *
 * @type number
 * @default 120
 */
variable "sqs_oldest_age_threshold_seconds" {
  description = "ApproximateAgeOfOldestMessage > threshold seconds"
  type        = number
  default     = 120
}

/**
 * @variable sqs_visible_messages_threshold
 * ApproximateNumberOfMessagesVisible > threshold.
 *
 * @type number
 * @default 100
 */
variable "sqs_visible_messages_threshold" {
  description = "ApproximateNumberOfMessagesVisible > threshold"
  type        = number
  default     = 100
}

/**
 * @variable sqs_period_seconds
 * Alarm period (seconds) for SQS alarms.
 *
 * @type number
 * @default 300
 */
variable "sqs_period_seconds" {
  description = "Alarm period (seconds) for SQS alarms"
  type        = number
  default     = 300
}

########################################
# Alarms – EventBridge
########################################

/**
 * @variable eventbridge_rule_names
 * EventBridge rule names to monitor for FailedInvocations.
 *
 * @type list(string)
 * @default []
 */
variable "eventbridge_rule_names" {
  description = "EventBridge rule names to monitor for FailedInvocations"
  type        = list(string)
  default     = []
}

/**
 * @variable eventbridge_failed_invocations_threshold
 * FailedInvocations > threshold triggers alarm.
 *
 * @type number
 * @default 0
 */
variable "eventbridge_failed_invocations_threshold" {
  description = "FailedInvocations > threshold triggers alarm"
  type        = number
  default     = 0
}

/**
 * @variable eventbridge_period_seconds
 * Alarm period (seconds) for EventBridge alarms.
 *
 * @type number
 * @default 300
 */
variable "eventbridge_period_seconds" {
  description = "Alarm period (seconds) for EventBridge alarms"
  type        = number
  default     = 300
}

########################################
# Dashboard
########################################

/**
 * @variable create_dashboard
 * If true, creates a CloudWatch dashboard for this service.
 *
 * @type bool
 * @default true
 */
variable "create_dashboard" {
  description = "If true, creates a CloudWatch dashboard for this service"
  type        = bool
  default     = true
}
