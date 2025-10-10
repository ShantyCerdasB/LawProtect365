############################################
# Root Outputs for auth-service module
############################################

# Lambda
output "auth_pre_auth_lambda_arn" {
  description = "ARN of the pre-authentication Lambda function."
  value       = module.auth_service.pre_auth_lambda_arn
}

output "auth_pre_auth_lambda_name" {
  description = "Name of the pre-authentication Lambda function."
  value       = module.auth_service.pre_auth_lambda_name
}

# IAM Role for SNS MFA
output "auth_sns_mfa_role_arn" {
  description = "ARN of the IAM role used by SNS for MFA SMS delivery."
  value       = module.auth_service.sns_mfa_role_arn
}

output "auth_sns_mfa_role_name" {
  description = "Name of the IAM role used by SNS for MFA SMS delivery."
  value       = module.auth_service.sns_mfa_role_name
}

# Cognito
output "auth_cognito_user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = module.auth_service.cognito_user_pool_id
}

output "auth_cognito_user_pool_client_id" {
  description = "Client ID of the Cognito User Pool app client."
  value       = module.auth_service.cognito_user_pool_client_id
}

output "auth_cognito_domain" {
  description = "Domain of the Cognito User Pool."
  value       = module.auth_service.cognito_domain
}

# Google OAuth
output "auth_google_client_id" {
  description = "Google OAuth client ID."
  value       = module.auth_service.google_client_id
}

output "auth_google_client_secret_arn" {
  description = "Secret ARN for the Google OAuth client (stored in Secrets Manager)."
  value       = module.auth_service.google_client_secret
}

# Azure AD OAuth
output "auth_azure_client_id" {
  description = "Azure AD application client ID."
  value       = module.auth_service.azure_client_id
}

output "auth_azure_client_secret_arn" {
  description = "Secret ARN for the Azure AD application client (stored in Secrets Manager)."
  value       = module.auth_service.azure_client_secret
}

# API Gateway
output "auth_api_id" {
  description = "ID of the Auth API Gateway."
  value       = module.auth_service.auth_api_id
}

output "auth_api_endpoint" {
  description = "Invoke URL for the Auth API Gateway."
  value       = module.auth_service.auth_api_endpoint
}

output "auth_api_stage_name" {
  description = "Stage name of the Auth API Gateway."
  value       = module.auth_service.auth_api_stage_name
}

output "auth_api_access_log_group" {
  description = "CloudWatch Log Group name for the Auth API Gateway access logs."
  value       = module.auth_service.auth_api_access_log_group
}

# SNS Alerts
output "auth_alerts_sns_arn" {
  description = "ARN of the SNS topic for auth-service alerts."
  value       = module.auth_service.auth_alerts_sns_arn
}

output "auth_alerts_sns_name" {
  description = "Name of the SNS topic for auth-service alerts."
  value       = module.auth_service.auth_alerts_sns_name
}

# CloudWatch
output "auth_cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard for auth-service."
  value       = try(module.auth_service.cloudwatch_auth_dashboard_name, null)
}

# Budgets
output "auth_budget_ids" {
  description = "List of budget IDs created for the auth-service."
  value       = try(module.auth_service.auth_budget_ids, [])
}

# Deployment
output "auth_codepipeline_name" {
  description = "Name of the CodePipeline for auth-service deployments."
  value       = try(module.auth_service.auth_codepipeline_name, null)
}

output "auth_codebuild_project_name" {
  description = "Name of the CodeBuild project for auth-service."
  value       = try(module.auth_service.auth_codebuild_project_name, null)
}

############################################
# Root Outputs — documents-service
############################################

# Lambda — Templates
output "documents_lambda_templates_arn" {
  description = "ARN of the templates Lambda function."
  value       = module.documents_service.documents_lambda_templates_arn
}

output "documents_lambda_templates_name" {
  description = "Name of the templates Lambda function."
  value       = module.documents_service.documents_lambda_templates_name
}

# Lambda — Drafts
output "documents_lambda_drafts_arn" {
  description = "ARN of the drafts Lambda function."
  value       = module.documents_service.documents_lambda_drafts_arn
}

output "documents_lambda_drafts_name" {
  description = "Name of the drafts Lambda function."
  value       = module.documents_service.documents_lambda_drafts_name
}

# Lambda — Finalize
output "documents_lambda_finalize_arn" {
  description = "ARN of the finalize Lambda function."
  value       = module.documents_service.documents_lambda_finalize_arn
}

