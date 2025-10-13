############################################################
# sign-service — main
# Defines all resources for the Sign microservice, including:
# - Evidence S3 bucket
# - IAM roles and policies
# - Lambda functions (/consents, /signatures, /certificate)
# - HTTP API Gateway configuration
#
# Uses a shared environment variable map for ALL Lambdas (e.g., DB_SECRET_ARN)
############################################################

/**
 * Local variables for common tags, service name, merged tags,
 * and shared environment variables for all Lambda functions.
 *
 * - common_tags: Base project metadata
 * - service_name: Logical name for this microservice ("sign-service")
 * - tags: Base tags + Service tag for all resources
 * - shared_lambda_env: Merged root-provided env vars + service defaults
 */

 locals {
  common_tags = {
    Project = var.project_name
    Env     = var.env
    Owner   = "legal-platform-team"
  }

  service_name = "sign-service"
  tags         = merge(local.common_tags, { Service = local.service_name })

  # Base común para todas las Lambdas (inyectada desde root + defaults)
  shared_lambda_env = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL    = "info"
      PROJECT_NAME = var.project_name
      ENV          = var.env
      SERVICE_NAME = local.service_name
    }
  )

  # ---------- LAMBDA RUNTIME ENVS (MAP) ----------
  lambda_env_common = merge(
    local.shared_lambda_env,
    {
      # Database configuration
      DATABASE_URL = var.shared_lambda_env.DB_SECRET_ARN
      
      # S3 buckets
      S3_BUCKET_NAME = var.documents_bucket_name
      EVIDENCE_BUCKET = module.evidence_bucket.bucket_id
      
      # AWS Region
      
      # KMS configuration
      KMS_SIGNER_KEY_ID = var.kms_sign_key_arn
      
      # Outbox table for event publishing
      OUTBOX_TABLE_NAME = var.outbox_table_name
      
      # EventBridge configuration
      EVENTBRIDGE_BUS_NAME = var.event_bus_arn
      
      # SSM Parameter Store
      SSM_PARAM_PREFIX = "/${var.project_name}/${var.env}"
      
      # Database configuration
      DB_MAX_CONNECTIONS = var.db_max_connections
      DB_CONNECTION_TIMEOUT = var.db_connection_timeout
      
      # KMS configuration
      KMS_SIGNING_ALGORITHM = var.kms_signing_algorithm
      
      # Document download configuration
      DOCUMENT_DOWNLOAD_DEFAULT_EXPIRATION_SECONDS = var.document_download_default_expiration_seconds
      DOCUMENT_DOWNLOAD_MAX_EXPIRATION_SECONDS = var.document_download_max_expiration_seconds
      DOCUMENT_DOWNLOAD_MIN_EXPIRATION_SECONDS = var.document_download_min_expiration_seconds
      
      # Reminders configuration
      MAX_REMINDERS_PER_SIGNER = var.max_reminders_per_signer
      MIN_HOURS_BETWEEN_REMINDERS = var.min_hours_between_reminders
      FIRST_REMINDER_HOURS = var.first_reminder_hours
      SECOND_REMINDER_HOURS = var.second_reminder_hours
      THIRD_REMINDER_HOURS = var.third_reminder_hours
      
  # CloudWatch metrics
  METRICS_NAMESPACE = "SignService"
    }
  )

  # Shared layer ARN for all Lambda functions
  shared_layer_arn = var.shared_ts_layer_arn

  # Sign core layer ARN (will be created below)
  sign_core_layer_arn = aws_lambda_layer_version.sign_core_layer.arn
  
  # Sign dependencies layer ARN (will be created below)
  sign_deps_layer_arn = aws_lambda_layer_version.sign_deps_layer.arn

  # ---------- CODEBUILD/PIPELINE ENVS ----------
  codebuild_env_vars = concat(
    var.environment_variables,
    [
      { name = "DATABASE_URL",      value = var.shared_lambda_env.DB_SECRET_ARN,   type = "SECRETS_MANAGER" },
      { name = "S3_BUCKET_NAME",    value = var.documents_bucket_name,            type = "PLAINTEXT" },
      { name = "EVIDENCE_BUCKET",   value = module.evidence_bucket.bucket_id,     type = "PLAINTEXT" },
      { name = "KMS_SIGNER_KEY_ID", value = var.kms_sign_key_arn,                 type = "PLAINTEXT" },
      { name = "OUTBOX_TABLE_NAME", value = var.outbox_table_name,                type = "PLAINTEXT" },
      { name = "EVENTBRIDGE_BUS_NAME", value = var.event_bus_arn,                 type = "PLAINTEXT" },
      { name = "SIGN_API_ID",       value = module.sign_api.api_id,               type = "PLAINTEXT" },
      { name = "SIGN_API_ENDPOINT", value = module.sign_api.api_endpoint,         type = "PLAINTEXT" },
      { name = "SERVICE_NAME",      value = "sign",                                type = "PLAINTEXT" },
      { name = "ENV",               value = var.env,                               type = "PLAINTEXT" },
      { name = "PROJECT_NAME",      value = var.project_name,                      type = "PLAINTEXT" },
      { name = "SSM_PARAM_PREFIX",  value = "/${var.project_name}/${var.env}",     type = "PLAINTEXT" },
      { name = "CODE_BUCKET",       value = var.code_bucket,                       type = "PLAINTEXT" },
      { name = "CODEDEPLOY_APP_PREFIX", value = "${var.project_name}-sign-${var.env}", type = "PLAINTEXT" },
      { name = "CODEDEPLOY_DG_PREFIX", value = "${var.project_name}-sign-${var.env}", type = "PLAINTEXT" },
      { name = "AWS_REGION",         value = var.aws_region,                          type = "PLAINTEXT" }
    ]
  )
}



