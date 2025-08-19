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
      DOCUMENTS_BUCKET  = var.documents_bucket_name
      EVIDENCE_BUCKET   = module.evidence_bucket.bucket_id
      KMS_SIGN_KEY_ARN  = var.kms_sign_key_arn

      ENVELOPES_TABLE   = module.ddb_envelopes.table_name
      TOKENS_TABLE      = module.ddb_signing_tokens.table_name

      SSM_PARAM_PREFIX  = "/${var.project_name}/${var.env}"
      EVENT_BUS_ARN     = coalesce(var.event_bus_arn, "")

      METRICS_NAMESPACE = "SignService"
    }
  )

  # ---------- CODEBUILD/PIPELINE ENVS (LISTA) ----------
  codebuild_env_vars = concat(
    var.environment_variables,
    [
      { name = "DOCUMENTS_BUCKET",  value = var.documents_bucket_name,            type = "PLAINTEXT" },
      { name = "EVIDENCE_BUCKET",   value = module.evidence_bucket.bucket_id,     type = "PLAINTEXT" },
      { name = "KMS_SIGN_KEY_ARN",  value = var.kms_sign_key_arn,                 type = "PLAINTEXT" },
      { name = "ENVELOPES_TABLE",   value = module.ddb_envelopes.table_name,      type = "PLAINTEXT" },
      { name = "TOKENS_TABLE",      value = module.ddb_signing_tokens.table_name, type = "PLAINTEXT" },
      { name = "SIGN_API_ID",       value = module.sign_api.api_id,               type = "PLAINTEXT" },
      { name = "SIGN_API_ENDPOINT", value = module.sign_api.api_endpoint,         type = "PLAINTEXT" },
      { name = "SERVICE_NAME",      value = "sign",                                type = "PLAINTEXT" },
      { name = "ENV",               value = var.env,                               type = "PLAINTEXT" },
      { name = "PROJECT_NAME",      value = var.project_name,                      type = "PLAINTEXT" },
      { name = "SSM_PARAM_PREFIX",  value = "/${var.project_name}/${var.env}",     type = "PLAINTEXT" },
      { name = "EVENT_BUS_ARN",     value = try(var.event_bus_arn, ""),            type = "PLAINTEXT" }
    ]
  )
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

  inline_policies = local.inline_policies

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
module "lambda_consent" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-consent"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-consent.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = local.lambda_env_common

  xray_tracing = true
}

############################################################
# Lambda: POST /signatures
#
# Purpose:
# - Submits signatures for a document
#
# Key environment variables:
# - DOCUMENTS_BUCKET: Name of the documents S3 bucket
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
# - KMS_SIGN_KEY_ARN: ARN of the KMS asymmetric signing key
############################################################
module "lambda_sign" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-sign"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-submit.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 15
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = local.lambda_env_common

  xray_tracing = true
}

############################################################
# Lambda: GET /documents/{id}/certificate
#
# Purpose:
# - Returns the signing certificate for a document
#
# Key environment variables:
# - EVIDENCE_BUCKET: Evidence S3 bucket ID
############################################################
module "lambda_certificate" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-certificate"
  s3_bucket     = var.code_bucket
  s3_key        = "sign-certificate.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 10
  role_arn      = module.sign_lambda_role.role_arn

  environment_variables = merge(
    local.shared_lambda_env,
    {
      EVIDENCE_BUCKET = module.evidence_bucket.bucket_id
    }
  )

  xray_tracing = true
}


module "lambda_envelopes" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-envelopes"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-envelopes.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 15
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  xray_tracing   = true
}

module "lambda_documents" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-documents"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-documents.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 20
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  xray_tracing   = true
}

module "lambda_inputs" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-inputs"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-inputs.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 15
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  xray_tracing   = true
}

module "lambda_parties" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-parties"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-parties.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 15
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
  xray_tracing   = true
}

module "lambda_requests" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-requests"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-requests.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 20
  role_arn       = module.sign_lambda_role.role_arn
   environment_variables = local.lambda_env_common
  xray_tracing   = true
}

module "lambda_uploads" {
  source         = "../../modules/lambda"
  project_name   = var.project_name
  env            = var.env
  function_name  = "${var.project_name}-${local.service_name}-uploads"
  s3_bucket      = var.code_bucket
  s3_key         = "sign-uploads.zip"
  handler        = "index.handler"
  runtime        = "nodejs20.x"
  memory_size    = 1024
  timeout        = 20
  role_arn       = module.sign_lambda_role.role_arn
  environment_variables = local.lambda_env_common
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
    # CONSENTS
    # ----------------------------
    {
      route_key          = "POST /consents"
      integration_uri    = module.lambda_consent.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },

