/**
 * @file variables.tf
 * @module notifications_service
 * @description
 * Input variables for the notifications-service Terraform module.
 */

variable "project_name" {
  description = "Project short name (e.g., lawprotect365)"
  type        = string
}

variable "env" {
  description = "Environment (e.g., dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the service"
  type        = string
}

variable "code_bucket" {
  description = "S3 bucket (name/ID) where Lambda .zip artifacts are stored"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for CodePipeline/CodeBuild artifacts"
  type        = string
}

variable "lambda_assume_role_policy" {
  description = "IAM policy document that grants Lambda permission to assume the role"
  type        = string
}

variable "shared_lambda_env" {
  description = "Environment variables shared by ALL Lambdas in this service (e.g., { DB_SECRET_ARN = <arn> })"
  type        = map(string)
  default     = {}
}

variable "db_secret_read_policy" {
  description = "IAM policy document for reading database secrets"
  type        = string
}

variable "extra_inline_policies" {
  description = "Additional inline IAM policy JSONs to merge with the module's defaults"
  type        = map(string)
  default     = {}
}

variable "shared_ts_layer_arn" {
  description = "ARN of the shared-ts Lambda layer from root"
  type        = string
}

variable "event_bus_name" {
  description = "EventBridge bus name used by the platform (shared)"
  type        = string
}

variable "logs_kms_key_arn" {
  description = "KMS CMK ARN for encrypting logs/SNS/API logs"
  type        = string
}

variable "alerts_emails" {
  description = "Email recipients for SNS alerts (email-json)"
  type        = list(string)
  default     = []
}

variable "existing_sns_topic_arn" {
  description = "ARN of the existing SNS topic for budget alerts"
  type        = string
  default     = null
}

variable "notifications_budget_amount" {
  description = "Monthly budget (USD) for notifications-service"
  type        = number
}

variable "threshold_percentages" {
  description = "Budget thresholds (e.g., [80,100,120])"
  type        = list(number)
}

variable "budget_notify_emails" {
  description = "Backup emails for budget alerts"
  type        = list(string)
  default     = []
}

variable "github_connection_arn" {
  description = "ARN of existing GitHub CodeStar connection"
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "provider_type" {
  description = "Source provider type for CodePipeline (e.g., GitHub)"
  type        = string
}

variable "compute_type" {
  description = "Compute type for the CodeBuild environment (e.g., BUILD_GENERAL1_SMALL)"
  type        = string
}

variable "environment_image" {
  description = "Docker image for the CodeBuild environment"
  type        = string
}

variable "environment_variables" {
  description = "CodeBuild env vars: [{ name, value, type: PLAINTEXT|PARAMETER_STORE|SECRETS_MANAGER }]"
  type        = list(object({ name = string, value = string, type = string }))
  default     = []
}

variable "db_max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 10
}

variable "db_connection_timeout" {
  description = "Database connection timeout in milliseconds"
  type        = number
  default     = 30000
}

variable "ses_from_email" {
  description = "SES email address for sending notifications"
  type        = string
}

variable "ses_reply_to_email" {
  description = "SES reply-to email address"
  type        = string
  default     = ""
}

variable "ses_configuration_set" {
  description = "SES configuration set name (optional)"
  type        = string
  default     = null
}

variable "ses_domain_name" {
  description = "SES domain name for email identity (optional, if using domain instead of email)"
  type        = string
  default     = null
}

variable "ses_hosted_zone_id" {
  description = "Route53 hosted zone ID for SES domain verification (required if creating domain identity)"
  type        = string
  default     = null
}

variable "create_ses_identity" {
  description = "Whether to create SES email identity"
  type        = bool
  default     = true
}

variable "pinpoint_application_id" {
  description = "Pinpoint application ID for SMS sending (optional if create_pinpoint_app = true)"
  type        = string
  default     = ""
}

variable "pinpoint_sender_id" {
  description = "Pinpoint sender ID for SMS"
  type        = string
}

variable "create_pinpoint_app" {
  description = "Whether to create Pinpoint application"
  type        = bool
  default     = true
}

variable "fcm_service_account_key" {
  description = "FCM service account key JSON (sensitive, stored in Secrets Manager)"
  type        = string
  default     = null
  sensitive   = true
}

variable "fcm_project_id" {
  description = "FCM project ID"
  type        = string
  default     = null
}

variable "fcm_secret_arn" {
  description = "ARN of existing FCM secret in Secrets Manager (if not creating new)"
  type        = string
  default     = null
}

variable "apns_key_id" {
  description = "APNS key ID (sensitive, stored in Secrets Manager)"
  type        = string
  default     = null
  sensitive   = true
}

variable "apns_team_id" {
  description = "APNS team ID"
  type        = string
  default     = null
}

variable "apns_key" {
  description = "APNS private key (sensitive, stored in Secrets Manager)"
  type        = string
  default     = null
  sensitive   = true
}

variable "apns_bundle_id" {
  description = "APNS bundle ID"
  type        = string
  default     = null
}

variable "apns_production" {
  description = "Whether to use APNS production environment"
  type        = bool
  default     = true
}

variable "apns_secret_arn" {
  description = "ARN of existing APNS secret in Secrets Manager (if not creating new)"
  type        = string
  default     = null
}

variable "enable_email" {
  description = "Enable email notifications"
  type        = bool
  default     = true
}

variable "enable_sms" {
  description = "Enable SMS notifications"
  type        = bool
  default     = true
}

variable "enable_push" {
  description = "Enable push notifications"
  type        = bool
  default     = false
}

variable "eventbridge_rule_arn" {
  description = "ARN of EventBridge rule (optional, for IAM policy)"
  type        = string
  default     = null
}

variable "secret_arns" {
  description = "Additional secret ARNs for IAM policy (beyond FCM/APNS)"
  type        = list(string)
  default     = []
}
