// Shared root‐level variables for AWS, GCP and OIDC integration.
// Keep descriptions concise.

variable "project_name" {
  description = "Prefix for all resource names (e.g. lawprotect365)."
  type        = string
}

variable "env" {
  description = "Deployment environment (\"dev\" or \"prod\")."
  type        = string
}

variable "region" {
  description = "AWS region for AWS resources."
  type        = string
  default     = "us-east-1"
}

variable "gcp_project_id" {
  description = "GCP project ID for Google OAuth client."
  type        = string
}


variable "gcp_region" {
  description = "GCP region (used if any GCP regional services are needed)."
  type        = string
  default     = "us-central1"
}

variable "google_client_id" {
  description = "Google OAuth 2.0 Client ID from the GCP console."
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 Client Secret from the GCP console."
  type        = string
  sensitive   = true
}

variable "support_email" {
  description = "Support email used in the OAuth consent screen."
  type        = string
}

variable "apple_oidc_private_key" {
  description = "Private key PEM for Sign‑in with Apple (stored in Secrets Manager)."
  type        = string
  sensitive   = true
}

variable "apple_client_id" {
  description = "Client ID for Sign‑in with Apple (leave empty to disable)."
  type        = string
  default     = ""
}

///////////////////////////////////////////////////////////////////////////////
// Variables for ACM, CloudFront and DNS configuration.
// We derive hosted zone and record names from this base domain.
///////////////////////////////////////////////////////////////////////////////

variable "cert_base_domain" {
  description = "Your registered apex domain (e.g. \"xyzhub.pw\" or \"lawprotect365.com\")."
  type        = string
}

variable "cert_domain_name" {
  description = "Subdomain to use for the frontend (e.g. \"www\" to create www.<your‑base‑domain>)."
  type        = string
  default     = "www"
}

variable "price_class" {
  description = <<-EOT
    CloudFront price class, controlling which edge locations serve content:
      - PriceClass_100: U.S., Canada, Europe
      - PriceClass_200: PriceClass_100 + Asia, South America
      - PriceClass_All: All edge locations worldwide
  EOT
  type    = string
  default = "PriceClass_100"
}

variable "code_bucket" {
  description = "Name of the S3 bucket where all Lambda deployment packages are stored."
  type        = string
  default     = ""
}


variable "db_master_username" {
  description = "Master username for the cluster"
  type        = string
}

variable "db_master_password" {
  description = "Master user password (use Secrets Manager or SSM in prod)"
  type        = string
  sensitive   = true
}

variable "db_engine_version" {
  description = "Database engine version (e.g. \"13.6\")."
  type        = string
  default     = "17.5"
}

variable "provider_type" {
  description = "Type of provider: GitHub or GitHubEnterprise"
  type        = string
  default     = "GitHub"
}

variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
}

variable "github_repo" {
  description = "Name of the GitHub repository"
  type        = string
}

variable "branch" {
  description = "Git branch to track for pipeline triggers"
  type        = string
  default     = "main"
}

variable "signing_key_spec" {
  description = "Key spec for the signing key (e.g., RSA_2048)."
  type        = string
  default     = "RSA_2048"
}

variable "budget_notify_emails" {
  description = "Email addresses to notify for budget alerts"
  type        = list(string)
  default     = []
}
variable "documents_budget_amount" {
  description = "Monthly cost budget for document service (USD unless overridden)."
  type        = number
  default     = 10
}

# Access logs format for authentication service
variable "access_logs_format" {
  description = "CloudWatch Logs format string for API Gateway access logs."
  type        = string
  default     = "$context.identity.sourceIp - $context.identity.user [$context.requestTime] \"$context.httpMethod $context.resourcePath $context.protocol\" $context.status $context.responseLength $context.requestId"
}

variable "alerts_emails" {
  description = "List of email addresses to subscribe to the auth-service SNS alerts topic."
  type        = list(string)
  default     = []
}

variable "frontend_budget_amount" {
  description = "Budget amount for the frontend service"
  type        = number
}

variable "overall_budget_amount" {
  description = "Overall budget amount for the project"
  type        = number
  default     = 100
}

variable "threshold_percentages" {
  description = "Threshold percentages for budget alerts"
  type        = list(number)
  default     = [80, 90, 100]
}
variable "auth_budget_amount" {
  description = "Monthly cost budget for auth-service (USD unless overridden)."
  type        = number
  default     = 10
}

variable "generic_service_budget_amount" {
  description = "Monthly cost budget for generic services (USD unless overridden)."
  type        = number
  default     = 10
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  type        = string
}

variable "attach_waf_web_acl" {
  description = "Whether to attach the WAF Web ACL to the API Gateway"
  type        = bool
  default     = false
}