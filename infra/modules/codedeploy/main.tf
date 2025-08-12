/**
 * @file AWS CodeDeploy for Lambda Module
 * Creates a CodeDeploy application and deployment group for Lambda blue/green deployments.
 */

########################################
# CodeDeploy Application
########################################

/**
 * Creates a CodeDeploy application targeting Lambda.
 */
resource "aws_codedeploy_app" "lambda_app" {
  name             = var.application_name
  compute_platform = "Lambda"
  tags             = var.tags
}

########################################
# CodeDeploy Deployment Group
########################################

/**
 * Creates a Lambda deployment group using the BLUE_GREEN strategy with traffic shifting.
 * Includes automatic rollback on deployment failure.
 */
resource "aws_codedeploy_deployment_group" "lambda_deployment_group" {
  app_name               = aws_codedeploy_app.lambda_app.name
  deployment_group_name  = var.deployment_group_name
  service_role_arn       = var.service_role_arn
  deployment_config_name = var.deployment_config_name

  ########################################
  # Deployment Style (required for Lambda)
  ########################################
  deployment_style {
    deployment_type   = "BLUE_GREEN"
    deployment_option = "WITH_TRAFFIC_CONTROL"
  }

  ########################################
  # Automatic Rollback Configuration
  ########################################
  auto_rollback_configuration {
    enabled = var.auto_rollback
    events  = ["DEPLOYMENT_FAILURE"]
  }

  tags = var.tags
}
