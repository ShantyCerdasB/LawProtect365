/**
 * @file variables.tf
 * @module s3-bucket
 * @description
 * Input variables for a generic S3 bucket module supporting optional versioning,
 * encryption, and project-based tagging.
 */

/**
 * @var bucket_name
 * @type string
 * @description
 * The unique name for the S3 bucket.
 * This must be globally unique across AWS.
 */
variable "bucket_name" {
  description = "Name of the S3 bucket."
  type        = string
}

/**
 * @var enable_versioning
 * @type bool
 * @default true
 * @description
 * Whether to enable versioning on the S3 bucket.
 * Versioning allows multiple variants of an object to be kept in the bucket.
 */
variable "enable_versioning" {
  description = "Enable bucket versioning."
  type        = bool
  default     = true
}

/**
 * @var enable_encryption
 * @type bool
 * @default true
 * @description
 * Whether to enable default server-side encryption (AES256) for objects stored in the bucket.
 */
variable "enable_encryption" {
  description = "Enable default AES256 encryption."
  type        = bool
  default     = true
}

/**
 * @var project_name
 * @type string
 * @description
 * Prefix used in resource tags to identify the project.
 */
variable "project_name" {
  description = "Project prefix for tagging."
  type        = string
}

/**
 * @var env
 * @type string
 * @description
 * The deployment environment name (e.g., dev, staging, prod) used for tagging.
 */
variable "env" {
  description = "Deployment environment (e.g. dev or prod)."
  type        = string
}

/**
 * @var enable_acl
 * @type bool
 * @default false
 * @description
 * Whether to enable ACL for CloudFront logging or other services that require ACL access.
 */
variable "enable_acl" {
  description = "Enable ACL for CloudFront logging."
  type        = bool
  default     = false
}