output "documents_lambda_finalize_name" {
  description = "Name of the finalize Lambda function."
  value       = module.documents_service.documents_lambda_finalize_name
}

# IAM Role
output "documents_lambda_role_arn" {
  description = "IAM Role ARN used by all documents-service Lambda functions."
  value       = module.documents_service.documents_lambda_role_arn
}

output "documents_lambda_role_name" {
  description = "IAM Role name used by all documents-service Lambda functions."
  value       = module.documents_service.documents_lambda_role_name
}

# S3 Buckets
output "templates_bucket_id" {
  description = "ID of the S3 bucket for templates."
  value       = module.documents_service.templates_bucket_id
}

output "documents_bucket_id" {
  description = "ID of the S3 bucket for documents."
  value       = module.documents_service.documents_bucket_id
}

# DynamoDB
output "documents_table_name" {
  description = "Name of the DynamoDB table for documents metadata."
  value       = module.documents_service.documents_table_name
}

# API Gateway
output "documents_api_id" {
  description = "ID of the Documents API Gateway."
  value       = module.documents_service.documents_api_id
}

output "documents_api_endpoint" {
  description = "Invoke URL for the Documents API Gateway."
  value       = module.documents_service.documents_api_endpoint
}

output "documents_api_stage_name" {
  description = "Stage name of the Documents API Gateway."
  value       = module.documents_service.documents_api_stage_name
}

# SNS Alerts
output "documents_alerts_sns_arn" {
  description = "ARN of the SNS topic for documents-service alerts."
  value       = module.documents_service.documents_alerts_sns_arn
}

output "documents_alerts_sns_name" {
  description = "Name of the SNS topic for documents-service alerts."
  value       = module.documents_service.documents_alerts_sns_name
}

# CloudWatch
output "cloudwatch_documents_dashboard_name" {
  description = "Name of the CloudWatch dashboard for documents-service."
  value       = module.documents_service.cloudwatch_documents_dashboard_name
}

# Budgets
output "documents_budget_ids" {
  description = "List of budget IDs created for the documents-service."
  value       = module.documents_service.documents_budget_ids
}

# Deployment
output "documents_codepipeline_name" {
  description = "Name of the CodePipeline for documents-service deployments."
  value       = module.documents_service.documents_codepipeline_name
}


output "documents_pipeline_arn" {
  description = "ARN of the CodePipeline for documents-service."
  value       = module.documents_service.documents_pipeline_arn
}

output "documents_pipeline_console_url" {
  description = "AWS Console URL for the CodePipeline."
  value       = module.documents_service.documents_pipeline_console_url
}

# GitHub Connection (CI/CD)
output "documents_github_connection_arn" {
  description = "ARN of the CodeStar GitHub connection used by documents-service."
  value       = module.documents_service.documents_github_connection_arn
}

output "documents_github_owner" {
  description = "GitHub repository owner for documents-service."
  value       = module.documents_service.documents_github_owner
}

output "documents_github_repository" {
  description = "GitHub repository name for documents-service."
  value       = module.documents_service.documents_github_repository
}

output "documents_github_branch" {
  description = "GitHub branch used for documents-service deployments."
  value       = module.documents_service.documents_github_branch
}

# IAM Roles — Deployment
output "documents_codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild in documents-service."
  value       = module.documents_service.documents_codebuild_role_arn
}

output "documents_codebuild_role_name" {
  description = "IAM Role name for CodeBuild in documents-service."
  value       = module.documents_service.documents_codebuild_role_name
}

output "documents_codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy in documents-service."
  value       = module.documents_service.documents_codedeploy_role_arn
}

output "documents_codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy in documents-service."
  value       = module.documents_service.documents_codedeploy_role_name
}

output "documents_pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline in documents-service."
  value       = module.documents_service.documents_pipeline_role_arn
}

output "documents_pipeline_role_name" {
  description = "IAM Role name for CodePipeline in documents-service."
  value       = module.documents_service.documents_pipeline_role_name
}
############################################
# Outputs - Frontend Service (from root)
############################################

output "frontend_bucket_id" {
  description = "ID of the S3 bucket hosting static assets for the frontend."
  value       = module.frontend.bucket_id
}

output "frontend_bucket_arn" {
  description = "ARN of the S3 bucket hosting static assets for the frontend."
  value       = module.frontend.bucket_arn
}

