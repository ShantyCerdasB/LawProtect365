/**
 * Project prefix used in naming KMS keys and aliases.
 * Example: "lawprotect365".
 */
variable "project_name" {
  description = "Project prefix (e.g. lawprotect365)."
  type        = string
}

/**
 * Deployment environment.
 * Accepted values: "dev" | "prod".
 */
variable "env" {
  description = "Environment (dev|prod)."
  type        = string
}

/**
 * AWS Account ID where the KMS keys will be created.
 * Passed from the root module to avoid using data sources.
 */
variable "account_id" {
  description = "AWS account ID."
  type        = string
}

/**
 * AWS Region where the KMS keys will be deployed.
 * Example: "us-east-1".
 */
variable "region" {
  description = "AWS region (e.g., us-east-1)."
  type        = string
}

/**
 * Optional list of IAM role ARNs with admin/use permissions on the CMKs.
 * Can be left empty if no additional admin roles are required.
 */
variable "admin_role_arns" {
  description = "Optional IAM role ARNs with admin/use permissions on the CMKs."
  type        = list(string)
  default     = []
}

/**
 * Common tags applied to all KMS resources created by this module.
 */
variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}

/**
 * Key spec for the asymmetric signing key.
 * Example values: "RSA_2048", "RSA_3072", "ECC_NIST_P256".
 */
variable "signing_key_spec" {
  description = "Key spec for the signing key (e.g., RSA_2048)."
  type        = string
  default     = "RSA_2048"
}
