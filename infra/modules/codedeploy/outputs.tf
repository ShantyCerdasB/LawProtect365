/**
 * @file Output values for AWS CodeDeploy for Lambda Module
 * Exposes application and deployment group identifiers.
 */

########################################
# Application Outputs
########################################

/**
 * @output codedeploy_application_name
 * Name of the created CodeDeploy application.
 * @type string
 */
output "codedeploy_application_name" {
  description = "Name of the CodeDeploy application"
  value       = aws_codedeploy_app.lambda_app.name
}

########################################
# Deployment Group Outputs
########################################

/**
 * @output codedeploy_deployment_group_name
 * Name of the created CodeDeploy deployment group.
 * @type string
 */
output "codedeploy_deployment_group_name" {
  description = "Name of the CodeDeploy deployment group"
  value       = aws_codedeploy_deployment_group.lambda_deployment_group.deployment_group_name
}