output "frontend_hosted_zone_id" {
  description = "ID of the Route 53 hosted zone for the frontend."
  value       = module.frontend.hosted_zone_id
}

output "frontend_certificate_arn" {
  description = "ARN of the ACM certificate for the frontend."
  value       = module.frontend.certificate_arn
}

output "frontend_certificate_domain" {
  description = "Primary domain name covered by the ACM certificate for the frontend."
  value       = module.frontend.certificate_domain
}

output "frontend_distribution_domain_name" {
  description = "CloudFront distribution domain name for the frontend."
  value       = module.frontend.distribution_domain_name
}

output "frontend_distribution_id" {
  description = "ID of the CloudFront distribution for the frontend."
  value       = module.frontend.distribution_id
}

output "frontend_cloudfront_hosted_zone_id" {
  description = "Hosted Zone ID of the CloudFront distribution for the frontend (useful for Route 53 alias records)."
  value       = module.frontend.cloudfront_hosted_zone_id
}

output "frontend_domain" {
  description = "Fully qualified domain name (FQDN) for the frontend."
  value       = module.frontend.frontend_domain
}

output "frontend_callback_url" {
  description = "OAuth callback URL for the frontend authentication service."
  value       = module.frontend.callback_url
}

output "frontend_logout_url" {
  description = "OAuth logout URL for the frontend authentication service."
  value       = module.frontend.logout_url
}

output "frontend_service_name" {
  description = "Logical service identifier for the frontend microservice."
  value       = module.frontend.service_name
}

output "frontend_budget_dashboard_name" {
  description = "Name of the CloudWatch dashboard created for the frontend service budgets."
  value       = module.frontend.budget_dashboard_name
}

output "frontend_budget_dashboard_services" {
  description = "List of service names included in the budgets dashboard for the frontend."
  value       = module.frontend.budget_dashboard_services
}

output "frontend_budget_service_budget_ids" {
  description = "Map of budget IDs created for the frontend service, keyed by budget name."
  value       = module.frontend.budget_service_budget_ids
}


############################################
# documents-service — root outputs
############################################

# ---------- API Gateway ----------


output "documents_api_access_log_group" {
  description = "CloudWatch Log Group name for the API access logs."
  value       = try(module.documents_service.documents_api_access_log_group, null)
}


output "docs_table_name" {
  description = "DynamoDB table name used by documents-service."
  value       = try(module.documents_service.docs_table_name, null)
}

# ---------- Lambdas ----------
output "documents_lambda_function_names" {
  description = "Lambda function names (templates, drafts, finalize)."
  value       = try(module.documents_service.lambda_function_names, [])
}

output "documents_lambda_function_arns" {
  description = "Lambda function ARNs (templates, drafts, finalize)."
  value       = try(module.documents_service.lambda_function_arns, [])
}


# ---------- CloudWatch Monitoring ----------

output "documents_lambda_error_alarm_arns" {
  description = "Lambda error alarm ARNs."
  value       = try(module.documents_service.lambda_error_alarm_arns, [])
}

output "documents_lambda_throttle_alarm_arns" {
  description = "Lambda throttle alarm ARNs."
  value       = try(module.documents_service.lambda_throttle_alarm_arns, [])
}

output "documents_lambda_p95_duration_alarm_arns" {
  description = "Lambda p95 duration alarm ARNs."
  value       = try(module.documents_service.lambda_p95_duration_alarm_arns, [])
}

output "documents_apigw_5xx_alarm_arn" {
  description = "API Gateway 5XX alarm ARN."
  value       = try(module.documents_service.apigw_5xx_alarm_arn, null)
}

output "documents_apigw_latency_p99_alarm_arn" {
  description = "API Gateway p99 latency alarm ARN."
  value       = try(module.documents_service.apigw_latency_p99_alarm_arn, null)
}

# ---------- Budgets ----------


output "documents_budgets_dashboard_name" {
  description = "Budgets dashboard name for documents-service."
  value       = try(module.documents_service.documents_budgets_dashboard_name, null)
}

# ---------- CI/CD (deployment-service) ----------
output "documents_codebuild_project_name" {
  description = "CodeBuild project name for documents-service."
  value       = try(module.documents_service.documents_codebuild_project_name, null)
}

output "documents_codedeploy_application_name" {
  description = "CodeDeploy application name for documents-service."
  value       = try(module.documents_service.documents_codedeploy_application_name, null)
}