############################################################
# Sign Core Layer
# Contains compiled signature service code
############################################################
resource "aws_lambda_layer_version" "sign_deps_layer" {
  s3_bucket           = var.code_bucket
  s3_key              = "sign-deps-layer.zip"
  layer_name          = "${var.project_name}-sign-deps-${var.env}"
  compatible_runtimes = ["nodejs20.x"]
  description         = "Signature service dependencies layer"
}

resource "aws_lambda_layer_version" "sign_core_layer" {
  s3_bucket           = var.code_bucket
  s3_key              = "sign-core-layer.zip"
  layer_name          = "${var.project_name}-sign-core-${var.env}"
  compatible_runtimes = ["nodejs20.x"]
  description         = "Signature service core code layer"
}

############################################################
# Evidence S3 Bucket
# Stores supporting evidence files for signed documents
############################################################
module "evidence_bucket" {
  source       = "../../modules/s3"
  bucket_name  = var.evidence_bucket_name   # e.g., "${var.project_name}-sign-evidence-${var.env}"
  project_name = var.project_name
  env          = var.env
}

############################################################
# IAM Role for Lambda functions
#
# - Trust policy: Lambda assume role (var.lambda_assume_role_policy)
# - Managed policies:
#   * AWSLambdaBasicExecutionRole
#   * AWSXRayDaemonWriteAccess
# - Inline policies:
#   * Provided by data-policies.tf → local.inline_policies
#   * Includes var.extra_inline_policies from root
############################################################
module "sign_lambda_role" {
  source             = "../../modules/iam-role"
  role_name          = "${var.project_name}-${local.service_name}-lambda-${var.env}"
  assume_role_policy = var.lambda_assume_role_policy

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  ]

        inline_policies = {
          "kms-sign" = data.aws_iam_policy_document.sign_kms_sign.json
          "s3-documents-read" = data.aws_iam_policy_document.sign_s3_documents_read.json
          "s3-evidence-rw" = data.aws_iam_policy_document.sign_s3_evidence_rw.json
          "kms-evidence-s3" = data.aws_iam_policy_document.sign_kms_evidence_s3[0].json
          "cloudwatch-metrics" = data.aws_iam_policy_document.sign_cloudwatch_metrics.json
          "eventbridge-put" = data.aws_iam_policy_document.sign_eventbridge_put.json
          "s3-evidence-mpu" = data.aws_iam_policy_document.sign_s3_evidence_mpu.json
          "s3-object-lock" = data.aws_iam_policy_document.sign_s3_object_lock.json
          "ssm-read" = data.aws_iam_policy_document.sign_ssm_read.json
          "outbox-publisher" = var.outbox_publisher_policy
          "eventbridge-publisher" = var.eventbridge_publisher_policy
        }

  project_name = var.project_name
  env          = var.env
}

