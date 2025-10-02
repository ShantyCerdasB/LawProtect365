variable "project_name" {
  description = "The project name"
  type        = string
}

variable "env" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "github_connection_arn" {
  description = "ARN of existing GitHub CodeStar connection"
  type        = string
}

variable "code_bucket" {
  description = "Name of the S3 bucket for CI/CD artifacts"
  type        = string
}

variable "existing_sns_topic_arn" {
  description = "ARN of the existing SNS topic for budget alerts"
  type        = string
  default     = null
}

variable "lambda_exec_role_arn" {
  description = "IAM role ARN that Lambdas will assume"
  type        = string
}

variable "apple_client_id" {
  description = "Client ID for Sign in with Apple"
  type        = string
}

variable "callback_url" {
  description = "OIDC callback URL for all IdPs"
  type        = string
}

variable "logout_url" {
  description = "Logout redirect URL for all IdPs"
  type        = string
}

variable "networking" {
  description = "Networking outputs from the root module"
  type = object({
    private_subnet_ids       = list(string)
    lambda_security_group_id = string
    rds_security_group_id    = string
  })
}

variable "gcp_project_id" {
  description = "GCP project ID for Google OAuth"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the service"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for Google OAuth"
  type        = string
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
}

############################################
# API Gateway variables
############################################
variable "logs_kms_key_arn" {
  description = "ARN of the KMS key used to encrypt CloudWatch log group for API Gateway"
  type        = string
  default     = null
}

variable "attach_waf_web_acl" {
  description = "Whether to attach an AWS WAF Web ACL to the API Gateway for protection"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL to attach to the API Gateway stage"
  type        = string
  default     = null
}

variable "access_log_format" {
  description = <<EOT
JSON-encoded format for API Gateway access logs.
Example:
jsonencode({
  requestId      = "$context.requestId"
  ip             = "$context.identity.sourceIp"
  requestTime    = "$context.requestTime"
  httpMethod     = "$context.httpMethod"
  routeKey       = "$context.routeKey"
  status         = "$context.status"
  protocol       = "$context.protocol"
  responseLength = "$context.responseLength"
})
EOT
  type = string
}

variable "alerts_emails" {
  description = "List of email addresses to receive auth-service alerts"
  type        = list(string)
}

variable "auth_budget_amount" {
  description = "Monthly cost budget for auth-service (USD unless overridden)."
  type        = number
  default     = 150
}

variable "budget_currency" {
  description = "Currency for budgets."
  type        = string
  default     = "USD"
}

variable "threshold_percentages" {
  description = "Alert thresholds for budgets (percent of actual/forecasted)."
  type        = list(number)
  default     = [20, 30, 120]
}

variable "budget_notify_emails" {
  description = "Email recipients for budget alerts (used if no SNS topic or as backup)."
  type        = list(string)
  default     = []
}


variable "environment_variables" {
  description = "Extra environment variables to inject into CodeBuild (list of objects)."
  type = list(object({
    name  = string
    value = string
    type  = string # PLAINTEXT | PARAMETER_STORE | SECRETS_MANAGER
  }))
  default = []
}

variable "github_repo" {
  description = "Git repository for the service"
  type        = string
}

variable "github_owner" {
  description = "GitHub owner for the service"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch for the service"
  type        = string
}

variable "provider_type" {
  description = "Provider type for the service"
  type        = string
}

variable "environment_image" {
  description = "Docker image for the service environment"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for storing build artifacts"
  type        = string
}

variable "compute_type" {
  description = "Compute type for the service (e.g., 'FARGATE', 'EC2')"
  type        = string
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