output "documents_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for documents-service."
  value       = try(module.documents_service.documents_codedeploy_deployment_group_name, null)
}


output "documents_codepipeline_arn" {
  description = "CodePipeline ARN for documents-service."
  value       = try(module.documents_service.documents_codepipeline_arn, null)
}

output "documents_codepipeline_console_url" {
  description = "Console URL for the documents-service pipeline."
  value       = try(module.documents_service.documents_codepipeline_console_url, null)
}

# ---------- GitHub Connection (CI/CD) ----------



############################################
# Outputs - X-Ray (from root)
############################################

output "xray_group_name" {
  description = "X-Ray group name."
  value       = module.xray.xray_group_name
}

output "xray_group_arn" {
  description = "X-Ray group ARN."
  value       = module.xray.xray_group_arn
}

output "xray_sampling_rule_name" {
  description = "X-Ray sampling rule name."
  value       = module.xray.xray_sampling_rule_name
}

output "xray_encryption_type" {
  description = "X-Ray encryption type (NONE or KMS)."
  value       = module.xray.xray_encryption_type
}

output "xray_kms_key_id" {
  description = "KMS key ID if encryption is enabled."
  value       = module.xray.xray_kms_key_id
}

############################################
# Outputs - DB Secret (from root)
############################################

output "db_secret_id" {
  description = "The Secrets Manager secret ID."
  value       = module.db_secret.secret_id
  sensitive   = true
}

output "db_secret_arn" {
  description = "The ARN of the Secrets Manager secret."
  value       = module.db_secret.secret_arn
  sensitive   = true
}

output "db_secret_version_id" {
  description = "The version ID of the stored secret."
  value       = module.db_secret.version_id
  sensitive   = true
}

############################################
# Outputs - Core DB (from root)
############################################

output "core_db_instance_identifier" {
  description = "RDS instance identifier for the Core DB"
  value       = module.core_db.instance_identifier
}

output "core_db_endpoint" {
  description = "RDS endpoint for the Core DB "
  value       = module.core_db.endpoint
}

output "core_db_port" {
  description = "Database connection port for the Core DB "
  value       = module.core_db.port
}

output "core_db_subnet_group_name" {
  description = "DB subnet group name for the Core DB "
  value       = module.core_db.subnet_group_name
}


############################################
# sign-service — bubbled outputs from module.sign_service
############################################

# ----------------------------
# API Gateway (HTTP API v2)
# ----------------------------
output "sign_api_id" {
  description = "HTTP API ID for sign-service"
  value       = module.sign_service.sign_api_id
}

output "sign_api_endpoint" {
  description = "Base URL for the sign-service HTTP API"
  value       = module.sign_service.sign_api_endpoint
}

output "sign_api_stage" {
  description = "Deployed stage name for the sign-service HTTP API"
  value       = module.sign_service.sign_api_stage
}

# ----------------------------
# Lambda functions
# ----------------------------
output "lambda_function_names" {
  description = "Names of the Lambda functions (consent, sign, certificate)"
  value       = module.sign_service.lambda_function_names
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions (consent, sign, certificate)"
  value       = module.sign_service.lambda_function_arns
}

# ----------------------------
# Evidence bucket
# ----------------------------
output "evidence_bucket_id" {
  description = "S3 bucket name/ID where evidence packages are stored"
  value       = module.sign_service.evidence_bucket_id
}

output "evidence_bucket_arn" {
  description = "S3 bucket ARN for the evidence bucket"
  value       = module.sign_service.evidence_bucket_arn
}

# ----------------------------
# Alerts topic (SNS)
# ----------------------------
output "alerts_topic_arn" {
  description = "SNS topic ARN used for sign-service alarms/notifications"
  value       = module.sign_service.alerts_topic_arn
}

output "alerts_topic_name" {
  description = "SNS topic name used for sign-service alarms/notifications"
  value       = module.sign_service.alerts_topic_name
}

# ----------------------------
# CloudWatch monitoring
# ----------------------------
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name for sign-service"
  value       = module.sign_service.cloudwatch_dashboard_name
}

output "lambda_error_alarm_arns" {
  description = "Lambda error alarm ARNs for sign-service"
  value       = module.sign_service.lambda_error_alarm_arns
}

output "lambda_throttle_alarm_arns" {
  description = "Lambda throttle alarm ARNs for sign-service"
  value       = module.sign_service.lambda_throttle_alarm_arns
}

