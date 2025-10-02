/**
 * ARN of the created IAM role.
 *
 * Useful for referencing the role in other modules or AWS resources.
 */
output "role_arn" {
  description = "ARN of the created IAM role."
  value       = aws_iam_role.role.arn
}

/**
 * ID of the created IAM role.
 *
 * AWS resource ID used internally for role management.
 */
output "role_id" {
  description = "ID of the created IAM role."
  value       = aws_iam_role.role.id
}

/**
 * Name of the created IAM role.
 *
 * Matches the name provided in var.role_name.
 */
output "role_name" {
  description = "Name of the created IAM role."
  value       = aws_iam_role.role.name
}

/**
 * Unique identifier for the IAM role across AWS accounts.
 *
 * This value is different from role_id and is immutable.
 */
output "role_unique_id" {
  description = "Stable unique identifier for the IAM role."
  value       = aws_iam_role.role.unique_id
}

/**
 * IAM propagation delay resource.
 *
 * Use this to ensure IAM policies are fully propagated before creating dependent resources.
 */
output "iam_propagation_delay" {
  description = "Time sleep resource for IAM policy propagation."
  value       = try(time_sleep.wait_for_iam_propagation[0].id, null)
}