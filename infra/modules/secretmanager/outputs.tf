/**
 * @file outputs.tf
 * @module secrets-manager
 * @description
 * Exposes key identifiers of the AWS Secrets Manager secret so other modules
 * and root configurations can reference them (e.g., ARNs for IAM policies,
 * IDs for cross-module references).
 */

/**
 * @output secret_id
 * @description
 * The unique ID of the AWS Secrets Manager secret.
 */
output "secret_id" {
  description = "The Secrets Manager secret ID."
  value       = aws_secretsmanager_secret.secret.id
}

/**
 * @output secret_arn
 * @description
 * The Amazon Resource Name (ARN) of the AWS Secrets Manager secret. 
 * This can be used for IAM policy references or service integrations.
 */
output "secret_arn" {
  description = "The ARN of the Secrets Manager secret."
  value       = aws_secretsmanager_secret.secret.arn
}

/**
 * @output version_id
 * @description
 * The version ID associated with the stored secret value.
 * Useful for rotation workflows or tracking changes over time.
 */
output "version_id" {
  description = "The version ID of the stored secret."
  value       = aws_secretsmanager_secret_version.secret_version.version_id
}
