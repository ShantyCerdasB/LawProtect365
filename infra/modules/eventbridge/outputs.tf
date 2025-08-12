/**
 * Name of the created EventBridge event bus.
 */
output "eventbridge_bus_name" {
  description = "The name of the created EventBridge event bus."
  value       = aws_eventbridge_bus.event_bus.name
}

/**
 * Name of the created EventBridge rule.
 */
output "eventbridge_rule_name" {
  description = "The name of the created EventBridge rule."
  value       = aws_eventbridge_rule.event_rule.name
}

/**
 * ARN of the created EventBridge rule.
 */
output "eventbridge_rule_arn" {
  description = "The ARN of the created EventBridge rule."
  value       = aws_eventbridge_rule.event_rule.arn
}

/**
 * Target ID attached to the EventBridge rule.
 */
output "eventbridge_target_id" {
  description = "The target ID attached to the EventBridge rule."
  value       = aws_eventbridge_target.event_target.target_id
}