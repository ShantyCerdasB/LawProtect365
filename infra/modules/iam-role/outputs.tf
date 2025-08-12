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
