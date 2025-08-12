############################################
# Cognito Module Variables
############################################

/**
 * @var project_name
 * @description
 * Prefix used for tagging and naming all Cognito-related resources.
 * Example: lawprotect365
 */
variable "project_name" {
  description = "Project prefix for tagging and naming."
  type        = string
}

/**
 * @var env
 * @description
 * Deployment environment for this stack.
 * Allowed values: "dev", "prod".
 */
variable "env" {
  description = "Deployment environment (\"dev\" or \"prod\")."
  type        = string
}

/**
 * @var aws_region
 * @description
 * AWS region where Cognito resources will be created.
 * Example: us-east-1
 */
variable "aws_region" {
  description = "AWS region where resources will be created."
  type        = string
}

############################################
# OAuth URLs
############################################

/**
 * @var callback_urls
 * @description
 * List of app callback URLs used after successful authentication.
 * Example: ["https://<cloudfront>/callback"]
 */
variable "callback_urls" {
  description = "List of app callback URLs (e.g. https://<cloudfront>/callback)."
  type        = list(string)
}

/**
 * @var logout_urls
 * @description
 * List of app logout URLs used after signing out.
 * Example: ["https://<cloudfront>/logout"]
 */
variable "logout_urls" {
  description = "List of app logout URLs (e.g. https://<cloudfront>/logout)."
  type        = list(string)
}

############################################
# Google OIDC Federation
############################################

/**
 * @var google_client_id
 * @description
 * OAuth Client ID for Google federation.
 */
variable "google_client_id" {
  description = "OAuth Client ID for Google federation."
  type        = string
}

/**
 * @var google_client_secret
 * @description
 * OAuth Client Secret for Google federation.
 * Marked as sensitive to prevent logging.
 */
variable "google_client_secret" {
  description = "OAuth Client Secret for Google federation."
  type        = string
  sensitive   = true
}

############################################
# Azure OIDC Federation
############################################

/**
 * @var azure_client_id
 * @description
 * OAuth Client ID for Azure AD federation.
 */
variable "azure_client_id" {
  description = "OAuth Client ID for Azure AD federation."
  type        = string
}

/**
 * @var azure_client_secret
 * @description
 * OAuth Client Secret for Azure AD federation.
 * Marked as sensitive to prevent logging.
 */
variable "azure_client_secret" {
  description = "OAuth Client Secret for Azure AD federation."
  type        = string
  sensitive   = true
}

############################################
# Apple OIDC Federation
############################################

/**
 * @var apple_client_id
 * @description
 * Client ID for Sign-in with Apple.
 * Leave empty to disable Apple federation.
 */
variable "apple_client_id" {
  description = "Client ID for Sign-in with Apple (leave empty to disable)."
  type        = string
  default     = ""
}

/**
 * @var apple_private_key_arn
 * @description
 * ARN of the Secrets Manager secret containing the Apple private key JWT.
 */
variable "apple_private_key_arn" {
  description = "ARN of the Secrets Manager secret containing the Apple private key JWT."
  type        = string
  default     = ""
}

############################################
# MFA & Lambda Integration
############################################

/**
 * @var sns_mfa_role_arn
 * @description
 * IAM role ARN that Cognito uses to send SMS for MFA.
 */
variable "sns_mfa_role_arn" {
  description = "ARN of the IAM role Cognito uses to send SMS for MFA."
  type        = string
}

/**
 * @var pre_auth_lambda_arn
 * @description
 * ARN of the Lambda function used for pre-authentication checks.
 */
variable "pre_auth_lambda_arn" {
  description = "ARN of the Lambda function for pre-authentication checks."
  type        = string
}

############################################
# Tags
############################################

/**
 * @var tags
 * @description
 * Common tags applied to all Cognito resources in this module.
 */
variable "tags" {
  description = "Common tags to apply to all Cognito resources."
  type        = map(string)
  default     = {}
}
