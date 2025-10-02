
############################################################
# documents-service — Main Module
# This service manages document templates, draft overlays, and finalized PDFs.
# It provisions S3 buckets, a DynamoDB table, IAM roles, and Lambda functions.
############################################################

locals {
  # Common tagging convention for resources
  common_tags = {
    Project = var.project_name
    Env     = var.env
    Owner   = "legal-platform-team"
  }

  # Service identifier
  service_name = "documents-service"

  # Combined tags for all resources in this service
  tags = merge(local.common_tags, {
    Service = local.service_name
  })
}

############################################################
# S3 Buckets
# - templates_bucket: stores document templates
# - documents_bucket: stores generated/finalized documents
# Encryption and bucket policies should be enforced within the S3 module.
############################################################
module "templates_bucket" {
  source       = "../../modules/s3"
  bucket_name  = var.templates_bucket_name
  project_name = var.project_name
  env          = var.env
}

module "documents_bucket" {
  source       = "../../modules/s3"
  bucket_name  = var.documents_bucket_name
  project_name = var.project_name
  env          = var.env
}

############################################################
# DynamoDB Table
# Implements a single-table design for storing documents and templates metadata.
############################################################
module "docs_table" {
  source          = "../../modules/dynamodb"
  table_name      = var.documents_table_name
  hash_key        = "PK"
  hash_key_type   = "S"
  range_key       = "SK"
  range_key_type  = "S"
  billing_mode    = "PAY_PER_REQUEST"
  stream_enabled  = false
  tags            = local.tags
}

############################################################
# IAM Role for Service Lambdas
# Inline policies are defined in data-policies.tf and merged with
# extra policies passed from the root module.
############################################################
module "documents_lambda_role" {
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
# Lambda: /templates
# - Manages CRUD and search operations for document templates.
# - Includes configuration for S3 templates bucket, documents bucket,
#   and DynamoDB table reference.
############################################################
module "lambda_templates" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-templates"
  s3_bucket     = var.code_bucket
  s3_key        = "documents-templates.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 15
  role_arn      = module.documents_lambda_role.role_arn

  environment_variables = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL            = "info"
      SERVICE_NAME         = local.service_name
      ENV                  = var.env
      PROJECT_NAME         = var.project_name
      TEMPLATES_BUCKET     = module.templates_bucket.bucket_id
      DOCUMENTS_BUCKET     = module.documents_bucket.bucket_id
      DOCS_TABLE           = module.docs_table.table_name
      DEFAULT_LOCALE       = var.default_locale
      SUPPORTED_LOCALES    = jsonencode(var.supported_locales)
      TEMPLATES_ENCRYPTION = var.templates_encryption
      TEMPLATES_KMS_KEY_ARN = try(var.templates_kms_key_arn, "")
    }
  )

  xray_tracing = true
}

############################################################
# Lambda: /drafts
# - Handles creation and updating of document drafts.
# - Configured with S3 templates bucket, documents bucket, and DynamoDB table.
############################################################
module "lambda_drafts" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-drafts"
  s3_bucket     = var.code_bucket
  s3_key        = "documents-drafts.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 15
  role_arn      = module.documents_lambda_role.role_arn

  environment_variables = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL         = "info"
      SERVICE_NAME      = local.service_name
      ENV               = var.env
      PROJECT_NAME      = var.project_name
      TEMPLATES_BUCKET  = module.templates_bucket.bucket_id
      DOCUMENTS_BUCKET  = module.documents_bucket.bucket_id
      DOCS_TABLE        = module.docs_table.table_name
      DEFAULT_LOCALE    = var.default_locale
      SUPPORTED_LOCALES = jsonencode(var.supported_locales)
    }
  )

  xray_tracing = true
}

############################################################
# Lambda: /finalize
# - Handles finalizing a document by composing PDFs, storing
#   them in S3, and calculating file checksums (e.g., SHA-256).
# - Configured with encryption options for document storage.
############################################################
module "lambda_finalize" {
  source       = "../../modules/lambda"
  project_name = var.project_name
  env          = var.env

