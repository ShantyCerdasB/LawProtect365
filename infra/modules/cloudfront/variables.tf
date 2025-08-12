/**
 * @file Input variables for the CloudFront module.
 * Defines configuration for serving an S3 bucket securely through CloudFront,
 * with optional custom domains, SSL, and access restrictions.
 */

/**
 * @variable bucket_name
 * Name of the S3 bucket to serve content from via CloudFront.
 *
 * @description This bucket will be configured as the CloudFront origin.
 * @type string
 */
variable "bucket_name" {
  description = "Name of the S3 bucket to serve via CloudFront."
  type        = string
}

/**
 * @variable project_name
 * Project prefix for naming and tagging resources.
 *
 * @type string
 */
variable "project_name" {
  description = "Project prefix for naming and tagging."
  type        = string
}

/**
 * @variable env
 * Deployment environment identifier.
 *
 * @description Examples: `dev`, `prod`.
 * @type string
 */
variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}

/**
 * @variable aliases
 * List of custom domain names (CNAMEs) for the CloudFront distribution.
 *
 * @description Optional; when set, you should also provide `acm_certificate_arn`.
 * @type list(string)
 * @default []
 */
variable "aliases" {
  description = "Optional CNAMEs (e.g. your custom domains)."
  type        = list(string)
  default     = []
}

/**
 * @variable acm_certificate_arn
 * ARN of the ACM certificate to use for HTTPS with custom domain aliases.
 *
 * @description Must be issued in the `us-east-1` region for CloudFront.
 * @type string
 * @default ""
 */
variable "acm_certificate_arn" {
  description = "ARN of an ACM certificate if using custom domain aliases."
  type        = string
  default     = ""
}

/**
 * @variable price_class
 * CloudFront price class defining which edge locations will serve content.
 *
 * @description 
 * - `PriceClass_100` = Only US, Canada, Europe.
 * - `PriceClass_200` = US, Canada, Europe, Asia, Middle East, Africa.
 * - `PriceClass_All` = All locations.
 * @type string
 * @default "PriceClass_100"
 */
variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

/**
 * @variable restrict_bucket_access
 * Whether to restrict S3 bucket access so that only the CloudFront OAI can read objects.
 *
 * @description If `true`, a bucket policy is created allowing only the OAI to perform `s3:GetObject`.
 * @type bool
 * @default true
 */
variable "restrict_bucket_access" {
  description = "Whether to lock the S3 bucket so only CloudFront can fetch from it."
  type        = bool
  default     = true
}
