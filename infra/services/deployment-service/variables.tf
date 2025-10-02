variable "project_name" {
  description = "Global project name"
  type        = string
}

variable "env" {
  description = "Deployment environment (dev|staging|prod)"
  type        = string
}

variable "service_name" {
  description = "Logical service identifier (e.g. frontend, auth, cases)"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket for pipeline artifacts"
  type        = string
}

variable "buildspec_path" {
  description = "Path in the repo to the buildspec file"
  type        = string
}

variable "compute_type" {
  description = "CodeBuild compute type (e.g. BUILD_GENERAL1_SMALL)"
  type        = string
}

variable "environment_image" {
  description = "CodeBuild Docker image (e.g. aws/codebuild/standard:6.0)"
  type        = string
}

variable "environment_variables" {
  description = "List of env vars to inject into the build container"
  type = list(object({
    name  = string
    value = string
    type  = string    # PLAINTEXT | PARAMETER_STORE | SECRETS_MANAGER
  }))
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

variable "github_connection_arn" {
  description = "ARN of existing GitHub CodeStar connection (optional)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all CI/CD resources"
  type        = map(string)
  default     = {}
}
