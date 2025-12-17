/**
 * @file outputs.tf
 * @module notifications_service
 * @description
 * Output values for the notifications-service Terraform module.
 */

############################################
# Lambda Function Outputs
############################################

output "lambda_function_name" {
  description = "Name of the EventBridge handler Lambda function"
  value       = module.lambda_eventbridge_handler.lambda_function_name
}

output "lambda_function_arn" {
  description = "ARN of the EventBridge handler Lambda function"
  value       = module.lambda_eventbridge_handler.lambda_function_arn
}

output "lambda_alias_arn" {
  description = "ARN of the 'live' alias for the Lambda function"
  value       = module.lambda_eventbridge_handler.lambda_alias_live_arn
}

############################################
# EventBridge Outputs
############################################

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for notifications"
  value       = aws_cloudwatch_event_rule.notifications_rule.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule for notifications"
  value       = aws_cloudwatch_event_rule.notifications_rule.name
}

############################################
# SES Outputs
############################################

output "ses_from_email" {
  description = "SES email address used for sending notifications"
  value       = var.ses_from_email
}

output "ses_email_identity_arn" {
  description = "ARN of the SES email identity (if created)"
  value       = length(aws_ses_email_identity.from_email) > 0 ? aws_ses_email_identity.from_email[0].arn : null
}

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity (if created)"
  value       = length(aws_ses_domain_identity.domain) > 0 ? aws_ses_domain_identity.domain[0].arn : null
}

############################################
# Pinpoint Outputs
############################################

output "pinpoint_application_id" {
  description = "Pinpoint application ID (created or provided)"
  value       = var.create_pinpoint_app ? (length(aws_pinpoint_app.notifications) > 0 ? aws_pinpoint_app.notifications[0].application_id : var.pinpoint_application_id) : var.pinpoint_application_id
}

output "pinpoint_application_arn" {
  description = "ARN of the Pinpoint application (if created)"
  value       = length(aws_pinpoint_app.notifications) > 0 ? aws_pinpoint_app.notifications[0].arn : null
}

############################################
# Secrets Manager Outputs
############################################

output "fcm_secret_arn" {
  description = "ARN of the FCM service account key secret"
  value       = try(module.secret_fcm[0].secret_arn, var.fcm_secret_arn)
}

output "apns_secret_arn" {
  description = "ARN of the APNS keys secret"
  value       = try(module.secret_apns[0].secret_arn, var.apns_secret_arn)
}

############################################
# SNS Alerts Outputs
############################################

output "alerts_topic_arn" {
  description = "SNS topic ARN used for notifications-service alarms/notifications"
  value       = module.notifications_alerts_sns.topic_arn
}

output "alerts_topic_name" {
  description = "SNS topic name used for notifications-service alarms/notifications"
  value       = module.notifications_alerts_sns.topic_name
}

############################################
# CloudWatch Monitoring Outputs
############################################

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name for notifications-service"
  value       = try(module.cloudwatch_notifications.dashboard_name, null)
}

output "lambda_error_alarm_arns" {
  description = "Lambda error alarm ARNs for notifications-service"
  value       = try(module.cloudwatch_notifications.lambda_error_alarm_arns, [])
}

############################################
# Budgets Outputs
############################################

output "notifications_budget_ids" {
  description = "List of budget IDs created for notifications-service"
  value       = try(module.notifications_budgets.budget_ids, [])
}

output "notifications_budgets_dashboard_name" {
  description = "Name of the budgets dashboard for notifications-service"
  value       = try(module.notifications_budgets.dashboard_name, null)
}

############################################
# CI/CD Outputs
############################################

output "notifications_codebuild_project_name" {
  description = "CodeBuild project name for notifications-service"
  value       = try(module.notifications_deployment.codebuild_project_name, null)
}

output "notifications_codedeploy_application_name" {
  description = "CodeDeploy application name for notifications-service"
  value       = try(module.notifications_deployment.codedeploy_application_name, null)
}

output "notifications_codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group name for notifications-service"
  value       = try(module.notifications_deployment.codedeploy_deployment_group_name, null)
}

output "notifications_codepipeline_name" {
  description = "CodePipeline name for notifications-service"
  value       = try(module.notifications_deployment.pipeline_name, null)
}

output "notifications_codepipeline_arn" {
  description = "CodePipeline ARN for notifications-service"
  value       = try(module.notifications_deployment.pipeline_arn, null)
}

output "notifications_codepipeline_console_url" {
  description = "Console URL for the notifications-service pipeline"
  value       = try(module.notifications_deployment.pipeline_console_url, null)
}

############################################
# IAM Role Outputs
############################################

output "lambda_role_arn" {
  description = "IAM Role ARN for Lambda functions"
  value       = module.notifications_lambda_role.role_arn
}

output "lambda_role_name" {
  description = "IAM Role name for Lambda functions"
  value       = module.notifications_lambda_role.role_name
}
