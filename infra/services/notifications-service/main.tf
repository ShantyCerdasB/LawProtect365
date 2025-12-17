/**
 * @file main.tf
 * @module notifications_service
 * @description
 * Terraform configuration for the notifications-service microservice.
 * Provisions Lambda function for EventBridge event processing, IAM roles,
 * SES/Pinpoint configuration, Secrets Manager, CloudWatch monitoring,
 * SNS alerts, budgets, and CI/CD pipeline.
 *
 * Database Access:
 * This service uses a shared PostgreSQL database instance managed at the root level.
 * Database connection credentials are provided via Secrets Manager (DB_SECRET_ARN).
 * The service does not create or manage database resources directly.
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

  service_name = "notifications-service"
  tags         = merge(local.common_tags, { Service = local.service_name })
}

############################################
# SES Email Identity
############################################

resource "aws_ses_email_identity" "from_email" {
  count = var.create_ses_identity && var.ses_from_email != null && var.ses_domain_name == null ? 1 : 0
  email = var.ses_from_email
}

resource "aws_ses_domain_identity" "domain" {
  count  = var.create_ses_identity && var.ses_domain_name != null ? 1 : 0
  domain = var.ses_domain_name
}

resource "aws_route53_record" "ses_verification" {
  count   = var.create_ses_identity && var.ses_domain_name != null && var.ses_hosted_zone_id != null ? 1 : 0
  zone_id = var.ses_hosted_zone_id
  name    = "_amazonses.${var.ses_domain_name}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.domain[0].verification_token]
}

############################################
# Pinpoint Application
############################################

resource "aws_pinpoint_app" "notifications" {
  count = var.create_pinpoint_app ? 1 : 0
  name  = "${var.project_name}-notifications-${var.env}"

  tags = {
    Project = var.project_name
    Env     = var.env
    Owner   = "legal-platform-team"
  }
}

resource "aws_pinpoint_sms_channel" "sms" {
  count          = var.create_pinpoint_app ? 1 : 0
  application_id = aws_pinpoint_app.notifications[0].application_id
  enabled        = true
  sender_id      = var.pinpoint_sender_id
}

############################################
# Secrets Manager: FCM Service Account Key
# Creates secret only if fcm_service_account_key is provided
# and fcm_secret_arn is not provided (using existing secret)
############################################

module "secret_fcm" {
  count       = var.fcm_service_account_key != null && var.fcm_secret_arn == null ? 1 : 0
  source      = "../../modules/secretmanager"
  secret_name = "${var.project_name}/fcm-service-account-${var.env}"
  secret_string = jsonencode({
    serviceAccountKey = var.fcm_service_account_key
    projectId         = var.fcm_project_id
  })
  project_name = var.project_name
  env          = var.env
}

############################################
# Secrets Manager: APNS Keys
# Creates secret only if apns_key_id is provided
# and apns_secret_arn is not provided (using existing secret)
############################################

module "secret_apns" {
  count       = var.apns_key_id != null && var.apns_secret_arn == null ? 1 : 0
  source      = "../../modules/secretmanager"
  secret_name = "${var.project_name}/apns-keys-${var.env}"
  secret_string = jsonencode({
    keyId      = var.apns_key_id
    teamId     = var.apns_team_id
    key        = var.apns_key
    bundleId   = var.apns_bundle_id
    production = var.apns_production
  })
  project_name = var.project_name
  env          = var.env
}

############################################
# Locals for computed values
############################################
locals {
  fcm_secret_arn_final = var.fcm_secret_arn != null ? var.fcm_secret_arn : (length(module.secret_fcm) > 0 ? module.secret_fcm[0].secret_arn : null)
  apns_secret_arn_final = var.apns_secret_arn != null ? var.apns_secret_arn : (length(module.secret_apns) > 0 ? module.secret_apns[0].secret_arn : null)
  pinpoint_app_id_final = var.create_pinpoint_app ? (length(aws_pinpoint_app.notifications) > 0 ? aws_pinpoint_app.notifications[0].application_id : var.pinpoint_application_id) : var.pinpoint_application_id

  shared_lambda_env = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL           = "info"
      PROJECT_NAME        = var.project_name
      ENV                 = var.env
      SERVICE_NAME        = local.service_name
      EVENTBRIDGE_BUS_NAME = var.event_bus_name
      EVENTBRIDGE_SOURCE = "${var.project_name}.${var.env}.notifications"
    }
  )

  lambda_env_common = merge(
    local.shared_lambda_env,
    {
      DATABASE_URL            = var.shared_lambda_env.DB_SECRET_ARN
      DB_MAX_CONNECTIONS      = tostring(var.db_max_connections)
      DB_CONNECTION_TIMEOUT   = tostring(var.db_connection_timeout)
      SES_FROM_EMAIL          = var.ses_from_email
      SES_REPLY_TO_EMAIL      = var.ses_reply_to_email != "" ? var.ses_reply_to_email : var.ses_from_email
      SES_CONFIGURATION_SET   = var.ses_configuration_set != null ? var.ses_configuration_set : ""
      PINPOINT_APPLICATION_ID = local.pinpoint_app_id_final
      PINPOINT_SENDER_ID      = var.pinpoint_sender_id
      FCM_SERVICE_ACCOUNT_KEY = local.fcm_secret_arn_final != null ? "${local.fcm_secret_arn_final}:serviceAccountKey" : ""
      FCM_PROJECT_ID          = var.fcm_project_id != null ? var.fcm_project_id : ""
      APNS_KEY_ID             = local.apns_secret_arn_final != null ? "${local.apns_secret_arn_final}:keyId" : ""
      APNS_TEAM_ID            = local.apns_secret_arn_final != null ? "${local.apns_secret_arn_final}:teamId" : ""
      APNS_KEY                = local.apns_secret_arn_final != null ? "${local.apns_secret_arn_final}:key" : ""
      APNS_BUNDLE_ID          = local.apns_secret_arn_final != null ? "${local.apns_secret_arn_final}:bundleId" : ""
      APNS_PRODUCTION         = var.apns_production ? "true" : "false"
      ENABLE_EMAIL            = var.enable_email ? "true" : "false"
      ENABLE_SMS              = var.enable_sms ? "true" : "false"
      ENABLE_PUSH             = var.enable_push ? "true" : "false"
      METRICS_NAMESPACE       = "NotificationsService"
      AWS_REGION              = var.aws_region
    }
  )

  shared_layer_arn = var.shared_ts_layer_arn
  notifications_layer_name = "${var.project_name}-notifications-core-${var.env}"

  functions_manifest = [
    { functionName = "${var.project_name}-${local.service_name}-eventbridge-handler-${var.env}", alias = "live", artifactS3Key = "notifications-eventbridge-handler.zip", artifactIdentifier = "notifications_eventbridge-handler_artifact" }
  ]

  codebuild_env_vars = concat(
    var.environment_variables,
    [
      { name = "DATABASE_URL", value = var.shared_lambda_env.DB_SECRET_ARN, type = "SECRETS_MANAGER" },
      { name = "EVENTBRIDGE_BUS_NAME", value = var.event_bus_name, type = "PLAINTEXT" },
      { name = "SES_FROM_EMAIL", value = var.ses_from_email, type = "PLAINTEXT" },
      { name = "SES_REPLY_TO_EMAIL", value = var.ses_reply_to_email != "" ? var.ses_reply_to_email : var.ses_from_email, type = "PLAINTEXT" },
      { name = "PINPOINT_APPLICATION_ID", value = local.pinpoint_app_id_final, type = "PLAINTEXT" },
      { name = "PINPOINT_SENDER_ID", value = var.pinpoint_sender_id, type = "PLAINTEXT" },
      { name = "SERVICE_NAME", value = "notifications", type = "PLAINTEXT" },
      { name = "ENV", value = var.env, type = "PLAINTEXT" },
      { name = "PROJECT_NAME", value = var.project_name, type = "PLAINTEXT" },
      { name = "CODE_BUCKET", value = var.code_bucket, type = "PLAINTEXT" },
      { name = "AWS_REGION", value = var.aws_region, type = "PLAINTEXT" },
      { name = "SHARED_TS_LAYER_ARN", value = var.shared_ts_layer_arn, type = "PLAINTEXT" },
      { name = "NOTIFICATIONS_LAYER_NAME", value = local.notifications_layer_name, type = "PLAINTEXT" },
      { name = "FUNCTIONS_MANIFEST", value = jsonencode(local.functions_manifest), type = "PLAINTEXT" }
    ]
  )
}

############################################
# IAM Role for Lambda functions
############################################

module "notifications_lambda_role" {
  source             = "../../modules/iam-role"
  role_name          = "${var.project_name}-${local.service_name}-lambda-${var.env}"
  assume_role_policy = var.lambda_assume_role_policy

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  ]

  inline_policies = merge(
    local.inline_policies,
    {
      "secrets-db-read" = var.db_secret_read_policy
    }
  )

  project_name = var.project_name
  env          = var.env
}

############################################
# Lambda: EventBridge Handler
############################################

module "lambda_eventbridge_handler" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-eventbridge-handler"
  s3_bucket     = var.code_bucket
  s3_key        = "notifications-eventbridge-handler.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 60
  role_arn      = module.notifications_lambda_role.role_arn

  environment_variables = local.lambda_env_common

  xray_tracing = true
}

############################################
# EventBridge Rule for notifications-service
# Uses the shared event bus created at root level
############################################

resource "aws_cloudwatch_event_rule" "notifications_rule" {
  name           = "${var.project_name}-notifications-rule-${var.env}"
  description    = "EventBridge rule for notifications-service to process events from signature-service and auth-service"
  event_bus_name = var.event_bus_name

  event_pattern = jsonencode({
    "source" = ["sign.service", "auth-service"]
    "detail-type" = [
      "ENVELOPE_INVITATION",
      "DOCUMENT_VIEW_INVITATION",
      "SIGNER_DECLINED",
      "ENVELOPE_CANCELLED",
      "REMINDER_NOTIFICATION",
      "UserRegistered",
      "UserUpdated",
      "UserRoleChanged",
      "UserStatusChanged",
      "MfaStatusChanged",
      "OAuthAccountLinked",
      "OAuthAccountUnlinked",
      "UserProviderLinked",
      "UserProviderUnlinked"
    ]
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "notifications_target" {
  rule           = aws_cloudwatch_event_rule.notifications_rule.name
  arn            = module.lambda_eventbridge_handler.lambda_function_arn
  event_bus_name = var.event_bus_name
  target_id      = "${var.project_name}-notifications-target-${var.env}"
}

resource "aws_lambda_permission" "allow_events_invoke_notifications" {
  statement_id  = "AllowExecutionFromEventBridge-${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_eventbridge_handler.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.notifications_rule.arn
}

############################################
# SNS Alerts for notifications-service
############################################

module "notifications_alerts_sns" {
  source     = "../../modules/sns"
  topic_name = "${var.project_name}-notifications-alerts-${var.env}"

  kms_master_key_id       = var.logs_kms_key_arn
  allow_cloudwatch_alarms = true

  subscriptions = [
    for email in var.alerts_emails : {
      protocol = "email-json"
      endpoint = email
    }
  ]

  tags = local.tags
}

############################################
# CloudWatch Monitoring for notifications-service
############################################

module "cloudwatch_notifications" {
  source       = "../../modules/cloudwatch"
  service_name = local.service_name
  env          = var.env
  tags         = local.tags

  lambda_function_names_map = {
    eventbridge_handler = module.lambda_eventbridge_handler.lambda_function_name
  }

  create_apigw_log_group = false
  apigw_log_group_name   = null

  apigw_api_id = null
  apigw_stage  = null

  lambda_error_threshold         = 1
  apigw_5xx_threshold            = 1
  apigw_latency_p99_threshold_ms = 1500

  alarm_sns_topic_arn = module.notifications_alerts_sns.topic_arn
  ok_sns_topic_arn    = module.notifications_alerts_sns.topic_arn

  create_dashboard = true
}

############################################
# Budgets for notifications-service
############################################

module "notifications_budgets" {
  source      = "../../modules/budgets"
  project     = var.project_name
  environment = var.env
  common_tags = local.tags

  service_budgets = [{
    name         = local.service_name
    amount       = var.notifications_budget_amount
    cost_filters = { TagKeyValue = ["Service$${local.service_name}"] }
  }]

  budget_currency        = "USD"
  threshold_percentages  = var.threshold_percentages
  notify_emails          = var.budget_notify_emails

  create_dashboard       = true
  create_sns_topic       = false
  existing_sns_topic_arn = var.existing_sns_topic_arn
  create_overall_budget  = false
  dashboard_services     = [local.service_name]
  aws_region             = var.aws_region
}

############################################
# CI/CD Deployment Pipeline
############################################

module "notifications_deployment" {
  source = "../deployment-service"

  project_name          = var.project_name
  env                   = var.env
  service_name          = "notifications"
  artifacts_bucket      = var.artifacts_bucket
  buildspec_path        = "services/notifications-service/buildspec.yml"
  enable_test_stage     = true
  test_buildspec_path   = "services/notifications-service/buildspec.tests.yml"
  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = local.codebuild_env_vars
  extra_secret_arns = compact(concat(
    [try(module.secret_fcm[0].secret_arn, null), try(module.secret_apns[0].secret_arn, null)],
    [var.fcm_secret_arn, var.apns_secret_arn]
  ))

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  github_connection_arn = var.github_connection_arn

  tags = local.common_tags

  lambda_functions = [
    "eventbridge-handler"
  ]
}