    # ----------------------------
    # ENVELOPES (binders)
    # ----------------------------
    { route_key = "GET /envelopes",                             integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes",                            integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    { route_key = "GET /envelopes/{envelopeId}",                integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "PATCH /envelopes/{envelopeId}",              integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /envelopes/{envelopeId}",             integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    { route_key = "GET /envelopes/{envelopeId}/status",         integration_uri = module.lambda_envelopes.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    { route_key = "GET /envelopes/{envelopeId}/parties",        integration_uri = module.lambda_parties.lambda_function_arn,    integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/parties",       integration_uri = module.lambda_parties.lambda_function_arn,    integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # List documents in an envelope
    { route_key = "GET /envelopes/{envelopeId}/documents",      integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # DOCUMENTS
    # ----------------------------
    # Create document within envelope
    { route_key = "POST /envelopes/{envelopeId}/documents",     integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # CRUD document
    { route_key = "GET /documents/{documentId}",                integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "PUT /documents/{documentId}",                integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "PATCH /documents/{documentId}",              integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /documents/{documentId}",             integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # Pages & locks
    { route_key = "GET /documents/{documentId}/pages/{pageId}", integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    { route_key = "POST /documents/{documentId}/locks",         integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "GET /documents/{documentId}/locks",          integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /locks/{lockId}",                      integration_uri = module.lambda_documents.lambda_function_arn,   integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # Document certificate (evidence package)
    { route_key = "GET /documents/{id}/certificate",            integration_uri = module.lambda_certificate.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # INPUTS
    # ----------------------------
    { route_key = "POST /documents/{documentId}/inputs",        integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "GET /documents/{documentId}/inputs",         integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    { route_key = "GET /inputs/{inputId}",                       integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "PATCH /inputs/{inputId}",                     integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /inputs/{inputId}",                    integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # Update input positions
    { route_key = "PATCH /inputs/{inputId}/positions",           integration_uri = module.lambda_inputs.lambda_function_arn,      integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # PARTIES (direct)
    # ----------------------------
    { route_key = "PATCH /parties/{partyId}",                    integration_uri = module.lambda_parties.lambda_function_arn,     integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "DELETE /parties/{partyId}",                   integration_uri = module.lambda_parties.lambda_function_arn,     integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # REQUESTS under envelope (invites, reminders, etc.)
    # ----------------------------
    { route_key = "POST /envelopes/{envelopeId}/requests/invitations",   integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/reminders",     integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/cancellations", integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/declines",      integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/finalisations", integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/signatures",    integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    { route_key = "POST /envelopes/{envelopeId}/requests/viewers",       integration_uri = module.lambda_requests.lambda_function_arn, integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # UPLOADS (evidence & user-signed PDFs)
    # ----------------------------
    # Presign/initiate evidence upload (SSE enforced via IAM conditions)
    { route_key = "POST /uploads/evidence",                      integration_uri = module.lambda_uploads.lambda_function_arn,     integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    # Complete multipart upload
    { route_key = "POST /uploads/evidence/complete",             integration_uri = module.lambda_uploads.lambda_function_arn,     integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },
    # Ingest a user-signed PDF (validate + attach to envelope/document)
    { route_key = "POST /documents/{documentId}/signed-upload",  integration_uri = module.lambda_uploads.lambda_function_arn,     integration_type = "AWS_PROXY", authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE" },

    # ----------------------------
    # LOW-LEVEL SIGN (KMS hash signature)
    # ----------------------------
    {
      route_key          = "POST /signatures"
      integration_uri    = module.lambda_sign.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    }
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
    consent     = module.lambda_consent.lambda_function_name
    sign        = module.lambda_sign.lambda_function_name
    certificate = module.lambda_certificate.lambda_function_name
    envelopes   = module.lambda_envelopes.lambda_function_name
    documents   = module.lambda_documents.lambda_function_name
    parties     = module.lambda_parties.lambda_function_name
    inputs      = module.lambda_inputs.lambda_function_name
    requests    = module.lambda_requests.lambda_function_name
    uploads     = module.lambda_uploads.lambda_function_name
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
  buildspec_path        = "../sign-service/buildspec.yml"

  compute_type          = var.compute_type
  environment_image     = var.environment_image
 environment_variables = local.codebuild_env_vars

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  branch                = var.github_branch

  tags = local.common_tags
}


module "ddb_signing_tokens" {
  source      = "../../modules/dynamodb"
  table_name  = "${var.project_name}-signing-tokens-${var.env}"
  hash_key    = "token"
  hash_key_type = "S"
  billing_mode  = "PAY_PER_REQUEST"
  stream_enabled = false

  ttl_enabled        = true
  ttl_attribute_name = "ttl"

  tags = local.tags
}

module "ddb_envelopes" {
  source          = "../../modules/dynamodb"
  table_name      = "${var.project_name}-sign-envelopes-${var.env}"
  hash_key        = "pk"
  hash_key_type   = "S"
  range_key       = "sk"
  range_key_type  = "S"

  billing_mode    = "PAY_PER_REQUEST"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  ttl_enabled        = true
  ttl_attribute_name = "ttl"

  tags = local.tags
}