############################################################
# Lambda: POST /consents
#
# Purpose:
# - Handles consent submissions for document signing
#
# Key environment variables:
# - Inherits shared_lambda_env
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
############################################################
module "lambda_create_envelope" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-create-envelope"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-create-envelope.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 15
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]

  xray_tracing = true
}

############################################################
# Lambda: GET /envelopes/{id}
#
# Purpose:
# - Retrieves envelope details and status
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
############################################################
module "lambda_get_envelope" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-get-envelope"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-get-envelope.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]

  xray_tracing = true
}

############################################################
# Lambda: POST /envelopes/{id}/send
#
# Purpose:
# - Sends envelope to signers with invitation tokens
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVENTBRIDGE_BUS_NAME: EventBridge bus for notifications
############################################################
module "lambda_send_envelope" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-send-envelope"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-send-envelope.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 15
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]

  xray_tracing = true
}


############################################################
# Lambda: POST /documents/{id}/sign
#
# Purpose:
# - Signs a document with cryptographic signature
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - KMS_SIGNER_KEY_ID: KMS key for signing
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
############################################################
module "lambda_sign_document" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-sign-document"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-sign-document.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 15
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: POST /signers/{id}/decline
#
# Purpose:
# - Declines a signer from an envelope
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVENTBRIDGE_BUS_NAME: EventBridge bus for notifications
############################################################
module "lambda_decline_signer" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-decline-signer"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-decline-signer.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: GET /documents/{id}/share
#
# Purpose:
# - Shares document view with external users
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
############################################################
module "lambda_share_document" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-share-document"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-share-document.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: POST /notifications/send
#
# Purpose:
# - Sends notifications to signers
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVENTBRIDGE_BUS_NAME: EventBridge bus for notifications
############################################################
module "lambda_send_notification" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-send-notification"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-send-notification.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: GET /audit/trail
#
# Purpose:
# - Retrieves audit trail for envelopes and documents
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
############################################################
module "lambda_get_audit_trail" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-get-audit-trail"
  s3_bucket     = var.code_bucket
  s3_key         = "sign-get-audit-trail.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: GET /envelopes (by user)
#
# Purpose:
# - Retrieves envelopes for a specific user
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
############################################################
module "lambda_get_envelopes_by_user" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-get-envelopes-by-user"
  s3_bucket     = var.code_bucket
  s3_key         = "sign-get-envelopes-by-user.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: PATCH /envelopes/{id}
#
# Purpose:
# - Updates envelope metadata and status
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
############################################################
module "lambda_update_envelope" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-update-envelope"
  s3_bucket     = var.code_bucket
  s3_key         = "sign-update-envelope.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: DELETE /envelopes/{id}
#
# Purpose:
# - Cancels an envelope and notifies signers
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - EVENTBRIDGE_BUS_NAME: EventBridge bus for notifications
############################################################
module "lambda_cancel_envelope" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-cancel-envelope"
  s3_bucket     = var.code_bucket
  s3_key         = "sign-cancel-envelope.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}

