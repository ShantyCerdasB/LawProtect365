############################################
# sign-service — outputs
############################################

# ----------------------------
# API Gateway (HTTP API v2)
# ----------------------------
output "sign_api_id" {
  description = "HTTP API ID for sign-service"
  value       = module.sign_api.api_id
}

output "sign_api_endpoint" {
  description = "Base URL for the sign-service HTTP API"
  value       = module.sign_api.api_endpoint
}

output "sign_api_stage" {
  description = "Deployed stage name for the sign-service HTTP API"
  value       = module.sign_api.stage_name
}

# ----------------------------
# Lambda functions
# ----------------------------
output "lambda_function_names" {
  description = "Names of the Lambda functions for sign-service"
  value = [
    module.lambda_create_envelope.lambda_function_name,
    module.lambda_get_envelope.lambda_function_name,
    module.lambda_get_envelopes_by_user.lambda_function_name,
    module.lambda_send_envelope.lambda_function_name,
    module.lambda_update_envelope.lambda_function_name,
    module.lambda_cancel_envelope.lambda_function_name,
    module.lambda_download_document.lambda_function_name,
    module.lambda_sign_document.lambda_function_name,
    module.lambda_share_document.lambda_function_name,
    module.lambda_decline_signer.lambda_function_name,
    module.lambda_send_notification.lambda_function_name,
    module.lambda_get_audit_trail.lambda_function_name
  ]
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions for sign-service"
  value = [
    module.lambda_create_envelope.lambda_function_arn,
    module.lambda_get_envelope.lambda_function_arn,
    module.lambda_get_envelopes_by_user.lambda_function_arn,
    module.lambda_send_envelope.lambda_function_arn,
    module.lambda_update_envelope.lambda_function_arn,
    module.lambda_cancel_envelope.lambda_function_arn,
    module.lambda_download_document.lambda_function_arn,
    module.lambda_sign_document.lambda_function_arn,
    module.lambda_share_document.lambda_function_arn,
    module.lambda_decline_signer.lambda_function_arn,
    module.lambda_send_notification.lambda_function_arn,
    module.lambda_get_audit_trail.lambda_function_arn
  ]
}

# ----------------------------
# Evidence bucket
# ----------------------------
output "evidence_bucket_id" {
  description = "S3 bucket name/ID where evidence packages are stored"
  value       = module.evidence_bucket.bucket_id
}

output "evidence_bucket_arn" {
  description = "S3 bucket ARN for the evidence bucket"
  value       = module.evidence_bucket.bucket_arn
}

# ----------------------------
# Alerts topic (SNS)
# ----------------------------
output "alerts_topic_arn" {
  description = "SNS topic ARN used for sign-service alarms/notifications"
  value       = module.sign_alerts_sns.topic_arn
}

output "alerts_topic_name" {
  description = "SNS topic name used for sign-service alarms/notifications"
  value       = module.sign_alerts_sns.topic_name
}

# ----------------------------
# CloudWatch monitoring
# ----------------------------
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name for sign-service"
  value       = try(module.cloudwatch_sign.dashboard_name, null)
}

output "lambda_error_alarm_arns" {
  description = "Lambda error alarm ARNs for sign-service"
  value       = try(module.cloudwatch_sign.lambda_error_alarm_arns, [])
}

output "lambda_throttle_alarm_arns" {
  description = "Lambda throttle alarm ARNs for sign-service"
  value       = try(module.cloudwatch_sign.lambda_throttle_alarm_arns, [])
}

output "lambda_p95_duration_alarm_arns" {
  description = "Lambda p95 duration alarm ARNs for sign-service"
  value       = try(module.cloudwatch_sign.lambda_p95_duration_alarm_arns, [])
}

output "apigw_5xx_alarm_arn" {
  description = "API Gateway 5XX alarm ARN for sign-service"
  value       = try(module.cloudwatch_sign.apigw_5xx_alarm_arn, null)
}

output "apigw_latency_p99_alarm_arn" {
  description = "API Gateway p99 latency alarm ARN for sign-service"
  value       = try(module.cloudwatch_sign.apigw_latency_p99_alarm_arn, null)
}

# ----------------------------
# Budgets (FinOps)
# ----------------------------
output "sign_budget_ids" {
  description = "List of budget IDs created for sign-service"
  value       = try(module.sign_budgets.budget_ids, [])
}

output "sign_budgets_dashboard_name" {
  description = "Name of the budgets dashboard for sign-service"
  value       = try(module.sign_budgets.dashboard_name, null)
}

# ----------------------------
# CI/CD (deployment-service)
# ----------------------------
output "sign_codebuild_project_name" {
  description = "CodeBuild project name for sign-service"
  value       = try(module.sign_deployment.codebuild_project_name, null)
}

output "sign_codedeploy_application_name" {
  description = "CodeDeploy application name for sign-service"
  value       = try(module.sign_deployment.codedeploy_application_name, null)
}

output "sign_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for sign-service"
  value       = try(module.sign_deployment.codedeploy_deployment_group_name, null)
}

output "sign_codepipeline_name" {
  description = "CodePipeline name for sign-service"
  value       = try(module.sign_deployment.pipeline_name, null)
}

output "sign_codepipeline_arn" {
  description = "CodePipeline ARN for sign-service"
  value       = try(module.sign_deployment.pipeline_arn, null)
}

output "sign_codepipeline_console_url" {
  description = "Console URL for the sign-service pipeline"
  value       = try(module.sign_deployment.pipeline_console_url, null)
}

# ----------------------------
# GitHub connection (CI/CD visibility)
# ----------------------------
output "sign_github_connection_arn" {
  description = "CodeStar GitHub connection ARN used by sign-service"
  value       = try(module.sign_deployment.github_connection_arn, null)
}

output "sign_github_owner" {
  description = "GitHub repository owner for sign-service"
  value       = try(module.sign_deployment.github_owner, null)
}

output "sign_github_repository" {
  description = "GitHub repository name for sign-service"
  value       = try(module.sign_deployment.github_repository, null)
}

output "sign_github_branch" {
  description = "GitHub branch used for sign-service deployments"
  value       = try(module.sign_deployment.github_branch, null)
}

# ----------------------------
# IAM roles (from deployment-service)
# ----------------------------
output "sign_codebuild_role_arn" {
  description = "IAM Role ARN for CodeBuild (sign-service)"
  value       = try(module.sign_deployment.codebuild_role_arn, null)
}

output "sign_codebuild_role_name" {
  description = "IAM Role name for CodeBuild (sign-service)"
  value       = try(module.sign_deployment.codebuild_role_name, null)
}

output "sign_codedeploy_role_arn" {
  description = "IAM Role ARN for CodeDeploy (sign-service)"
  value       = try(module.sign_deployment.codedeploy_role_arn, null)
}

output "sign_codedeploy_role_name" {
  description = "IAM Role name for CodeDeploy (sign-service)"
  value       = try(module.sign_deployment.codedeploy_role_name, null)
}

output "sign_pipeline_role_arn" {
  description = "IAM Role ARN for CodePipeline (sign-service)"
  value       = try(module.sign_deployment.pipeline_role_arn, null)
}

output "sign_pipeline_role_name" {
  description = "IAM Role name for CodePipeline (sign-service)"
  value       = try(module.sign_deployment.pipeline_role_name, null)
}

output "outbox_table_name" {
  description = "Name of the outbox DynamoDB table for event publishing"
  value       = var.outbox_table_name
}