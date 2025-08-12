/**
 * @file Input variables for the AWS Budgets module.
 * Supports overall and per-service budgets, threshold-based alerts,
 * optional SNS topic creation, and CloudWatch dashboards with Cost Explorer links.
 */

########################################
# Identification & tagging
########################################

/**
 * @variable project
 * Project name used for naming and tagging resources.
 *
 * @type string
 */
variable "project" {
  description = "Project name used for naming and tagging."
  type        = string
}

/**
 * @variable environment
 * Environment identifier (e.g., dev, prod).
 *
 * @type string
 */
variable "environment" {
  description = "Environment identifier (e.g., dev, prod)."
  type        = string
}

/**
 * @variable common_tags
 * Map of common tags to apply to all resources.
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
# Overall budget (optional)
########################################

/**
 * @variable create_overall_budget
 * Whether to create a single overall monthly cost budget.
 *
 * @type bool
 * @default true
 */
variable "create_overall_budget" {
  description = "Whether to create a single overall monthly cost budget."
  type        = bool
  default     = true
}

/**
 * @variable overall_budget_name
 * Name for the overall budget.
 *
 * @type string
 * @default "overall-monthly-budget"
 */
variable "overall_budget_name" {
  description = "Name for the overall budget."
  type        = string
  default     = "overall-monthly-budget"
}

/**
 * @variable overall_budget_amount
 * Monthly cost budget amount for the overall budget.
 *
 * @type number
 * @default 1000
 */
variable "overall_budget_amount" {
  description = "Monthly cost budget amount for the overall budget."
  type        = number
  default     = 1000
}

/**
 * @variable budget_currency
 * Currency code for budgets.
 *
 * @type string
 * @default "USD"
 */
variable "budget_currency" {
  description = "Currency for budgets."
  type        = string
  default     = "USD"
}

/**
 * @variable overall_cost_filters
 * Optional cost filters for the overall budget.
 *
 * @description Only `TagKeyValue` is supported in this module.
 * @example
 * {
 *   TagKeyValue = ["Environment$dev"]
 * }
 * @type map(list(string))
 * @default {}
 */
variable "overall_cost_filters" {
  description = <<EOT
Optional cost filters for the overall budget. Only TagKeyValue is supported by this module.
Example:
{
  TagKeyValue = ["Environment$dev"]
}
EOT
  type    = map(list(string))
  default = {}
}

########################################
# Thresholds & notifications
########################################

/**
 * @variable threshold_percentages
 * List of budget alert thresholds in percentage.
 *
 * @description Each threshold triggers alerts for both ACTUAL and FORECASTED costs.
 * @type list(number)
 * @default [80, 100, 120]
 */
variable "threshold_percentages" {
  description = "List of alert thresholds for budgets (in % of actual/forecasted)."
  type        = list(number)
  default     = [80, 100, 120]
}

/**
 * @variable notify_emails
 * Email addresses subscribed to budget alerts.
 *
 * @type list(string)
 * @default []
 */
variable "notify_emails" {
  description = "Email addresses to subscribe to budget alerts."
  type        = list(string)
  default     = []
}

########################################
# SNS topic (create or reuse)
########################################

/**
 * @variable create_sns_topic
 * Whether to create a new SNS topic for budget alerts.
 *
 * @type bool
 * @default true
 */
variable "create_sns_topic" {
  description = "Whether to create an SNS topic for budget notifications."
  type        = bool
  default     = true
}

/**
 * @variable sns_topic_name
 * Name of the SNS topic for budget alerts.
 *
 * @description Defaults to `<project>-<environment>-budgets-alerts` if not provided.
 * @type string
 * @default null
 */
variable "sns_topic_name" {
  description = "Name for the SNS topic if create_sns_topic = true. Defaults to <project>-<environment>-budgets-alerts."
  type        = string
  default     = null
}

/**
 * @variable existing_sns_topic_arn
 * ARN of an existing SNS topic to use instead of creating one.
 *
 * @type string
 * @default null
 */
variable "existing_sns_topic_arn" {
  description = "Existing SNS topic ARN to use instead of creating one."
  type        = string
  default     = null
}

/**
 * @variable kms_master_key_id
 * Optional AWS KMS key ARN for encrypting the SNS topic.
 *
 * @type string
 * @default null
 */
variable "kms_master_key_id" {
  description = "Optional KMS key ID/ARN for SNS topic encryption (if the topic is created by this module)."
  type        = string
  default     = null
}

########################################
# Per-service / per-microservice budgets
########################################

/**
 * @variable service_budgets
 * List of per-service budget configurations.
 *
 * @description Each entry can define its own amount and cost filters.
 * @example
 * [
 *   {
 *     name         = "auth-service"
 *     amount       = 150
 *     cost_filters = { TagKeyValue = ["Service$auth-service"] }
 *   },
 *   {
 *     name         = "user-service"
 *     amount       = 200
 *     cost_filters = { TagKeyValue = ["Service$user-service"] }
 *   }
 * ]
 * @type list(object({
 *   name         = string
 *   amount       = number
 *   cost_filters = optional(map(list(string)), {})
 * }))
 * @default []
 */
variable "service_budgets" {
  description = <<EOT
List of per-service budgets. Each item defines its own amount and cost filters.
Example:
[
  {
    name          = "auth-service"
    amount        = 150
    cost_filters  = { TagKeyValue = ["Service$auth-service"] }
  },
  {
    name          = "user-service"
    amount        = 200
    cost_filters  = { TagKeyValue = ["Service$user-service"] }
  }
]
EOT
  type = list(object({
    name         = string
    amount       = number
    cost_filters = optional(map(list(string)), {})
  }))
  default = []
}

########################################
# CloudWatch dashboard
########################################

/**
 * @variable create_dashboard
 * Whether to create a CloudWatch dashboard with Cost Explorer quick links.
 *
 * @type bool
 * @default true
 */
variable "create_dashboard" {
  description = "Whether to create a CloudWatch dashboard with quick links to Cost Explorer per service."
  type        = bool
  default     = true
}

/**
 * @variable dashboard_name
 * Name of the CloudWatch dashboard.
 *
 * @description Defaults to `<project>-<environment>-budgets` if not provided.
 * @type string
 * @default null
 */
variable "dashboard_name" {
  description = "CloudWatch dashboard name. Defaults to <project>-<environment>-budgets."
  type        = string
  default     = null
}

/**
 * @variable dashboard_region
 * AWS region used in Cost Explorer deep links.
 *
 * @description If null, falls back to `aws_region`.
 * @type string
 * @default null
 */
variable "dashboard_region" {
  description = "Console region used in deep links (Budgets/Cost Explorer). If null, falls back to aws_region."
  type        = string
  default     = null
}

/**
 * @variable aws_region
 * AWS region used by the module.
 *
 * @description Also used as a fallback for console links.
 * @type string
 * @default null
 */
variable "aws_region" {
  description = "AWS region used by this module; also fallback for console links."
  type        = string
  default     = null
}

/**
 * @variable dashboard_services
 * List of service names to include as quick-link sections on the dashboard.
 *
 * @type list(string)
 * @default []
 */
variable "dashboard_services" {
  description = "List of service names to render as quick-link sections on the dashboard."
  type        = list(string)
  default     = []
}