output "lambda_p95_duration_alarm_arns" {
  description = "Lambda p95 duration alarm ARNs for sign-service"
  value       = module.sign_service.lambda_p95_duration_alarm_arns
}

output "apigw_5xx_alarm_arn" {
  description = "API Gateway 5XX alarm ARN for sign-service"
  value       = module.sign_service.apigw_5xx_alarm_arn
}

output "apigw_latency_p99_alarm_arn" {
  description = "API Gateway p99 latency alarm ARN for sign-service"
  value       = module.sign_service.apigw_latency_p99_alarm_arn
}

# ----------------------------
# Budgets (FinOps)
# ----------------------------
output "sign_budget_ids" {
  description = "List of budget IDs created for sign-service"
  value       = module.sign_service.sign_budget_ids
}

output "sign_budgets_dashboard_name" {
  description = "Name of the budgets dashboard for sign-service"
  value       = module.sign_service.sign_budgets_dashboard_name
}

# ----------------------------
# CI/CD (deployment-service)
# ----------------------------
output "sign_codebuild_project_name" {
  description = "CodeBuild project name for sign-service"
  value       = module.sign_service.sign_codebuild_project_name
}

output "sign_codedeploy_application_name" {
  description = "CodeDeploy application name for sign-service"
  value       = module.sign_service.sign_codedeploy_application_name
}

output "sign_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for sign-service"
  value       = module.sign_service.sign_codedeploy_deployment_group_name
}

output "sign_codepipeline_name" {
  description = "CodePipeline name for sign-service"
  value       = module.sign_service.sign_codepipeline_name
}

output "sign_codepipeline_arn" {
  description = "CodePipeline ARN for sign-service"
  value       = module.sign_service.sign_codepipeline_arn
}

output "sign_codepipeline_console_url" {
  description = "Console URL for the sign-service pipeline"
  value       = module.sign_service.sign_codepipeline_console_url
}

# ----------------------------
# GitHub connection (CI/CD visibility)
# ----------------------------
output "sign_github_connection_arn" {
  description = "CodeStar GitHub connection ARN used by sign-service"
  value       = module.sign_service.sign_github_connection_arn
}

output "sign_github_owner" {
  description = "GitHub repository owner for sign-service"
  value       = module.sign_service.sign_github_owner
}

output "sign_github_repository" {
  description = "GitHub repository name for sign-service"
  value       = module.sign_service.sign_github_repository
}

output "sign_github_branch" {
  description = "GitHub branch used for sign-service deployments"
  value       = module.sign_service.sign_github_branch
}

# ----------------------------
# IAM roles (from deployment-service)
# ----------------------------
output "sign_codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild (sign-service)"
  value       = module.sign_service.sign_codebuild_role_arn
}

output "sign_codebuild_role_name" {
  description = "IAM Role name for CodeBuild (sign-service)"
  value       = module.sign_service.sign_codebuild_role_name
}

output "sign_codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy (sign-service)"
  value       = module.sign_service.sign_codedeploy_role_arn
}

output "sign_codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy (sign-service)"
  value       = module.sign_service.sign_codedeploy_role_name
}

output "sign_pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline (sign-service)"
  value       = module.sign_service.sign_pipeline_role_arn
}

output "sign_pipeline_role_name" {
  description = "IAM Role name for CodePipeline (sign-service)"
  value       = module.sign_service.sign_pipeline_role_name
}


output "KMS_SIGN_KEY_ARN" {
  description = "ARN of the KMS key used for signing"
  value       = module.kms_factory.signing_kms_key_arn
}

output "event_bus_arn" {
  description = "ARN of the EventBridge bus used for sign-service"
  value       = module.events.eventbridge_bus_arn
}

# Shared Components Pipeline Outputs
output "shared_components_pipeline_name" {
  description = "Name of the shared components pipeline"
  value       = module.shared_components_pipeline.pipeline_name
}

output "shared_components_pipeline_arn" {
  description = "ARN of the shared components pipeline"
  value       = module.shared_components_pipeline.pipeline_arn
}

output "shared_components_pipeline_console_url" {
  description = "Console URL for the shared components pipeline"
  value       = module.shared_components_pipeline.pipeline_console_url
}

# GitHub Actions Role Output
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = module.github_connection.github_actions_role_arn
}

output "github_actions_role_name" {
  description = "Name of the GitHub Actions IAM role"
  value       = module.github_connection.github_actions_role_name
}

