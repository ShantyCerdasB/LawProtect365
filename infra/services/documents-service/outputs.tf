############################################
# documents-service Outputs
############################################

# Lambda — Templates
output "documents_lambda_templates_arn" {
  description = "ARN of the templates Lambda function."
  value       = module.lambda_templates.lambda_function_arn
}

output "documents_lambda_templates_name" {
  description = "Name of the templates Lambda function."
  value       = module.lambda_templates.lambda_function_name
}

# Lambda — Drafts
output "documents_lambda_drafts_arn" {
  description = "ARN of the drafts Lambda function."
  value       = module.lambda_drafts.lambda_function_arn
}

output "documents_lambda_drafts_name" {
  description = "Name of the drafts Lambda function."
  value       = module.lambda_drafts.lambda_function_name
}

# Lambda — Finalize
output "documents_lambda_finalize_arn" {
  description = "ARN of the finalize Lambda function."
  value       = module.lambda_finalize.lambda_function_arn
}

output "documents_lambda_finalize_name" {
  description = "Name of the finalize Lambda function."
  value       = module.lambda_finalize.lambda_function_name
}

# IAM Role
output "documents_lambda_role_arn" {
  description = "IAM Role ARN used by all documents-service Lambda functions."
  value       = module.documents_lambda_role.role_arn
}

output "documents_lambda_role_name" {
  description = "IAM Role name used by all documents-service Lambda functions."
  value       = module.documents_lambda_role.role_name
}

# S3 Buckets
output "templates_bucket_id" {
  description = "ID of the S3 bucket for templates."
  value       = module.templates_bucket.bucket_id
}

output "documents_bucket_id" {
  description = "ID of the S3 bucket for documents."
  value       = module.documents_bucket.bucket_id
}

# DynamoDB
output "documents_table_name" {
  description = "Name of the DynamoDB table for documents metadata."
  value       = module.docs_table.table_name
}

# API Gateway
output "documents_api_id" {
  description = "ID of the Documents API Gateway."
  value       = module.documents_api.api_id
}

output "documents_api_endpoint" {
  description = "Invoke URL for the Documents API Gateway."
  value       = module.documents_api.api_endpoint
}

output "documents_api_stage_name" {
  description = "Stage name of the Documents API Gateway."
  value       = module.documents_api.stage_name
}

output "documents_api_access_log_group" {
  description = "CloudWatch Log Group name for the Documents API Gateway access logs."
  value       = module.documents_api.access_log_group_name
}

# SNS Alerts
output "documents_alerts_sns_arn" {
  description = "ARN of the SNS topic for documents-service alerts."
  value       = module.documents_alerts_sns.topic_arn
}

output "documents_alerts_sns_name" {
  description = "Name of the SNS topic for documents-service alerts."
  value       = module.documents_alerts_sns.topic_name
}

# CloudWatch
output "cloudwatch_documents_dashboard_name" {
  description = "Name of the CloudWatch dashboard for documents-service."
  value       = try(module.cloudwatch_documents.dashboard_name, null)
}

# Budgets
output "documents_budget_ids" {
  description = "List of budget IDs created for the documents-service."
  value       = try(module.documents_budgets.budget_ids, [])
}

# Deployment
output "documents_codepipeline_name" {
  description = "Name of the CodePipeline for documents-service deployments."
  value       = try(module.documents_deployment.pipeline_name, null)
}

output "documents_codebuild_project_name" {
  description = "Name of the CodeBuild project for documents-service."
  value       = try(module.documents_deployment.codebuild_project_name, null)
}

# Deployment — CodeDeploy
output "documents_codedeploy_application_name" {
  description = "CodeDeploy application name for documents-service."
  value       = try(module.documents_deployment.codedeploy_application_name, null)
}

output "documents_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for documents-service."
  value       = try(module.documents_deployment.codedeploy_deployment_group_name, null)
}

output "documents_pipeline_arn" {
  description = "ARN of the CodePipeline for documents-service."
  value       = try(module.documents_deployment.pipeline_arn, null)
}

output "documents_pipeline_console_url" {
  description = "AWS Console URL for the CodePipeline."
  value       = try(module.documents_deployment.pipeline_console_url, null)
}

# GitHub Connection (CI/CD)
output "documents_github_connection_arn" {
  description = "ARN of the CodeStar GitHub connection used by documents-service."
  value       = try(module.documents_deployment.github_connection_arn, null)
}

output "documents_github_owner" {
  description = "GitHub repository owner for documents-service."
  value       = try(module.documents_deployment.github_owner, null)
}

output "documents_github_repository" {
  description = "GitHub repository name for documents-service."
  value       = try(module.documents_deployment.github_repository, null)
}

output "documents_github_branch" {
  description = "GitHub branch used for documents-service deployments."
  value       = try(module.documents_deployment.github_branch, null)
}

# IAM Roles — Deployment
output "documents_codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild in documents-service."
  value       = try(module.documents_deployment.codebuild_role_arn, null)
}

output "documents_codebuild_role_name" {
  description = "IAM Role name for CodeBuild in documents-service."
  value       = try(module.documents_deployment.codebuild_role_name, null)
}

output "documents_codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy in documents-service."
  value       = try(module.documents_deployment.codedeploy_role_arn, null)
}

output "documents_codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy in documents-service."
  value       = try(module.documents_deployment.codedeploy_role_name, null)
}

output "documents_pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline in documents-service."
  value       = try(module.documents_deployment.pipeline_role_arn, null)
}

output "documents_pipeline_role_name" {
  description = "IAM Role name for CodePipeline in documents-service."
  value       = try(module.documents_deployment.pipeline_role_name, null)
}
