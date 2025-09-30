############################################
# sign-service — variables (documented)
############################################

# Short name of the project (e.g., lawprotect365)
variable "project_name" {
  description = "Project short name (e.g., lawprotect365)"
  type        = string
}

variable "aws_caller" {
  description = "AWS caller identity information"
  type        = any
}

# Deployment environment (e.g., dev, prod)
variable "env" {
  description = "Environment (e.g., dev, prod)"
  type        = string
}

variable "event_bus_arn" {
  description = "ARN of the EventBridge bus for domain events"
  type        = string
}

variable "budgets_alerts_topic_arn" {
  type        = string
  description = "Shared SNS topic ARN for budgets alerts"
}

# ---------- Code artifacts ----------
# Name or ID of the S3 bucket where Lambda .zip artifacts are stored
variable "code_bucket" {
  description = "S3 bucket (name/ID) where Lambda .zip artifacts are stored"
  type        = string
}

# ---------- Security & Observability ----------
# ARN of the KMS CMK used to encrypt logs, SNS messages, and API logs
variable "logs_kms_key_arn" {
  description = "KMS CMK ARN for encrypting logs/SNS/API logs"
  type        = string
}

# List of email addresses to receive SNS alerts (email-json)
variable "alerts_emails" {
  description = "Email recipients for SNS alerts (email-json)"
  type        = list(string)
  default     = []
}

# Access log format for API Gateway v2
variable "access_log_format" {
  description = "API Gateway v2 access log format"
  type        = string
}

# Whether to attach a WAF Web ACL to the HTTP API
variable "attach_waf_web_acl" {
  description = "Attach a WAF Web ACL to this HTTP API"
  type        = bool
  default     = false
}

# ARN of the WAF Web ACL (only required if attach_waf_web_acl = true)
variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN (if attach_waf_web_acl = true)"
  type        = string
  default     = ""
}

# ---------- Integrations ----------
# Name or ID of the S3 bucket containing final PDFs from documents-service
variable "documents_bucket_name" {
  description = "S3 bucket name/ID with final PDFs from documents-service"
  type        = string
}

# ARN of the asymmetric KMS key used for cryptographic signing (KMS:Sign) of document hashes
variable "kms_sign_key_arn" {
  description = "ARN of the asymmetric KMS key used for KMS Sign"
  type        = string
}

# Name of the evidence bucket to create for immutable storage of evidence packages and certificates
variable "evidence_bucket_name" {
  description = "Evidence bucket name to create"
  type        = string
}

# ---------- IAM policy documents ----------
variable "lambda_assume_role_policy" {
  description = "IAM policy document that grants Lambda permission to assume the role"
  type        = string
}

# ---------- Optional route protection (JWT) ----------
# Whether to protect API routes with a JWT authorizer (Cognito)
variable "enable_jwt_authorizer" {
  description = "Protect routes with JWT authorizer (Cognito)"
  type        = bool
  default     = false
}

# JWT issuer URL (e.g., https://cognito-idp.<region>.amazonaws.com/<userPoolId>)
variable "jwt_issuer" {
  description = "JWT issuer URL (e.g., https://cognito-idp.<region>.amazonaws.com/<userPoolId>)"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region for the service"
  type        = string
  default     = null
}

# List of allowed audiences (Cognito app client IDs)
variable "jwt_audiences" {
  description = "Allowed audiences (Cognito app client IDs)"
  type        = list(string)
  default     = []
}

# ---------- Budgets ----------
# Monthly budget in USD for the sign-service
variable "sign_budget_amount" {
  description = "Monthly budget (USD) for sign-service"
  type        = number
}

# List of budget thresholds as percentages (e.g., [80, 100, 120])
variable "threshold_percentages" {
  description = "Budget thresholds (e.g., [80,100,120])"
  type        = list(number)
}

# Backup email addresses for budget alerts
variable "budget_notify_emails" {
  description = "Backup emails for budget alerts"
  type        = list(string)
  default     = []
}

# ---------- CI/CD (deployment-service) ----------
# S3 bucket for CodePipeline and CodeBuild artifacts
variable "artifacts_bucket" {
  description = "S3 bucket for CodePipeline/CodeBuild artifacts"
  type        = string
}

# List of CodeBuild environment variables
# Format: [{ name, value, type: PLAINTEXT|PARAMETER_STORE|SECRETS_MANAGER }]
variable "environment_variables" {
  description = "CodeBuild env vars: [{ name, value, type: PLAINTEXT|PARAMETER_STORE|SECRETS_MANAGER }]"
  type        = list(object({ name = string, value = string, type = string }))
  default     = []
}

# Docker image for the CodeBuild environment
variable "environment_image" {
  type = string
}

# Compute type for the CodeBuild environment (e.g., BUILD_GENERAL1_SMALL)
variable "compute_type" {
  type = string
}

# GitHub repository owner
variable "github_owner" {
  type = string
}

# GitHub repository name
variable "github_repo" {
  type = string
}

# Source provider type for CodePipeline (e.g., GitHub)
variable "provider_type" {
  type = string
}

# GitHub branch to use for deployments
variable "github_branch" {
  type = string
}

# Evidence encryption mode for the evidence bucket
variable "evidence_encryption" {
  description = "Server-side encryption for evidence uploads: SSE_S3 or SSE_KMS."
  type        = string
  default     = "SSE_S3"

  validation {
    condition     = contains(["SSE_S3", "SSE_KMS"], var.evidence_encryption)
    error_message = "evidence_encryption must be SSE_S3 or SSE_KMS."
  }
}

# Only required when evidence_encryption == SSE_KMS
variable "evidence_kms_key_arn" {
  description = "KMS CMK ARN used for S3 SSE-KMS when evidence_encryption == SSE_KMS."
  type        = string
  default     = null
}
variable "extra_inline_policies" {
  description = "Additional inline IAM policy JSONs to merge with the module's defaults."
  type        = map(string)
  default     = {}
}
variable "shared_lambda_env" {
  description = "Environment variables shared by ALL Lambdas in this service (e.g., { DB_SECRET_ARN = <arn>, FOO = bar })."
  type        = map(string)
  default     = {}
}

variable "existing_sns_topic_arn" {
  description = "ARN of the existing SNS topic for budget alerts"
  type        = string
  default     = null
}

variable "outbox_table_name" {
  description = "Name of the outbox DynamoDB table for event publishing"
  type        = string
}