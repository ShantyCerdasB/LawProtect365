variable "project_name" {
  description = "Global project identifier"
  type        = string
}

variable "env" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "Map of tags to apply to every resource"
  type        = map(string)
}
variable "existing_sns_topic_arn" {
  description = "ARN of the existing SNS topic for budget alerts"
  type        = string
  default     = null
}
variable "aws_region" {
  description = "AWS region for the service"
  type        = string
}
variable "cert_base_domain" {
  description = "Root DNS domain (your Route 53 hosted zone)"
  type        = string
}

variable "cert_domain_name" {
  description = "Subdomain label for frontend (e.g. 'www')"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class (e.g. PriceClass_100)"
  type        = string
  default     = "PriceClass_100"
}


variable "artifacts_bucket" {
  description = "Name of the S3 bucket where CodePipeline will store build artifacts"
  type        = string
}

variable "compute_type" {
  description = "Compute type for the CodeBuild project (e.g., BUILD_GENERAL1_SMALL)"
  type        = string
}

variable "environment_image" {
  description = "Docker image for the CodeBuild environment (e.g., aws/codebuild/standard:6.0)"
  type        = string
}

variable "environment_variables" {
  description = <<EOF
List of environment variables to set in the CodeBuild environment.
Each item should be an object with:
- name  (string)
- value (string)
- type  (optional string, defaults to \"PLAINTEXT\")
EOF
  type = list(object({
    name  = string
    value = string
    type  = optional(string)
  }))
  default = []
}


variable "service_name" {
  description = "Logical service identifier (e.g. frontend, auth, cases)"
  type        = string
}


variable "deployment_config_name" {
  description = "CodeDeploy config (e.g. CodeDeployDefault.LambdaAllAtOnce)"
  type        = string
  default     = "CodeDeployDefault.LambdaAllAtOnce"
}

variable "auto_rollback" {
  description = "Enable automatic rollback on failure"
  type        = bool
  default     = true
}

variable "blue_green_termination_wait_minutes" {
  description = "Minutes to wait before terminating old version"
  type        = number
  default     = 5
}

variable "blue_green_ready_wait_minutes" {
  description = "Minutes to wait before shifting traffic"
  type        = number
  default     = 0
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


variable "budget_notify_emails" {
  description = "Email addresses to notify for budget alerts"
  type        = list(string)
  default     = []
}

variable "frontend_budget_amount" {
  description = "Budget amount for the frontend service"
  type        = number
}