  function_name = "${var.project_name}-${local.service_name}-finalize"
  s3_bucket     = var.code_bucket
  s3_key        = "documents-finalize.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 30
  role_arn      = module.documents_lambda_role.role_arn

  environment_variables = merge(
    var.shared_lambda_env,
    {
      LOG_LEVEL             = "info"
      SERVICE_NAME          = local.service_name
      ENV                   = var.env
      PROJECT_NAME          = var.project_name

      TEMPLATES_BUCKET      = module.templates_bucket.bucket_id
      DOCUMENTS_BUCKET      = module.documents_bucket.bucket_id
      DOCS_TABLE            = module.docs_table.table_name

      DOCUMENTS_ENCRYPTION  = var.documents_encryption
      DOCUMENTS_KMS_KEY_ARN = try(var.documents_kms_key_arn, "")

      FINALIZE_TIMEOUT_MS   = tostring(var.finalize_timeout_ms)
      MAX_UPLOAD_MB         = tostring(var.max_upload_mb)
    }
  )

  xray_tracing = true
}

############################################################
# API Gateway (HTTP API v2) for Documents Service
# - Provides endpoints for templates, drafts, and documents.
# - Integrates with JWT authorizer when enabled.
# - Configured with CORS, WAF, and CloudWatch access logs.
############################################################
module "documents_api" {
  source        = "../../modules/api-gateway-http"
  api_name      = "${var.project_name}-documents-${var.env}"
  description   = "Documents HTTP API"
  protocol_type = "HTTP"
  stage_name    = var.env
  access_log_format = var.access_log_format
  
  enable_jwt_authorizer = var.enable_jwt_authorizer
  jwt_issuer            = var.jwt_issuer
  jwt_audiences         = var.jwt_audiences

  cors = {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "OPTIONS"]
    allow_headers     = ["*"]
    allow_credentials = false
    expose_headers    = []
    max_age           = 0
  }

  enable_access_logs    = true
  access_log_group_name = "/aws/apigateway/${var.project_name}-documents-${var.env}"
  log_retention_in_days = 30
  kms_key_arn           = var.logs_kms_key_arn

  attach_waf_web_acl = var.attach_waf_web_acl
  waf_web_acl_arn    = var.waf_web_acl_arn

  routes = [
    {
      route_key          = "GET /templates"
      integration_uri    = module.lambda_templates.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "POST /templates"
      integration_uri    = module.lambda_templates.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "GET /templates/{id}"
      integration_uri    = module.lambda_templates.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "POST /templates/{id}/publish"
      integration_uri    = module.lambda_templates.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "POST /drafts"
      integration_uri    = module.lambda_drafts.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "PUT /drafts/{id}"
      integration_uri    = module.lambda_drafts.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "POST /drafts/{id}/finalize"
      integration_uri    = module.lambda_finalize.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    },
    {
      route_key          = "GET /documents/{id}"
      integration_uri    = module.lambda_drafts.lambda_function_arn
      integration_type   = "AWS_PROXY"
      authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
    }
  ]

  tags = local.tags
}

############################################################
# SNS Alerts for Documents Service
# - Used for sending operational or error notifications.
# - Subscriptions configured via email in JSON format.
############################################################
module "documents_alerts_sns" {
  source     = "../../modules/sns"
  topic_name = "${var.project_name}-documents-alerts-${var.env}"

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

############################################################
# CloudWatch Monitoring for Documents Service
# - Creates alarms for Lambda errors, API Gateway 5xx, and latency.
# - Generates a CloudWatch dashboard.
############################################################
module "cloudwatch_documents" {
  source       = "../../modules/cloudwatch"
  service_name = local.service_name
  env          = var.env
  tags         = local.tags

  lambda_function_names_map = {
    templates = module.lambda_templates.lambda_function_name
    drafts    = module.lambda_drafts.lambda_function_name
    finalize  = module.lambda_finalize.lambda_function_name
  }

