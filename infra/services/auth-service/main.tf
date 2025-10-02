/**
 * @file main.tf
 * @module auth_service
 * @description
 * Terraform configuration for the `auth-service` stack.  
 * Provisions Lambda, IAM roles, Cognito with SSO providers, API Gateway, SNS alerts,
 * and related integrations for authentication and MFA flows.
 */

############################################
# Common tags applied to all resources
############################################
locals {
  common_tags = {
    Project = var.project_name
    Env     = var.env
    Owner   = "legal-platform-team"
  }
}

############################################
# Pre-authentication Lambda for MFA enforcement
############################################
module "pre_auth_lambda" {
  source        = "../../modules/lambda"
  function_name = "${var.project_name}-pre-auth"
  s3_bucket     = var.code_bucket
  s3_key        = "pre-auth.zip"
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  environment_variables = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL    = "info"
      USER_POOL_ID = module.cognito.user_pool_id
    }
  )

  project_name = var.project_name
  env          = var.env
}

############################################
# IAM role for SNS MFA delivery
############################################
module "sns_mfa_role" {
  source              = "../../modules/iam-role"
  role_name           = "${var.project_name}-sns-mfa-${var.env}"
  assume_role_policy  = data.aws_iam_policy_document.sns_assume.json
  managed_policy_arns = ["arn:aws:iam::aws:policy/AmazonSNSFullAccess"]
  inline_policies     = {}
  project_name        = var.project_name
  env                 = var.env
}

############################################
# Cognito User Pool with MFA and SSO providers
############################################
module "cognito" {
  source               = "../../modules/cognito"
  project_name         = var.project_name
  env                  = var.env
  callback_urls        = [var.callback_url]
  logout_urls          = [var.logout_url]

  google_client_id     = module.gcp_oauth.client_id
  google_client_secret = module.gcp_oauth.client_secret

  azure_client_id      = module.azure_ad.client_id
  azure_client_secret  = module.azure_ad.client_secret
  aws_region           = var.aws_region

  apple_client_id      = var.apple_client_id

  sns_mfa_role_arn     = module.sns_mfa_role.role_arn
  pre_auth_lambda_arn  = module.pre_auth_lambda.lambda_function_arn

  tags = local.common_tags
}

############################################
# Attach pre-auth Lambda as Cognito trigger
############################################
module "cognito_trigger" {
  source              = "../../modules/cognito-trigger"
  user_pool_id        = module.cognito.user_pool_id
  pre_auth_lambda_arn = module.pre_auth_lambda.lambda_function_arn
}

############################################
# Google OAuth 2.0 client configuration
############################################
module "gcp_oauth" {
  source               = "../../modules/gcp_oauth"
  gcp_project_id       = var.gcp_project_id
  gcp_region           = var.gcp_region
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  google_redirect_uris = [var.callback_url]
}

############################################
# Azure AD application registration for SSO
############################################
module "azure_ad" {
  source        = "../../modules/azure"
  display_name  = "${var.project_name}-azure-app-${var.env}"
  redirect_uris = [var.callback_url]
  logout_uris   = [var.logout_url]
  project_name  = var.project_name
  env           = var.env
}

############################################
# Store Google OAuth secret in Secrets Manager
############################################
module "secret_google" {
  source        = "../../modules/secretmanager"
  secret_name   = "${var.project_name}/google-oauth-secret-${var.env}"
  secret_string = module.gcp_oauth.client_secret
  project_name  = var.project_name
  env           = var.env
}

############################################
# Store Azure AD secret in Secrets Manager
############################################
module "secret_azure" {
  source        = "../../modules/secretmanager"
  secret_name   = "${var.project_name}/azure-ad-secret-${var.env}"
  secret_string = module.azure_ad.client_secret
  project_name  = var.project_name
  env           = var.env
}

############################################
# HTTP API Gateway for auth-service
############################################
module "auth_api" {
  source        = "../../modules/api-gateway-http"
  api_name      = "${var.project_name}-auth-${var.env}"
  description   = "Auth HTTP API"
  protocol_type = "HTTP"
  stage_name    = var.env
  access_log_format = var.access_log_format

  cors = {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_headers     = ["*"]
    allow_credentials = false
    expose_headers    = []
    max_age           = 0
  }

  enable_access_logs    = true
  access_log_group_name = "/aws/apigateway/${var.project_name}-auth-${var.env}"
  log_retention_in_days = 30
  kms_key_arn           = var.logs_kms_key_arn

  attach_waf_web_acl = var.attach_waf_web_acl
  waf_web_acl_arn    = var.waf_web_acl_arn

  tags = local.common_tags
}

############################################
# SNS topic for auth-service alerts
############################################
module "auth_alerts_sns" {
  source     = "../../modules/sns"
  topic_name = "${var.project_name}-auth-alerts-${var.env}"

  kms_master_key_id       = var.logs_kms_key_arn
  allow_cloudwatch_alarms = true

