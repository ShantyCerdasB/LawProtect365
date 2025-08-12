############################################################
# documents-service — variables.tf
# Inputs used by main.tf and data-policies.tf
############################################################

########################
# Core identifiers
########################
variable "project_name" {
  description = "Project slug/prefix used for resource names and tags."
  type        = string
}

variable "env" {
  description = "Deployment environment (e.g., dev, prod)."
  type        = string
}
variable "existing_sns_topic_arn" {
  description = "ARN of the existing SNS topic for budget alerts"
  type        = string
  default     = null
}

variable "budgets_alerts_topic_arn" {
  type        = string
  description = "Shared SNS topic ARN for budgets alerts"
}

########################
# S3 buckets (created by this service)
########################
variable "templates_bucket_name" {
  description = "S3 bucket name to store template assets (PDF/DOCX/base files)."
  type        = string
}

variable "documents_bucket_name" {
  description = "S3 bucket name to store final PDFs and user uploads."
  type        = string
}

########################
# DynamoDB (single-table design)
########################
variable "documents_table_name" {
  description = "DynamoDB table name for templates, drafts, and lightweight document metadata."
  type        = string
}
variable "lambda_assume_role_policy" {
  description = "IAM policy document that grants Lambda permission to assume the role"
  type        = string
}
########################
# Lambda code artifacts (ZIPs) + CI/CD
########################
variable "code_bucket" {
  description = "S3 bucket that holds Lambda deployment ZIPs (e.g., documents-*.zip)."
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for CodeBuild/CodePipeline artifacts (used by deployment-service)."
  type        = string
}

variable "compute_type" {
  description = "CodeBuild compute type (e.g., BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM)."
  type        = string
}

variable "environment_image" {
  description = "CodeBuild container image (e.g., aws/codebuild/standard:6.0)."
  type        = string
}

variable "aws_region" {
  description = "AWS region for the service"
  type        = string
}

variable "environment_variables" {
  description = <<-EOT
    Extra environment variables for the deployment pipeline (NOT for Lambdas).
    Format: list of objects: [{ name = string, value = string, type = "PLAINTEXT" | "PARAMETER_STORE" | "SECRETS_MANAGER" }]
  EOT
  type = list(object({
    name  = string
    value = string
    type  = string
  }))
  default = []
}

variable "github_owner" {
  description = "VCS owner/org for the repository (for deployment-service)."
  type        = string
}

variable "github_repo" {
  description = "Repository name (for deployment-service)."
  type        = string
}

variable "provider_type" {
  description = "SCM provider type expected by deployment-service (e.g., GITHUB)."
  type        = string
}

variable "github_branch" {
  description = "Git branch for CI/CD pipeline (e.g., main)."
  type        = string
}

########################
# API Gateway / Observability / WAF
########################
variable "access_log_format" {
  description = "API Gateway v2 access log JSON format string."
  type        = string
}

variable "logs_kms_key_arn" {
  description = "KMS CMK ARN to encrypt CloudWatch Logs and SNS topics for alerts."
  type        = string
}

variable "attach_waf_web_acl" {
  description = "Attach an AWS WAF Web ACL to the API Gateway stage."
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL to attach (required if attach_waf_web_acl = true)."
  type        = string
  default     = ""
}

########################
# AuthN/AuthZ (optional JWT authorizer)
########################
variable "enable_jwt_authorizer" {
  description = "Enable API Gateway JWT authorizer (Cognito or other OIDC)."
  type        = bool
  default     = false
}

variable "jwt_issuer" {
  description = "OIDC issuer URL used by the JWT authorizer (e.g., Cognito user pool issuer)."
  type        = string
  default     = ""
}

variable "jwt_audiences" {
  description = "List of audiences (client IDs) accepted by the JWT authorizer."
  type        = list(string)
  default     = []
}

########################
# Localization for templates/drafts
########################
variable "default_locale" {
  description = "Default locale for templates (e.g., en, es)."
  type        = string
  default     = "en"
}

variable "supported_locales" {
  description = "List of supported locales for templates rendering."
  type        = list(string)
  default     = ["en"]
}

########################
# S3 encryption controls (service-level enforcement)
########################
variable "templates_encryption" {
  description = "Server-side encryption required for writes to templates bucket: SSE_S3 or SSE_KMS."
  type        = string
  default     = "SSE_S3"
  validation {
    condition     = contains(["SSE_S3", "SSE_KMS"], var.templates_encryption)
    error_message = "templates_encryption must be either SSE_S3 or SSE_KMS."
  }
}

variable "templates_kms_key_arn" {
  description = "KMS Key ARN to enforce on templates bucket writes (required if templates_encryption = SSE_KMS)."
  type        = string
  default     = ""
}

variable "documents_encryption" {
  description = "Server-side encryption required for writes to documents bucket: SSE_S3 or SSE_KMS."
  type        = string
  default     = "SSE_S3"
  validation {
    condition     = contains(["SSE_S3", "SSE_KMS"], var.documents_encryption)
    error_message = "documents_encryption must be either SSE_S3 or SSE_KMS."
  }
}

variable "documents_kms_key_arn" {
  description = "KMS Key ARN to enforce on documents bucket writes (required if documents_encryption = SSE_KMS)."
  type        = string
  default     = ""
}

########################
# Finalization controls (Lambda)
########################
variable "finalize_timeout_ms" {
  description = "Soft timeout (ms) used by the finalize Lambda to compose the PDF server-side."
  type        = number
  default     = 15000
}

variable "max_upload_mb" {
  description = "Maximum upload size (MB) allowed for user PDFs/assets (validated by the service)."
  type        = number
  default     = 25
}

########################
# Alerts / Budgets
########################
variable "alerts_emails" {
  description = "Email list for SNS alert subscriptions (email-json)."
  type        = list(string)
  default     = []
}

variable "documents_budget_amount" {
  description = "Monthly AWS budget (USD) for this service (FinOps)."
  type        = number
  default     = 75
}

variable "threshold_percentages" {
  description = "Alert thresholds (percent of budget) for AWS Budgets."
  type        = list(number)
  default     = [50, 80, 100]
}

variable "budget_notify_emails" {
  description = "Additional email recipients for budget alerts (backup to SNS)."
  type        = list(string)
  default     = []
}

variable "extra_inline_policies" {
  description = "Additional inline IAM policy JSONs to merge with the module's defaults."
  type        = map(string)
  default     = {}
}
variable "shared_lambda_env" {
  description = "Environment variables shared by ALL Lambdas in this service (e.g., { DB_SECRET_ARN = module.db_secret.secret_arn })."
  type        = map(string)
  default     = {}
}