/**
 * @file Input variables for AWS CodePipeline Module
 * Defines configuration for pipeline name, IAM role, GitHub connection, and stage integration.
 */

########################################
# Pipeline Core
########################################
variable "pipeline_name" {
  description = "Unique name for the CodePipeline (e.g. lawprotect365-documents-pipeline)"
  type        = string
}

variable "role_arn" {
  description = "IAM Role ARN that CodePipeline will assume"
  type        = string
}

variable "artifacts_bucket" {
  description = "S3 bucket to store pipeline artifacts"
  type        = string
}

########################################
# GitHub Source Stage
########################################
variable "github_connection_arn" {
  description = "ARN of the CodeStar Connection to GitHub"
  type        = string
}

variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name for this service"
  type        = string
}

variable "github_branch" {
  description = "Branch name to track for changes"
  type        = string
  default     = "main"
}

########################################
# Build Stage (CodeBuild)
########################################
variable "codebuild_project_name" {
  description = "Name of the CodeBuild project to run"
  type        = string
}

variable "build_output_artifact" {
  description = "Identifier for the build output artifact"
  type        = string
  default     = "build_output"
}

########################################
# Deploy Stage (CodeDeploy)
########################################
variable "codedeploy_app_name" {
  description = "CodeDeploy application name for the Deploy stage"
  type        = string
}

variable "codedeploy_deployment_group_name" {
  description = "Deployment group name for the Deploy stage"
  type        = string
}

variable "enable_codedeploy_stage" {
  description = "Enable CodeDeploy stage in pipeline (false for multiple Lambdas)"
  type        = bool
  default     = true
}

########################################
# Tags
########################################
variable "tags" {
  description = "Tags to apply to the CodePipeline"
  type        = map(string)
  default     = {}
}