  subscriptions = [
    for email in var.alerts_emails : {
      protocol = "email-json"
      endpoint = email
    }
  ]

  tags = merge(local.common_tags, {
    Service = "auth-service"
  })
}
/**
 * @section CloudWatch Monitoring & Budgets
 * @description
 * Provisions CloudWatch alarms, dashboards, and cost budgets
 * for the `auth-service` microservice. Integrates monitoring for Lambda,
 * API Gateway, and sends alerts to the shared SNS topic.
 */

############################################
# CloudWatch monitoring for auth-service
############################################
module "cloudwatch_auth" {
  source       = "../../modules/cloudwatch"
  service_name = "auth-service"
  env          = var.env
  tags         = local.common_tags

  # Lambda functions to monitor
  lambda_function_names_map = {
    pre_auth = module.pre_auth_lambda.lambda_function_name
  }

  # API Gateway log group provided by API module
  create_apigw_log_group = false
  apigw_log_group_name   = module.auth_api.access_log_group_name

  # API Gateway alarms
  apigw_api_id = module.auth_api.api_id
  apigw_stage  = module.auth_api.stage_name

  # Alarm thresholds
  lambda_error_threshold        = 1
  apigw_5xx_threshold            = 1
  apigw_latency_p99_threshold_ms = 1500

  # Notifications
  alarm_sns_topic_arn = module.auth_alerts_sns.topic_arn
  ok_sns_topic_arn    = module.auth_alerts_sns.topic_arn

  # Dashboard
  create_dashboard = true
}

############################################
# Budgets for auth-service (cost alerts)
############################################
module "auth_budgets" {
  source      = "../../modules/budgets"
  project     = var.project_name
  environment = var.env
  common_tags = local.common_tags

  # Per-service budget
  service_budgets = [
    {
      name         = "auth-service"
      amount       = var.auth_budget_amount
      cost_filters = { TagKeyValue = ["Service$auth-service"] }
    }
  ]

  budget_currency        = "USD"
  threshold_percentages  = var.threshold_percentages

  # Reuse existing SNS topic for cost alerts
  create_sns_topic       = false
  existing_sns_topic_arn = var.existing_sns_topic_arn
  create_overall_budget  = false

  # Backup email notifications
  notify_emails = var.budget_notify_emails

  # Dashboard with Cost Explorer quick links
  create_dashboard   = true
  dashboard_services = ["auth-service"]
  aws_region         = var.aws_region
}

############################################
# Environment variables for CI/CD pipeline
############################################
locals {
  merged_env_vars = concat(
    var.environment_variables,
    [
      # OAuth URLs
      { name = "CALLBACK_URL", value = var.callback_url, type = "PLAINTEXT" },
      { name = "LOGOUT_URL",   value = var.logout_url,   type = "PLAINTEXT" },

      # Cognito
      { name = "COGNITO_USER_POOL_ID", value = module.cognito.user_pool_id, type = "PLAINTEXT" },
      { name = "COGNITO_CLIENT_ID",    value = module.cognito.user_pool_client_id, type = "PLAINTEXT" },
      { name = "COGNITO_DOMAIN",       value = module.cognito.cognito_domain, type = "PLAINTEXT" },

      # Google OAuth
      { name = "GOOGLE_CLIENT_ID",     value = module.gcp_oauth.client_id, type = "PLAINTEXT" },
      { name = "GOOGLE_CLIENT_SECRET", value = module.secret_google.secret_arn, type = "SECRETS_MANAGER" },

      # Azure AD OAuth
      { name = "AZURE_CLIENT_ID",      value = module.azure_ad.client_id, type = "PLAINTEXT" },
      { name = "AZURE_CLIENT_SECRET",  value = module.secret_azure.secret_arn, type = "SECRETS_MANAGER" },

      # Apple OAuth
      { name = "APPLE_CLIENT_ID",      value = var.apple_client_id, type = "PLAINTEXT" },

      # API Gateway references
      { name = "AUTH_API_ID",       value = module.auth_api.api_id, type = "PLAINTEXT" },
      { name = "AUTH_API_ENDPOINT", value = module.auth_api.api_endpoint, type = "PLAINTEXT" },

      # Operational metadata
      { name = "LOG_LEVEL",      value = "info", type = "PLAINTEXT" },
      { name = "SERVICE_NAME",   value = "auth", type = "PLAINTEXT" },
      { name = "ENV",            value = var.env, type = "PLAINTEXT" },
      { name = "PROJECT_NAME",   value = var.project_name, type = "PLAINTEXT" }
    ]
  )
}

############################################
# CI/CD Deployment Pipeline for auth-service
############################################
module "auth_deployment" {
  source = "../deployment-service"

  project_name          = var.project_name
  env                   = var.env
  service_name          = "auth"

  artifacts_bucket      = var.artifacts_bucket
  buildspec_path        = "../auth-service/buildspec.yml"

  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = local.merged_env_vars

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  
  # GitHub connection
  github_connection_arn = var.github_connection_arn

  tags = local.common_tags
}
