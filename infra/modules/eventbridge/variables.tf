/**
 * Project prefix for naming all EventBridge resources.
 * Example: `lawprotect365`
 */
variable "project_name" {
  description = "Prefix for all resource names (e.g. lawprotect365)."
  type        = string
}

/**
 * Deployment environment.
 * Example: `dev` or `prod`
 */
variable "env" {
  description = "Deployment environment (e.g. dev or prod)."
  type        = string
}

/**
 * Description for the EventBridge rule.
 */
variable "rule_description" {
  description = "Description for the EventBridge rule."
  type        = string
  default     = "Automated EventBridge rule"
}

/**
 * JSON event pattern for matching specific events.
 * Leave `null` when using a schedule expression.
 */
variable "event_pattern" {
  description = "Event pattern (JSON) for matching events."
  type        = string
  default     = null
}

/**
 * Schedule expression for the rule.
 * Supports `cron()` or `rate()` formats.
 * Leave `null` when using an event pattern.
 */
variable "schedule_expression" {
  description = "Schedule expression for the rule (if using cron or rate)."
  type        = string
  default     = null
}

/**
 * ARN of the resource that will receive the matched or scheduled events.
 */
variable "target_arn" {
  description = "ARN of the target resource for the EventBridge rule."
  type        = string
}

/**
 * Common tags applied to all EventBridge resources.
 */
variable "common_tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default     = {}
}
