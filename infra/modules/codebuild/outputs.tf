/**
 * @file Output values for AWS CodeBuild Project Module.
 * Exposes identifiers, ARNs, and console URL for the created CodeBuild project.
 */

########################################
# Project Identifiers
########################################

/**
 * @output codebuild_project_name
 * The name of the CodeBuild project.
 * @type string
 */
output "codebuild_project_name" {
  description = "The name of the CodeBuild project"
  value       = aws_codebuild_project.build_project.name
}

/**
 * @output build_project_name
 * Duplicate output for project name (legacy usage).
 * @type string
 */
output "build_project_name" {
  description = "Name of the CodeBuild project"
  value       = aws_codebuild_project.build_project.name
}

########################################
# Project ARN
########################################

/**
 * @output codebuild_project_arn
 * The ARN of the CodeBuild project.
 * @type string
 */
output "codebuild_project_arn" {
  description = "The ARN of the CodeBuild project"
  value       = aws_codebuild_project.build_project.arn
}

########################################
# AWS Console URL
########################################

/**
 * @output codebuild_console_url
 * Console URL for this CodeBuild project.
 * @type string
 * @example "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/projects/lawprotect365-documents-build/history?region=us-east-1"
 */
output "codebuild_console_url" {
  description = "Console URL for this CodeBuild project"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/codesuite/codebuild/projects/${aws_codebuild_project.build_project.name}/history?region=${data.aws_region.current.name}"
}
