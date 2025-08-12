/**
 * @file Output values for the AWS Budgets module.
 * Provides identifiers for budgets, SNS topic ARN, and CloudWatch dashboard name.
 */

/**
 * @output overall_budget_id
 * The ID of the overall AWS Budget, if created.
 *
 * @description Returns `null` if `create_overall_budget` is false.
 * @value try(aws_budgets_budget.overall[0].id, null)
 */
output "overall_budget_id" {
  description = "The ID of the overall budget (if created)."
  value       = try(aws_budgets_budget.overall[0].id, null)
}

/**
 * @output service_budget_ids
 * Map of per-service AWS Budget IDs, keyed by service name.
 *
 * @description Useful for referencing or managing budgets individually.
 * @value { for k, v in aws_budgets_budget.service : k => v.id }
 */
output "service_budget_ids" {
  description = "Map of per-service budget IDs keyed by service name."
  value       = { for k, v in aws_budgets_budget.service : k => v.id }
}

/**
 * @output sns_topic_arn
 * ARN of the SNS topic used for budget notifications.
 *
 * @description Returns `null` if no SNS topic is created or provided.
 * @value local.sns_topic_arn
 */
output "sns_topic_arn" {
  description = "SNS topic ARN used for budget notifications (if any)."
  value       = local.sns_topic_arn
}

/**
 * @output dashboard_name
 * Name of the CloudWatch dashboard created by this module.
 *
 * @description Returns `null` if `create_dashboard` is false.
 * @value try(aws_cloudwatch_dashboard.budgets[0].dashboard_name, null)
 */
output "dashboard_name" {
  description = "Name of the CloudWatch dashboard (if created)."
  value       = try(aws_cloudwatch_dashboard.budgets[0].dashboard_name, null)
}
