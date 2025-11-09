/**
 * @file Input variables for AWS CodeBuild Project Module.
 * Defines configuration for project name, build environment, artifacts, and tags.
 */

########################################
# Project Identification
########################################

/**
 * @variable project_name
 * Unique name for this CodeBuild project.
 * @type string
 * @example "lawprotect365-documents-build"
 */
variable "project_name" {
  description = "Unique name for this CodeBuild project (e.g. lawprotect365-documents-build)"
  type        = string
}

/**
 * @variable env
 * Deployment environment.
 * @type string
 * @example "dev"
 */
variable "env" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

########################################
# IAM Role
########################################

/**
 * @variable service_role_arn
 * IAM Role ARN for CodeBuild to assume when running builds.
 * @type string
 */
variable "service_role_arn" {
  description = "IAM Role ARN that CodeBuild will assume to run builds"
  type        = string
}

########################################
# Build Specification
########################################

/**
 * @variable buildspec_path
 * Path to the buildspec file inside the source repository.
 * @type string
 * @default "buildspec.yml"
 */
variable "buildspec_path" {
  description = "Path inside the source repository to the buildspec file"
  type        = string
  default     = "buildspec.yml"
}

########################################
# Environment Configuration
########################################

/**
 * @variable environment_image
 * Docker image for the build environment.
 * @type string
 * @example "aws/codebuild/standard:6.0"
 */
variable "environment_image" {
  description = "Docker image to use for the build environment (e.g. aws/codebuild/standard:6.0)"
  type        = string
}

/**
 * @variable compute_type
 * Compute resources for the build.
 * @type string
 * @example "BUILD_GENERAL1_SMALL"
 */
variable "compute_type" {
  description = "Compute resources for the build (e.g. BUILD_GENERAL1_SMALL)"
  type        = string
}

/**
 * @variable environment_variables
 * List of environment variables for the build.
 * Each item must include `name`, `value`, and `type` (PLAINTEXT or SECRETS_MANAGER).
 * @type list(object)
 */
variable "environment_variables" {
  description = <<EOF
List of environment variables for the build.
Each item needs name, value, and type (PLAINTEXT or SECRETS_MANAGER).
EOF
  type = list(object({
    name  = string
    value = string
    type  = string
  }))
  default = []
}

########################################
# Artifacts
########################################

/**
 * @variable artifacts_bucket
 * Optional S3 bucket for storing build artifacts.
 * @type string
 * @default ""
 */
variable "artifacts_bucket" {
  description = "Optional S3 bucket name to store build artifacts (empty = no artifacts)"
  type        = string
  default     = ""
}

/**
 * Optional list of secondary artifact identifiers for CodePipeline integrations.
 * Each identifier will produce a secondary_artifacts { type = CODEPIPELINE, artifact_identifier = "<id>" } block.
 */
variable "secondary_artifact_identifiers" {
  description = "List of secondary artifact identifiers to be emitted by CodeBuild to CodePipeline"
  type        = list(string)
  default     = []
}

########################################
# Tags
########################################

/**
 * @variable tags
 * Tags to apply to the CodeBuild project.
 * @type map(string)
 */
variable "tags" {
  description = "Tags to apply to the CodeBuild project"
  type        = map(string)
  default     = {}
}
