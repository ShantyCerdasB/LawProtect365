/**
 * @file outputs.tf
 * @brief Public outputs from the EventBridge (Bus/Rule/Target) module.
 */

/**
 * Event bus name.
 * @example "lawprotect365-event-bus-dev"
 */
output "eventbridge_bus_name" {
  description = "Event bus name"
  value       = aws_cloudwatch_event_bus.event_bus.name
}

/**
 * Event bus ARN.
 */
output "eventbridge_bus_arn" {
  description = "Event bus ARN"
  value       = aws_cloudwatch_event_bus.event_bus.arn
}

/**
 * Rule name (if created).
 * @remarks Returns null when `create_rule = false`.
 */
output "eventbridge_rule_name" {
  description = "Rule name (if created)"
  value       = try(aws_cloudwatch_event_rule.event_rule[0].name, null)
}

/**
 * Rule ARN (if created).
 * @remarks Returns null when `create_rule = false`.
 */
output "eventbridge_rule_arn" {
  description = "Rule ARN (if created)"
  value       = try(aws_cloudwatch_event_rule.event_rule[0].arn, null)
}

/**
 * Target ID (if created).
 * @remarks Returns null when `create_target = false` or `create_rule = false`.
 */
output "eventbridge_target_id" {
  description = "Target ID (if created)"
  value       = try(aws_cloudwatch_event_target.event_target[0].target_id, null)
}