  create_apigw_log_group = false
  apigw_log_group_name   = module.documents_api.access_log_group_name

  apigw_api_id = module.documents_api.api_id
  apigw_stage  = module.documents_api.stage_name

  lambda_error_threshold         = 1
  apigw_5xx_threshold            = 1
  apigw_latency_p99_threshold_ms = 1500

  alarm_sns_topic_arn = module.documents_alerts_sns.topic_arn
  ok_sns_topic_arn    = module.documents_alerts_sns.topic_arn

  create_dashboard = true
}
############################################################
# Budgets (FinOps)
# - Tracks and alerts on monthly spend for the documents service.
# - Uses centralized budgets module with per-service filtering.
############################################################
module "documents_budgets" {
  source      = "../../modules/budgets"
  project     = var.project_name
  environment = var.env
  common_tags = local.tags

  service_budgets = [{
    name         = local.service_name
    amount       = var.documents_budget_amount
    cost_filters = { TagKeyValue = ["Service$${local.service_name}"] }
  }]

  budget_currency        = "USD"
  threshold_percentages  = var.threshold_percentages
  existing_sns_topic_arn = var.existing_sns_topic_arn
  notify_emails          = var.budget_notify_emails

  create_dashboard       = true
  create_sns_topic       = false
  create_overall_budget  = false
  dashboard_services     = [local.service_name]
  
  aws_region             = var.aws_region
}

############################################################
# CI/CD (CodePipeline + CodeBuild wrapper)
# - Uses deployment-service module to build and deploy
#   the documents-service from GitHub.
# - Passes build-time environment variables only.
# - Runtime secrets are injected via shared_lambda_env.
############################################################
locals {
  merged_env_vars = concat(
    var.environment_variables,
    [
      # Core service resources
      { name = "TEMPLATES_BUCKET",     value = module.templates_bucket.bucket_id,  type = "PLAINTEXT" },
      { name = "DOCUMENTS_BUCKET",     value = module.documents_bucket.bucket_id,  type = "PLAINTEXT" },
      { name = "DOCS_TABLE",           value = module.docs_table.table_name,       type = "PLAINTEXT" },

      # Localization settings
      { name = "DEFAULT_LOCALE",       value = var.default_locale,                 type = "PLAINTEXT" },
      { name = "SUPPORTED_LOCALES",    value = jsonencode(var.supported_locales),  type = "PLAINTEXT" },

      # Encryption settings
      { name = "TEMPLATES_ENCRYPTION", value = var.templates_encryption,           type = "PLAINTEXT" },
      { name = "TEMPLATES_KMS_KEY_ARN",value = try(var.templates_kms_key_arn, ""), type = "PLAINTEXT" },
      { name = "DOCUMENTS_ENCRYPTION", value = var.documents_encryption,           type = "PLAINTEXT" },
      { name = "DOCUMENTS_KMS_KEY_ARN",value = try(var.documents_kms_key_arn, ""), type = "PLAINTEXT" },

      # API references
      { name = "DOCS_API_ID",          value = module.documents_api.api_id,        type = "PLAINTEXT" },
      { name = "DOCS_API_ENDPOINT",    value = module.documents_api.api_endpoint,  type = "PLAINTEXT" },

      # Service metadata
      { name = "SERVICE_NAME",         value = "documents",                        type = "PLAINTEXT" },
      { name = "ENV",                  value = var.env,                            type = "PLAINTEXT" },
      { name = "PROJECT_NAME",         value = var.project_name,                   type = "PLAINTEXT" }
    ]
  )
}

module "documents_deployment" {
  source = "../deployment-service"

  project_name          = var.project_name
  env                   = var.env
  service_name          = "documents"

  artifacts_bucket      = var.artifacts_bucket
  buildspec_path        = "../document-service/buildspec.yml"

  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = local.merged_env_vars

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  branch                = var.github_branch
  
  # GitHub connection
  github_connection_arn = var.github_connection_arn

  tags                  = local.common_tags
}