############################################################
# Lambda: GET /documents/{id}/download
#
# Purpose:
# - Downloads document for viewing or signing
#
# Key environment variables:
# - DATABASE_URL: PostgreSQL connection string
# - S3_BUCKET_NAME: S3 bucket for documents
############################################################
module "lambda_download_document" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-download-document"
  s3_bucket     = var.code_bucket
  s3_key         = "sign-download-document.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 512
  timeout        = 10
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  layers = [local.shared_layer_arn, local.sign_deps_layer_arn, local.sign_core_layer_arn]
  xray_tracing   = true
}


############################################################
# HTTP API Gateway (API Gateway v2)
#
# Purpose:
# - Public API for the sign-service
# - Integrates all domain Lambdas (envelopes, documents, inputs, parties,
#   requests, uploads, plus consent, signatures, certificate)
#
# Features:
# - CORS enabled (covers GET/POST/PATCH/PUT/DELETE/OPTIONS)
# - Access logs (KMS-encrypted)
# - Optional WAF Web ACL
# - Optional JWT authorizer (Cognito)
############################################################
module "sign_api" {
  source             = "../../modules/api-gateway-http"
  api_name           = "${var.project_name}-sign-${var.env}"
  description        = "Sign HTTP API"
  protocol_type      = "HTTP"
  stage_name         = var.env
  access_log_format  = var.access_log_format

  cors = {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["*"]
    allow_credentials = false
    expose_headers    = []
    max_age           = 0
  }

  enable_access_logs    = true
  access_log_group_name = "/aws/apigateway/${var.project_name}-sign-${var.env}"
  log_retention_in_days = 30
  kms_key_arn           = var.logs_kms_key_arn

  attach_waf_web_acl    = var.attach_waf_web_acl
  waf_web_acl_arn       = var.waf_web_acl_arn

  enable_jwt_authorizer = var.enable_jwt_authorizer
  jwt_issuer            = var.jwt_issuer
  jwt_audiences         = var.jwt_audiences

