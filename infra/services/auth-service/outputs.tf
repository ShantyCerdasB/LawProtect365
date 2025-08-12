############################################
# Auth-Service Outputs
############################################

# Lambda
output "pre_auth_lambda_arn" {
  description = "ARN of the pre-authentication Lambda function."
  value       = module.pre_auth_lambda.lambda_function_arn
}

output "pre_auth_lambda_name" {
  description = "Name of the pre-authentication Lambda function."
  value       = module.pre_auth_lambda.lambda_function_name
}

# IAM Role for SNS MFA
output "sns_mfa_role_arn" {
  description = "ARN of the IAM role used by SNS for MFA SMS delivery."
  value       = module.sns_mfa_role.role_arn
}

output "sns_mfa_role_name" {
  description = "Name of the IAM role used by SNS for MFA SMS delivery."
  value       = module.sns_mfa_role.role_name
}

# Cognito
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Client ID of the Cognito User Pool app client."
  value       = module.cognito.user_pool_client_id
}

output "cognito_domain" {
  description = "Domain of the Cognito User Pool."
  value       = module.cognito.cognito_domain
}

# Google OAuth
output "google_client_id" {
  description = "Google OAuth client ID."
  value       = module.gcp_oauth.client_id
}

output "google_client_secret" {
  description = "Secret ARN for the Google OAuth client (stored in Secrets Manager)."
  value       = module.secret_google.secret_arn
}

# Azure AD OAuth
output "azure_client_id" {
  description = "Azure AD application client ID."
  value       = module.azure_ad.client_id
}

output "azure_client_secret" {
  description = "Secret ARN for the Azure AD application client (stored in Secrets Manager)."
  value       = module.secret_azure.secret_arn
}

# API Gateway
output "auth_api_id" {
  description = "ID of the Auth API Gateway."
  value       = module.auth_api.api_id
}

output "auth_api_endpoint" {
  description = "Invoke URL for the Auth API Gateway."
  value       = module.auth_api.api_endpoint
}

output "auth_api_stage_name" {
  description = "Stage name of the Auth API Gateway."
  value       = module.auth_api.stage_name
}

output "auth_api_access_log_group" {
  description = "CloudWatch Log Group name for the Auth API Gateway access logs."
  value       = module.auth_api.access_log_group_name
}

# SNS Alerts
output "auth_alerts_sns_arn" {
  description = "ARN of the SNS topic for auth-service alerts."
  value       = module.auth_alerts_sns.topic_arn
}

output "auth_alerts_sns_name" {
  description = "Name of the SNS topic for auth-service alerts."
  value       = module.auth_alerts_sns.topic_name
}

# CloudWatch
output "cloudwatch_auth_dashboard_name" {
  description = "Name of the CloudWatch dashboard for auth-service."
  value       = try(module.cloudwatch_auth.dashboard_name, null)
}

# Budgets
output "auth_budget_ids" {
  description = "List of budget IDs created for the auth-service."
  value       = try(module.auth_budgets.budget_ids, [])
}

############################################
# Deployment - CI/CD
############################################

# Pipeline & Build
output "auth_codepipeline_name" {
  description = "Name of the CodePipeline for auth-service deployments."
  value       = try(module.auth_deployment.pipeline_name, null)
}

output "auth_pipeline_arn" {
  description = "ARN of the CodePipeline for auth-service."
  value       = try(module.auth_deployment.pipeline_arn, null)
}

output "auth_pipeline_console_url" {
  description = "AWS Console URL for the CodePipeline."
  value       = try(module.auth_deployment.pipeline_console_url, null)
}

output "auth_codebuild_project_name" {
  description = "Name of the CodeBuild project for auth-service."
  value       = try(module.auth_deployment.codebuild_project_name, null)
}

# CodeDeploy
output "auth_codedeploy_application_name" {
  description = "CodeDeploy application name for auth-service."
  value       = try(module.auth_deployment.codedeploy_application_name, null)
}

output "auth_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for auth-service."
  value       = try(module.auth_deployment.codedeploy_deployment_group_name, null)
}

############################################
# GitHub Connection
############################################
output "auth_github_connection_arn" {
  description = "ARN of the CodeStar GitHub connection used by auth-service."
  value       = try(module.auth_deployment.github_connection_arn, null)
}

output "auth_github_owner" {
  description = "GitHub repository owner for auth-service."
  value       = try(module.auth_deployment.github_owner, null)
}

output "auth_github_repository" {
  description = "GitHub repository name for auth-service."
  value       = try(module.auth_deployment.github_repository, null)
}

output "auth_github_branch" {
  description = "GitHub branch used for auth-service deployments."
  value       = try(module.auth_deployment.github_branch, null)
}

############################################
# IAM Roles
############################################
output "auth_codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild in auth-service."
  value       = try(module.auth_deployment.codebuild_role_arn, null)
}

output "auth_codebuild_role_name" {
  description = "IAM Role name for CodeBuild in auth-service."
  value       = try(module.auth_deployment.codebuild_role_name, null)
}

output "auth_codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy in auth-service."
  value       = try(module.auth_deployment.codedeploy_role_arn, null)
}

output "auth_codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy in auth-service."
  value       = try(module.auth_deployment.codedeploy_role_name, null)
}

output "auth_pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline in auth-service."
  value       = try(module.auth_deployment.pipeline_role_arn, null)
}

output "auth_pipeline_role_name" {
  description = "IAM Role name for CodePipeline in auth-service."
  value       = try(module.auth_deployment.pipeline_role_name, null)
}
