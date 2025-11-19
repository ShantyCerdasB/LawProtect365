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
  # pre_auth_lambda_arn is optional and not used by cognito module
  # Triggers are configured separately via cognito-trigger module below

  tags = local.common_tags
}

############################################
# Cognito triggers (attached post Lambda creation below)
############################################

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
    get_me               = module.lambda_get_me.lambda_function_name
    patch_me             = module.lambda_patch_me.lambda_function_name
    link_provider        = module.lambda_link_provider.lambda_function_name
    unlink_provider      = module.lambda_unlink_provider.lambda_function_name
    get_users_admin      = module.lambda_get_users_admin.lambda_function_name
    get_user_by_id_admin = module.lambda_get_user_by_id_admin.lambda_function_name
    set_user_role_admin  = module.lambda_set_user_role_admin.lambda_function_name
    set_user_status_admin= module.lambda_set_user_status_admin.lambda_function_name
    pre_authentication   = module.lambda_pre_authentication.lambda_function_name
    post_authentication  = module.lambda_post_authentication.lambda_function_name
    post_confirmation    = module.lambda_post_confirmation.lambda_function_name
    pre_token_generation = module.lambda_pre_token_generation.lambda_function_name
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

      # Eventing & Outbox (shared with signature-service)
      { name = "EVENTBRIDGE_BUS_NAME", value = var.event_bus_name, type = "PLAINTEXT" },
      { name = "EVENTBRIDGE_SOURCE",   value = "${var.project_name}.${var.env}.auth", type = "PLAINTEXT" },
      { name = "OUTBOX_TABLE_NAME",    value = var.outbox_table_name, type = "PLAINTEXT" },

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
  buildspec_path        = "services/auth-service/buildspec.yml"
  enable_test_stage     = true
  test_buildspec_path   = "services/auth-service/buildspec.tests.yml"

  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = concat(local.merged_env_vars, [
    { name = "AUTH_LAYER_NAME",        value = "${var.project_name}-auth-core-${var.env}", type = "PLAINTEXT" },
    { name = "SHARED_TS_LAYER_ARN",    value = var.shared_ts_layer_arn, type = "PLAINTEXT" },
    { name = "FUNCTIONS_MANIFEST",     value = jsonencode(local.functions_manifest), type = "PLAINTEXT" },
    { name = "CODE_BUCKET",            value = var.code_bucket, type = "PLAINTEXT" },
  ])

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  
  # GitHub connection
  github_connection_arn = var.github_connection_arn

  tags = local.common_tags

  # Enable multi-artifact build and multi-action deploys
  lambda_functions = [
    "get-me",
    "patch-me",
    "link-provider",
    "unlink-provider",
    "get-users-admin",
    "get-user-by-id-admin",
    "set-user-role-admin",
    "set-user-status-admin",
    "pre-authentication",
    "post-authentication",
    "post-confirmation",
    "pre-token-generation"
  ]
}

############################################
# Lambda functions (HTTP handlers + triggers)
############################################

locals {
  service_name = "auth-service"

  lambda_env_common = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL           = "info"
      PROJECT_NAME        = var.project_name
      ENV                 = var.env
      EVENTBRIDGE_BUS_NAME = var.event_bus_name
      EVENTBRIDGE_SOURCE   = "${var.project_name}.${var.env}.auth"
      OUTBOX_TABLE_NAME    = var.outbox_table_name
    }
  )

  functions_manifest = [
    # HTTP
    { functionName = "${var.project_name}-${local.service_name}-get-me-${var.env}",              alias = "live", artifactS3Key = "auth-get-me.zip",              artifactIdentifier = "auth_get-me_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-patch-me-${var.env}",            alias = "live", artifactS3Key = "auth-patch-me.zip",            artifactIdentifier = "auth_patch-me_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-link-provider-${var.env}",       alias = "live", artifactS3Key = "auth-link-provider.zip",       artifactIdentifier = "auth_link-provider_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-unlink-provider-${var.env}",     alias = "live", artifactS3Key = "auth-unlink-provider.zip",     artifactIdentifier = "auth_unlink-provider_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-get-users-admin-${var.env}",     alias = "live", artifactS3Key = "auth-get-users-admin.zip",     artifactIdentifier = "auth_get-users-admin_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-get-user-by-id-admin-${var.env}",alias = "live", artifactS3Key = "auth-get-user-by-id-admin.zip",artifactIdentifier = "auth_get-user-by-id-admin_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-set-user-role-admin-${var.env}", alias = "live", artifactS3Key = "auth-set-user-role-admin.zip", artifactIdentifier = "auth_set-user-role-admin_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-set-user-status-admin-${var.env}",alias = "live", artifactS3Key = "auth-set-user-status-admin.zip",artifactIdentifier = "auth_set-user-status-admin_artifact" },
    # Triggers
    { functionName = "${var.project_name}-${local.service_name}-pre-authentication-${var.env}",  alias = "live", artifactS3Key = "auth-pre-authentication.zip",  artifactIdentifier = "auth_pre-authentication_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-post-authentication-${var.env}", alias = "live", artifactS3Key = "auth-post-authentication.zip", artifactIdentifier = "auth_post-authentication_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-post-confirmation-${var.env}",   alias = "live", artifactS3Key = "auth-post-confirmation.zip",   artifactIdentifier = "auth_post-confirmation_artifact" },
    { functionName = "${var.project_name}-${local.service_name}-pre-token-generation-${var.env}",alias = "live", artifactS3Key = "auth-pre-token-generation.zip",artifactIdentifier = "auth_pre-token-generation_artifact" },
  ]
}

# HTTP handlers
module "lambda_get_me" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-get-me"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-get-me.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_patch_me" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-patch-me"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-patch-me.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_link_provider" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-link-provider"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-link-provider.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_unlink_provider" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-unlink-provider"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-unlink-provider.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_get_users_admin" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-get-users-admin"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-get-users-admin.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_get_user_by_id_admin" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-get-user-by-id-admin"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-get-user-by-id-admin.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_set_user_role_admin" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-set-user-role-admin"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-set-user-role-admin.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_set_user_status_admin" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-set-user-status-admin"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-set-user-status-admin.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

# Triggers
module "lambda_pre_authentication" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-pre-authentication"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-pre-authentication.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_post_authentication" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-post-authentication"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-post-authentication.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_post_confirmation" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-post-confirmation"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-post-confirmation.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

module "lambda_pre_token_generation" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env
  function_name = "${var.project_name}-${local.service_name}-pre-token-generation"
  s3_bucket     = var.code_bucket
  s3_key        = "auth-pre-token-generation.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  environment_variables = local.lambda_env_common
}

############################################
# Attach Cognito triggers to 'live' aliases
############################################
module "cognito_triggers" {
  source                            = "../../modules/cognito-trigger"
  user_pool_id                      = module.cognito.user_pool_id
  pre_auth_lambda_arn               = module.lambda_pre_authentication.lambda_alias_live_arn
  post_auth_lambda_arn              = module.lambda_post_authentication.lambda_alias_live_arn
  post_confirmation_lambda_arn      = module.lambda_post_confirmation.lambda_alias_live_arn
  pre_token_generation_lambda_arn   = module.lambda_pre_token_generation.lambda_alias_live_arn
}
