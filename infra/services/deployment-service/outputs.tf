############################################
# CodeBuild
############################################
output "build_project_name" {
  description = "Name of the CodeBuild project."
  value       = module.build.codebuild_project_name
}

############################################
# CodeDeploy
############################################
output "codedeploy_application_name" {
  description = "CodeDeploy application name."
  value       = module.codedeploy.codedeploy_application_name
}

output "codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name."
  value       = module.codedeploy.codedeploy_deployment_group_name
}

############################################
# CodePipeline
############################################
output "pipeline_name" {
  description = "The CodePipeline name."
  value       = module.pipeline.codepipeline_name
}

output "pipeline_arn" {
  description = "The CodePipeline ARN."
  value       = module.pipeline.codepipeline_arn
}

output "pipeline_console_url" {
  description = "Console URL for the pipeline in AWS."
  value       = module.pipeline.codepipeline_console_url
}

############################################
# GitHub Connection (useful for troubleshooting or reuse)
############################################
output "github_connection_arn" {
  description = "ARN of the CodeStar GitHub connection."
  value       = local.github_connection_arn
}

output "github_owner" {
  description = "GitHub repository owner (organization or username)."
  value       = var.github_owner
}

output "github_repository" {
  description = "GitHub repository name."
  value       = var.github_repo
}

output "github_branch" {
  description = "GitHub branch used as the pipeline source."
  value       = var.branch
}

############################################
# IAM Roles (helpful if referenced by other stacks)
############################################
output "codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild."
  value       = module.codebuild_role.role_arn
}

output "codebuild_role_name" {
  description = "IAM Role name for CodeBuild."
  value       = module.codebuild_role.role_name
}

output "codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy."
  value       = module.codedeploy_role.role_arn
}

output "codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy."
  value       = module.codedeploy_role.role_name
}

output "pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline."
  value       = module.pipeline_role.role_arn
}

output "pipeline_role_name" {
  description = "IAM Role name for CodePipeline."
  value       = module.pipeline_role.role_name
}