  routes = [
    # ----------------------------
    # ENVELOPES
    # ----------------------------
    { route_key = "GET /envelopes", integration_uri = module.lambda_get_envelopes_by_user.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes", integration_uri = module.lambda_create_envelope.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "GET /envelopes/{id}", integration_uri = module.lambda_get_envelope.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "PATCH /envelopes/{id}", integration_uri = module.lambda_update_envelope.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /envelopes/{id}", integration_uri = module.lambda_cancel_envelope.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{id}/send", integration_uri = module.lambda_send_envelope.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # DOCUMENTS
    # ----------------------------
    { route_key = "GET /documents/{id}/download", integration_uri = module.lambda_download_document.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /documents/{id}/sign", integration_uri = module.lambda_sign_document.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "GET /documents/{id}/share", integration_uri = module.lambda_share_document.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # SIGNERS
    # ----------------------------
    { route_key = "POST /signers/{id}/decline", integration_uri = module.lambda_decline_signer.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # NOTIFICATIONS
    # ----------------------------
    { route_key = "POST /notifications/send", integration_uri = module.lambda_send_notification.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # AUDIT
    # ----------------------------
    { route_key = "GET /audit/trail", integration_uri = module.lambda_get_audit_trail.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" }
  ]

  tags = merge(local.tags, { Component = "api" })
}


############################################################
# SNS Alerts — sign-service
#
# Purpose:
# - Sends email alerts (JSON format) when triggered by CloudWatch alarms
# - Uses KMS encryption for SNS topic
# - Allows CloudWatch alarms to publish messages
############################################################
module "sign_alerts_sns" {
  source     = "../../modules/sns"
  topic_name = "${var.project_name}-sign-alerts-${var.env}"

  # Encrypt messages at rest using the specified KMS key
  kms_master_key_id       = var.logs_kms_key_arn
  allow_cloudwatch_alarms = true

  # Create one subscription per email provided in var.alerts_emails
  subscriptions = [
    for email in var.alerts_emails : {
      protocol = "email-json"
      endpoint = email
    }
  ]

  tags = local.tags
}
############################################################
# CloudWatch Monitoring — sign-service
#
# Purpose:
# - Creates CloudWatch alarms for Lambda errors, API Gateway errors, and latency
# - Creates a CloudWatch dashboard
# - Connects alarms to the SNS topic created above
#
# Key configuration:
# - Lambda error threshold: 1
# - API Gateway 5xx threshold: 1
# - API Gateway latency p99 threshold: 1500ms
############################################################
module "cloudwatch_sign" {
  source       = "../../modules/cloudwatch"
  service_name = local.service_name
  env          = var.env
  tags         = local.tags

  # Monitor all Lambda functions used by sign-service
  lambda_function_names_map = {
    create_envelope = module.lambda_create_envelope.lambda_function_name
    get_envelope = module.lambda_get_envelope.lambda_function_name
    get_envelopes_by_user = module.lambda_get_envelopes_by_user.lambda_function_name
    send_envelope = module.lambda_send_envelope.lambda_function_name
    update_envelope = module.lambda_update_envelope.lambda_function_name
    cancel_envelope = module.lambda_cancel_envelope.lambda_function_name
    download_document = module.lambda_download_document.lambda_function_name
    sign_document = module.lambda_sign_document.lambda_function_name
    share_document = module.lambda_share_document.lambda_function_name
    decline_signer = module.lambda_decline_signer.lambda_function_name
    send_notification = module.lambda_send_notification.lambda_function_name
    get_audit_trail = module.lambda_get_audit_trail.lambda_function_name
  }

  # API Gateway logs and metrics
  create_apigw_log_group = false
  apigw_log_group_name   = module.sign_api.access_log_group_name

  apigw_api_id = module.sign_api.api_id
  apigw_stage  = module.sign_api.stage_name

  # Alarm thresholds
  lambda_error_threshold         = 1
  apigw_5xx_threshold            = 1
  apigw_latency_p99_threshold_ms = 1500

  # Notifications
  alarm_sns_topic_arn = module.sign_alerts_sns.topic_arn
  ok_sns_topic_arn    = module.sign_alerts_sns.topic_arn

  # Dashboard enabled
  create_dashboard = true
}


############################################################
# AWS Budgets — sign-service
#
# Purpose:
# - Creates a cost budget for the sign-service
# - Sends budget notifications to provided email list
# - Adds service-level FinOps visibility
#
# Notes:
# - Does not create a new SNS topic; uses existing one
# - Does not create an overall project budget
############################################################
module "sign_budgets" {
  source      = "../../modules/budgets"
  project     = var.project_name
  environment = var.env
  common_tags = local.tags

  service_budgets = [{
    name         = local.service_name
    amount       = var.sign_budget_amount
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

############################################################
# CI/CD — deployment-service wrapper
#
# Purpose:
# - Deploys sign-service Lambda functions using CodeBuild/CodePipeline
# - Uses a shared deployment-service module for consistent CI/CD
#
# Notes:
# - Adds environment variables for build and deployment context
# - Pulls source from GitHub repository
############################################################

module "sign_deployment" {
  source = "../deployment-service"

  project_name          = var.project_name
  env                   = var.env
  service_name          = "sign"
  artifacts_bucket      = var.artifacts_bucket
  buildspec_path        = "services/signature-service/buildspec.yml"
  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = local.codebuild_env_vars
  
  # Multiple Lambda functions for CodeDeploy
  lambda_functions = [
    "create-envelope",
    "get-envelope", 
    "send-envelope",
    "sign-document",
    "decline-signer",
    "share-document",
    "send-notification",
    "get-audit-trail",
    "get-envelopes-by-user",
    "update-envelope",
    "cancel-envelope",
    "download-document"
  ]
 
  github_connection_arn = var.github_connection_arn
  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  branch                = var.github_branch

  tags = local.common_tags
}


