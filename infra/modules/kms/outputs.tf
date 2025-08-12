/**
 * @output kms_key_id
 * @description
 * The unique identifier of the created AWS KMS key.
 *
 * @remarks
 * This is the `KeyId` used to reference the key in AWS API calls and Terraform configurations.
 */
output "kms_key_id" {
  description = "The KMS key ID."
  value       = aws_kms_key.master_key.key_id
}

/**
 * @output kms_key_arn
 * @description
 * The full Amazon Resource Name (ARN) of the AWS KMS key.
 *
 * @remarks
 * This is required for IAM policies or cross-account access configurations.
 */
output "kms_key_arn" {
  description = "The KMS key ARN."
  value       = aws_kms_key.master_key.arn
}

/**
 * @output kms_alias_name
 * @description
 * The name of the KMS alias in the format `alias/<key_name>`.
 *
 * @remarks
 * Useful for referencing the key in AWS services that accept aliases instead of ARNs.
 */
output "kms_alias_name" {
  description = "The KMS alias name (alias/<key_name>)."
  value       = aws_kms_alias.key_alias.name
}

/**
 * @output kms_alias_arn
 * @description
 * The full ARN of the KMS alias.
 *
 * @remarks
 * Used when IAM policies or AWS service integrations require the alias ARN.
 */
output "kms_alias_arn" {
  description = "The KMS alias ARN."
  value       = aws_kms_alias.key_alias.arn
}

/**
 * @output cmk_policy_json
 * @description
 * The JSON policy document applied to the KMS key.
 *
 * @remarks
 * Useful for auditing, debugging, or reusing the key policy in other contexts.
 */
output "cmk_policy_json" {
  value = data.aws_iam_policy_document.cmk_policy.json
}
