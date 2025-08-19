/**
 * @file variables.tf
 * @brief Input variables for the EventBridge (Bus/Rule/Target) module.
 * @remarks
 *   This module can optionally create a rule and attach a target.
 *   If you only need a bus ARN for event producers, set `create_rule = false`.
 */

 /** 
  * Project prefix (e.g., "lawprotect365").
  * @type string
  */
variable "project_name" {
  description = "Project prefix (e.g., lawprotect365)"
  type        = string
}

/**
 * Deployment environment.
 * @type string
 * @remarks Expected values: "dev" | "prod" (or your own convention).
 */
variable "env" {
  description = "Deployment environment (dev|prod)"
  type        = string
}

/**
 * Common resource tags applied to all supported resources.
 * @type map(string)
 * @defaultValue {}
 */
variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

/* ----------------------- Optional rule/target controls -------------------- */

/**
 * Whether to create an EventBridge rule on the custom bus.
 * @type bool
 * @defaultValue false
 */
variable "create_rule" {
  description = "Whether to create an EventBridge rule"
  type        = bool
  default     = false
}

/**
 * Whether to attach a target to the rule (only used when create_rule = true).
 * @type bool
 * @defaultValue false
 */
variable "create_target" {
  description = "Whether to attach a target to the rule"
  type        = bool
  default     = false
}

/* ------------------------------ Rule params ------------------------------- */

/**
 * Rule description (used only when create_rule = true).
 * @type string
 * @defaultValue "Automated EventBridge rule"
 */
variable "rule_description" {
  description = "Rule description"
  type        = string
  default     = "Automated EventBridge rule"
}

/**
 * Event pattern as a JSON string. Required if `schedule_expression` is null.
 * @type string
 * @defaultValue null
 * @example
 *   "{ \"source\": [\"my.app\"], \"detail-type\": [\"order.created\"] }"
 */
variable "event_pattern" {
  description = "Event pattern (JSON string). Required if schedule_expression is null"
  type        = string
  default     = null
}

/**
 * Schedule expression (cron() or rate()). Required if `event_pattern` is null.
 * @type string
 * @defaultValue null
 * @example "rate(5 minutes)"
 * @example "cron(0/15 * * * ? *)"
 */
variable "schedule_expression" {
  description = "Schedule (cron()|rate()). Required if event_pattern is null"
  type        = string
  default     = null
}

/* ------------------------------ Target params ----------------------------- */

/**
 * Target ARN (Lambda, SQS, SNS, another event bus, etc.).
 * Used only when create_target = true.
 * @type string
 * @defaultValue null
 */
variable "target_arn" {
  description = "Target ARN (Lambda|SQS|SNS|Event bus, etc.)"
  type        = string
}

/**
 * Target type hint for extra wiring.
 * If set to "lambda", an invoke permission will be created.
 * @type string
 * @defaultValue "other"
 * @remarks Allowed values (by convention): "lambda" | "other".
 */
variable "target_type" {
  description = "Target type hint for extra wiring (lambda|other)"
  type        = string
  default     = "other"
}
