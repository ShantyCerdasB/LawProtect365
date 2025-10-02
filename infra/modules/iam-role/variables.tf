/**
 * Name of the IAM role to create.
 * 
 * Example: "my-service-role"
 */
variable "role_name" {
  description = "Name of the IAM role to create."
  type        = string
}

/**
 * JSON policy document that grants entities permission to assume the role.
 * 
 * Typically generated with `aws_iam_policy_document`.
 */
variable "assume_role_policy" {
  description = "JSON policy that grants an entity permission to assume the role."
  type        = string
}

/**
 * List of ARNs for AWS-managed or customer-managed policies to attach.
 * 
 * Example: ["arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"]
 */
variable "managed_policy_arns" {
  description = "List of ARNs for AWS-managed or customer-managed policies to attach."
  type        = list(string)
  default     = []
}

/**
 * Set of inline policy names to create.
 * 
 * Example: ["s3-readonly", "kms-decrypt", "dynamodb-access"]
 */

/**
 * Map of inline policy names to JSON policy documents.
 * 
 * Example:
 * {
 *   "sns-send" = jsonencode({
 *     Statement = [...]
 *   })
 * }
 */
variable "inline_policies" {
  description = <<-EOT
    Map of inline policy names to JSON policy documents.
    e.g. { "sns-send" = jsonencode({ Statement = [...] }) }
  EOT
  type        = map(string)
  default     = {}
}

/**
 * Tag value for "Project".
 * 
 * Used for consistent tagging of resources.
 */
variable "project_name" {
  description = "Tag: project name."
  type        = string
}

/**
 * Tag value for "Env".
 * 
 * Example: "dev", "staging", "prod".
 */
variable "env" {
  description = "Tag: environment."
  type        = string
}
