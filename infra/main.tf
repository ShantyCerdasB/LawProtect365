# Common tags applied to all resources
locals {
  common_tags = {
    Project = var.project_name
    Env     = var.env
    Owner   = "legal-platform-team"
  }
}

# Identity/region data sources
data "aws_caller_identity" "current" {}


# Set up networking: VPC, subnets, and security groups
module "networking" {
  source               = "./modules/networking"
  project_name         = var.project_name
  env                  = var.env
  vpc_cidr             = "10.0.0.0/16"
  azs                  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  region               = var.region
  tags                 = local.common_tags
}

# Provision Aurora Serverless PostgreSQL cluster in the shared network
/*module "core_db" {
  source                 = "./modules/aurora-serverless"
  cluster_identifier     = "${var.project_name}-core-db-${var.env}"
  database_name          = "core"
  master_username        = var.db_master_username
  master_password        = var.db_master_password
  vpc_security_group_ids = [module.networking.rds_security_group_id]
  subnet_ids             = module.networking.private_subnet_ids
  tags                   = local.common_tags
  engine_version         = var.db_engine_version
}*/

# Fetch current public IPv4 from external service
data "http" "my_ip" {
  url = "https://checkip.amazonaws.com"
}

# Format as CIDR (/32 for single IP)
locals {
  my_ip_cidr = "${trim(data.http.my_ip.response_body, " \n\r\t")}/32"
}

module "core_db" {
  source                 = "./modules/rds-postgres"
  instance_identifier    = "${var.project_name}-core-db-${var.env}"
  database_name          = "lawprotectDB${var.env}"
  master_username        = var.db_master_username
  master_password        = var.db_master_password
  vpc_id                 = module.networking.vpc_id
  subnet_ids             = module.networking.private_subnet_ids
  tags                   = local.common_tags
  engine_version         = var.db_engine_version
  publicly_accessible    = true
   allowed_ips            = [local.my_ip_cidr] 
}


# IAM role for Lambda execution with basic execution and DynamoDB access
module "lambda_exec_role" {
  source              = "./modules/iam-role"
  role_name           = "${var.project_name}-lambda-exec-${var.env}"
  assume_role_policy  = data.aws_iam_policy_document.lambda_assume.json
  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
  inline_policies     = {
    "dynamodb-access" = jsonencode({
      Version   = "2012-10-17"
      Statement = [{ Action = ["dynamodb:*"], Effect = "Allow", Resource = "*" }]
    })
  }
  project_name = var.project_name
  env          = var.env
}

# Admin role for Observability KMS
module "observability_admin_role" {
  source             = "./modules/iam-role"
  role_name          = "${var.project_name}-observability-admin-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.admin_assume.json

managed_policy_arns = [
  "arn:aws:iam::aws:policy/AWSKeyManagementServicePowerUser",   # KMS admin
  "arn:aws:iam::aws:policy/CloudWatchFullAccess",               # CloudWatch admin
  "arn:aws:iam::aws:policy/AmazonSNSFullAccess"                 # SNS admin
]

  project_name = var.project_name
  env          = var.env
}

# S3 bucket for storing Lambda code artifacts
module "code_bucket" {
  source       = "./modules/s3"
  bucket_name  = var.code_bucket
  project_name = var.project_name
  env          = var.env
}

# KMS key to encrypt CodeArtifact repositories


module "kms_factory" {
  source      = "./modules/kms-factory"
  project_name = var.project_name
  env          = var.env
  signing_key_spec = var.signing_key_spec

  # Pásalo desde los data sources que ya tienes definidos en root
  account_id = data.aws_caller_identity.current.account_id
  region     = var.region

  # Opcional: quién administra/usa las CMKs
  admin_role_arns = [ module.observability_admin_role.role_arn ]
  

  # Tags comunes
  tags = local.common_tags
}


# CodeArtifact repository for caching npm, PyPI, and Maven packages
module "codeartifact" {
  source               = "./modules/codeartifact"
  domain_name          = "${var.project_name}-domain"
  repository_name      = "${var.project_name}-shared-packages"
  encryption_key_arn   = module.kms_factory.artifact_kms_key_arn
  upstream_connections = [
    "public:npmjs",
    "public:pypi",
    "public:maven-central"
  ]
  package_formats = [
    "npm",
    "pypi",
    "maven",
    "nuget"
  ]
  tags = local.common_tags
}

# Lambda layer for shared-ts dependencies
module "shared_ts_layer" {
  source       = "./modules/lambda-layer"
  project_name = var.project_name
  env          = var.env
  
  layer_name   = "${var.project_name}-shared-ts-layer"
  s3_bucket    = var.code_bucket
  s3_key       = "shared-ts-layer.zip"
  
  description  = "Shared TypeScript utilities for all microservices"
  compatible_runtimes = ["nodejs20.x"]
}


# Authentication service configuration using OIDC, Lambda, and MFA via SNS
module "auth_service" {
  source                     = "./services/auth-service"
  aws_region = var.region
  project_name               = var.project_name
  env                        = var.env
  code_bucket                = module.code_bucket.bucket_id
  shared_ts_layer_arn        = module.shared_ts_layer.layer_arn
  lambda_exec_role_arn       = module.lambda_exec_role.role_arn
  apple_client_id            = var.apple_client_id
  callback_url               = module.frontend.callback_url
  logout_url                 = module.frontend.logout_url
  logs_kms_key_arn           = module.kms_factory.observability_kms_key_arn
  alerts_emails              = var.alerts_emails
  access_log_format          = var.access_logs_format
  existing_sns_topic_arn = aws_sns_topic.budgets_alerts.arn
  # Share platform eventing and outbox resources (same as signature-service)
  event_bus_name             = module.events.eventbridge_bus_name
  outbox_table_name          = module.event_publisher_service.outbox_table_name
  
  # GitHub connection
  github_connection_arn = module.github_connection.connection_arn
  networking = {
    private_subnet_ids       = module.networking.private_subnet_ids
    lambda_security_group_id = module.networking.lambda_security_group_id
    rds_security_group_id    = module.networking.rds_security_group_id
  }
  gcp_project_id = var.gcp_project_id
  gcp_region     = var.gcp_region
  google_client_id =  var.google_client_id
  google_client_secret =   var.google_client_secret
  auth_budget_amount = var.auth_budget_amount
  threshold_percentages = var.threshold_percentages
  budget_notify_emails = var.budget_notify_emails
  artifacts_bucket = module.code_bucket.bucket_id
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
  ]
  environment_image = "aws/codebuild/standard:7.0"
  compute_type     = "BUILD_GENERAL1_SMALL"
  github_branch    = var.branch
  github_owner     = var.github_owner
  github_repo      = var.github_repo
  provider_type    = var.provider_type
  shared_lambda_env = {
    DB_SECRET_ARN = module.db_secret.secret_arn
  }
  extra_inline_policies = {
    "secrets-db-read" = data.aws_iam_policy_document.db_secret_read.json

  }
  depends_on = [ module.kms_factory]
}

module "frontend" {
  source           = "./services/frontend-service"
  project_name     = var.project_name
  env              = var.env
  tags             = local.common_tags
  cert_base_domain = var.cert_base_domain
  cert_domain_name = var.cert_domain_name
  aws_region = var.region
  price_class      = var.price_class
  artifacts_bucket = module.code_bucket.bucket_id
  compute_type     = "BUILD_GENERAL1_SMALL"
  
  # GitHub connection
  github_connection_arn = module.github_connection.connection_arn
  environment_image = "aws/codebuild/standard:7.0"
  existing_sns_topic_arn = aws_sns_topic.budgets_alerts.arn
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
  ]
  github_owner     = var.github_owner
  github_repo      = var.github_repo
  provider_type    = var.provider_type
  branch           = var.branch
  service_name     = "frontend"
  budget_notify_emails = var.budget_notify_emails
  frontend_budget_amount = var.frontend_budget_amount

}

resource "aws_sns_topic" "budgets_alerts" {
  name              = "${var.project_name}-${var.env}-budget-alerts"
  kms_master_key_id = module.kms_factory.observability_kms_key_arn
  tags              = local.common_tags
}

module "cloudwatch_budgets" {
  source      = "./modules/budgets"
  project     = var.project_name
  environment = var.env
  common_tags = local.common_tags

  create_overall_budget = true
  overall_budget_amount = var.overall_budget_amount
  overall_cost_filters  = { TagKeyValue = ["Environment$${var.env}"] }

  # Do not define service-level budgets here

  threshold_percentages = var.threshold_percentages
  notify_emails         = var.budget_notify_emails
  create_sns_topic      = false
  existing_sns_topic_arn = aws_sns_topic.budgets_alerts.arn

  # Add the services exported by each module, plus any extra ones you want manually
  dashboard_services = distinct(compact(concat(
    try(module.frontend.budget_dashboard_services, []),
    try(module.documents_service.budget_dashboard_services, []),
    try(module.sign_service.budget_dashboard_services, []),
    try(module.notifications_service.notifications_budgets_dashboard_name != null ? ["notifications-service"] : [], [])
  )))
}

############################################
# KMS CMKs (root) — Best practice: governed in root
############################################



############################################
# documents_service — with SSE-KMS + JWT authorizer
############################################

module "documents_service" {
  source       = "./services/documents-service"
  project_name = var.project_name
  env          = var.env
   aws_region = var.region

  # Resource names created inside the service
  templates_bucket_name = "${var.project_name}-templates-${var.env}"
  documents_bucket_name = "${var.project_name}-documents-${var.env}"
  documents_table_name  = "${var.project_name}-documents-${var.env}"
  budgets_alerts_topic_arn = aws_sns_topic.budgets_alerts.arn
  
  # GitHub connection
  github_connection_arn = module.github_connection.connection_arn

  # Enforce SSE-KMS with root CMKs
  templates_encryption  = "SSE_KMS"
  templates_kms_key_arn = module.kms_factory.templates_kms_key_arn
  documents_encryption  = "SSE_KMS"
  documents_kms_key_arn = module.kms_factory.documents_kms_key_arn
  lambda_assume_role_policy = data.aws_iam_policy_document.lambda_assume.json

  # API logs / WAF / alerts
  access_log_format = var.access_logs_format
  logs_kms_key_arn  = module.kms_factory.observability_kms_key_arn
  attach_waf_web_acl = var.attach_waf_web_acl
  waf_web_acl_arn    = var.waf_web_acl_arn
  alerts_emails      = var.alerts_emails

  # JWT authorizer (Cognito)
  enable_jwt_authorizer = true
  jwt_issuer            = "https://cognito-idp.${var.region}.amazonaws.com/${module.auth_service.cognito_user_pool_id}"
  jwt_audiences         = [module.auth_service.cognito_user_pool_client_id]

  # CI/CD
  code_bucket        = module.code_bucket.bucket_id
  artifacts_bucket   = module.code_bucket.bucket_id
  compute_type       = "BUILD_GENERAL1_SMALL"
  environment_image  = "aws/codebuild/standard:6.0"
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
  ]
  github_owner  = var.github_owner
  github_repo   = var.github_repo
  provider_type = var.provider_type
  github_branch = var.branch

  # FinOps
  documents_budget_amount = var.documents_budget_amount
  threshold_percentages   = var.threshold_percentages
  budget_notify_emails    = var.budget_notify_emails

   shared_lambda_env = {
    DB_SECRET_ARN = module.db_secret.secret_arn
  }
  extra_inline_policies = {
    "secrets-db-read" = data.aws_iam_policy_document.db_secret_read.json,

  }

  depends_on = [ module.auth_service ]
}

############################################
# sign_service — SSE-KMS on evidence + JWT authorizer
############################################


module "events" {
  source       = "./modules/eventbridge"
  project_name = var.project_name
  env          = var.env
  common_tags  = local.common_tags

  create_rule   = true
  create_target = true

  event_pattern = jsonencode({
    "source"      = ["sign.service"]
    "detail-type" = [
      "ENVELOPE_INVITATION",
      "DOCUMENT_VIEW_INVITATION", 
      "SIGNER_DECLINED",
      "ENVELOPE_CANCELLED",
      "REMINDER_NOTIFICATION"
    ]
  })

  # Target: Lambda de notificaciones cambiar luego
  target_arn  = module.documents_service.documents_lambda_templates_arn
  target_type = "lambda"
}

module "sign_service" {
  source       = "./services/signature-service"
  project_name = var.project_name
  env          = var.env
  aws_region   = var.region
  aws_caller   = data.aws_caller_identity.current

  # Code artifacts
  code_bucket = module.code_bucket.bucket_id

  # Wire to documents_service bucket
  documents_bucket_name = module.documents_service.documents_bucket_id

  # Evidence bucket (created by the service) with SSE-KMS via root CMK
  evidence_bucket_name = "${var.project_name}-sign-evidence-${var.env}"
  evidence_encryption  = "SSE_KMS"
  evidence_kms_key_arn = module.kms_factory.evidence_kms_key_arn
  lambda_assume_role_policy = data.aws_iam_policy_document.lambda_assume.json

  # Observability / WAF / alerts
  logs_kms_key_arn   = module.kms_factory.observability_kms_key_arn
  alerts_emails      = var.alerts_emails
  access_log_format  = var.access_logs_format
  attach_waf_web_acl = var.attach_waf_web_acl
  waf_web_acl_arn    = var.waf_web_acl_arn
  budgets_alerts_topic_arn = aws_sns_topic.budgets_alerts.arn
  event_bus_arn = module.events.eventbridge_bus_arn
  outbox_table_name = module.event_publisher_service.outbox_table_name
  shared_ts_layer_arn = module.shared_ts_layer.layer_arn
  outbox_publisher_policy = data.aws_iam_policy_document.outbox_publisher.json
  eventbridge_publisher_policy = data.aws_iam_policy_document.eventbridge_publisher.json

  # Database configuration
  db_max_connections = var.db_max_connections
  db_connection_timeout = var.db_connection_timeout

  # KMS configuration
  kms_signing_algorithm = var.kms_signing_algorithm

  # Document download configuration
  document_download_default_expiration_seconds = var.document_download_default_expiration_seconds
  document_download_max_expiration_seconds = var.document_download_max_expiration_seconds
  document_download_min_expiration_seconds = var.document_download_min_expiration_seconds

  # Reminders configuration
  max_reminders_per_signer = var.max_reminders_per_signer
  min_hours_between_reminders = var.min_hours_between_reminders
  first_reminder_hours = var.first_reminder_hours
  second_reminder_hours = var.second_reminder_hours
  third_reminder_hours = var.third_reminder_hours

  # GitHub connection
  github_connection_arn = module.github_connection.connection_arn

  # JWT authorizer (Cognito)
  enable_jwt_authorizer = true
  jwt_issuer            = "https://cognito-idp.${var.region}.amazonaws.com/${module.auth_service.cognito_user_pool_id}"
  jwt_audiences         = [module.auth_service.cognito_user_pool_client_id]

  # FinOps
  sign_budget_amount    = var.generic_service_budget_amount
  threshold_percentages = var.threshold_percentages
  budget_notify_emails  = var.budget_notify_emails

  # CI/CD
  artifacts_bucket      = module.code_bucket.bucket_id
  environment_image     = "aws/codebuild/standard:7.0"
  compute_type          = "BUILD_GENERAL1_SMALL"
  github_owner          = var.github_owner
  github_repo           = var.github_repo
  provider_type         = var.provider_type
  github_branch         = var.branch
  kms_sign_key_arn      = module.kms_factory.signing_kms_key_arn
  shared_lambda_env = {
    DB_SECRET_ARN = module.db_secret.secret_arn
  }
  extra_inline_policies = {
    "secrets-db-read" = data.aws_iam_policy_document.db_secret_read.json

  }
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
  ]

    depends_on = [ module.auth_service ]
}

############################################
# notifications_service — EventBridge consumer for notifications
############################################

# Calculate SES hosted zone ID: use provided value, or fallback to frontend's hosted zone if domain identity is configured
locals {
  ses_hosted_zone_id_final = var.ses_hosted_zone_id != null ? var.ses_hosted_zone_id : (var.ses_domain_name != null && var.create_ses_identity ? module.frontend.hosted_zone_id : null)
}

module "notifications_service" {
  source       = "./services/notifications-service"
  project_name = var.project_name
  env          = var.env
  aws_region   = var.region

  code_bucket        = module.code_bucket.bucket_id
  artifacts_bucket   = module.code_bucket.bucket_id
  shared_ts_layer_arn = module.shared_ts_layer.layer_arn
  lambda_assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  db_secret_read_policy = data.aws_iam_policy_document.db_secret_read.json

  event_bus_name     = module.events.eventbridge_bus_name
  logs_kms_key_arn   = module.kms_factory.observability_kms_key_arn
  alerts_emails      = var.alerts_emails
  existing_sns_topic_arn = aws_sns_topic.budgets_alerts.arn

  notifications_budget_amount = var.notifications_budget_amount
  threshold_percentages       = var.threshold_percentages
  budget_notify_emails        = var.budget_notify_emails

  github_connection_arn = module.github_connection.connection_arn
  github_owner          = var.github_owner
  github_repo          = var.github_repo
  provider_type        = var.provider_type
  compute_type         = var.compute_type
  environment_image    = var.environment_image

  db_max_connections    = var.db_max_connections
  db_connection_timeout = var.db_connection_timeout

  ses_from_email        = var.ses_from_email
  ses_reply_to_email    = var.ses_reply_to_email
  ses_configuration_set = var.ses_configuration_set
  ses_domain_name       = var.ses_domain_name
  ses_hosted_zone_id    = local.ses_hosted_zone_id_final
  create_ses_identity   = var.create_ses_identity

  pinpoint_application_id = var.pinpoint_application_id
  pinpoint_sender_id      = var.pinpoint_sender_id
  create_pinpoint_app     = var.create_pinpoint_app

  fcm_service_account_key = var.fcm_service_account_key
  fcm_project_id          = var.fcm_project_id
  fcm_secret_arn          = var.fcm_secret_arn

  apns_key_id     = var.apns_key_id
  apns_team_id    = var.apns_team_id
  apns_key        = var.apns_key
  apns_bundle_id  = var.apns_bundle_id
  apns_production = var.apns_production
  apns_secret_arn = var.apns_secret_arn

  enable_email = var.enable_email_notifications
  enable_sms   = var.enable_sms_notifications
  enable_push  = var.enable_push_notifications

  shared_lambda_env = {
    DB_SECRET_ARN = module.db_secret.secret_arn
  }

  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
  ]

  depends_on = [module.events, module.db_secret]
}

module "db_secret" {
  source        = "./modules/secretmanager"
  secret_name   = "${var.project_name}/database-${var.env}"
  secret_string = jsonencode({
    engine   = "postgresql"
    host     = module.core_db.endpoint
    port     = module.core_db.port
    database = "core"
    username = var.db_master_username
    password = var.db_master_password

    # Prisma usa env("DATABASE_URL")
    DATABASE_URL = "postgresql://${var.db_master_username}:${var.db_master_password}@${module.core_db.endpoint}:${module.core_db.port}/core?schema=public"
  })

  project_name = var.project_name
  env          = var.env
}

# Event Publisher Service
module "event_publisher_service" {
  source = "./services/event-publisher-service"
  
  project_name    = var.project_name
  env             = var.env
  region          = var.region
  code_bucket     = var.code_bucket
  event_bus_name  = module.events.eventbridge_bus_name
  db_secret_arn   = module.db_secret.secret_arn
  tags            = local.common_tags
}

/** 
 * @module xray
 * @description 
 * Provisions AWS X-Ray observability components for distributed tracing 
 * with environment-specific sampling rules and encryption settings.
 * 
 * @remarks
 * - Encrypts traces with a customer-managed CMK (KMS) from the observability stack, 
 *   or falls back to AWS-managed encryption if no KMS key is provided.
 * - Creates a global X-Ray group to capture all services (`service("*")` filter).
 * - Configures environment-specific sampling:
 *   - **DEV:** High sampling rate for detailed tracing at low traffic cost.
 *   - **PROD:** Conservative sampling for cost efficiency.
 * - Sampling rule is focused on AWS Lambda service type.
 * 
 * @param project_name   Project identifier used in resource naming and tagging.
 * @param env            Deployment environment (e.g., `dev`, `prod`).
 * @param common_tags    Map of tags applied to all resources.
 * @param kms_key_arn    ARN of the KMS CMK for encryption. Empty string for AWS-managed key.
 * @param group_filter   X-Ray group filter expression (default: capture all services).
 * @param rule_priority  Sampling rule priority (lower number = higher precedence).
 * @param rule_reservoir_size Fixed quota of traces per second before applying the fixed rate.
 * @param rule_fixed_rate Probability (0.0 - 1.0) of sampling a trace after quota is met.
 * @param rule_service_type AWS resource type for filtering traces (e.g., `AWS::Lambda`).
 * @param rule_host      Host filter for sampling rule (`*` for any).
 * @param rule_http_method HTTP method filter (`*` for any).
 * @param rule_resource_arn Resource ARN filter (`*` for any).
 * @param rule_service_name Service name filter (`*` for any).
 * @param rule_url_path  URL path filter (`*` for any).
 */
module "xray" {
  source       = "./modules/x-ray"
  project_name = var.project_name
  env          = var.env
  common_tags  = local.common_tags

  # Encryption: use observability CMK, or "" for AWS-managed key
  kms_key_arn  = module.kms_factory.observability_kms_key_arn

  # Global group filter
  group_filter = "service(\"*\")"

  # Sampling configuration (env-specific best practices)
  rule_priority       = 100
  rule_reservoir_size = var.env == "prod" ? 1   : 5
  rule_fixed_rate     = var.env == "prod" ? 0.05: 1.0

  # Lambda-focused sampling
  rule_service_type = "AWS::Lambda"

  # Wildcard filters
  rule_host         = "*"
  rule_http_method  = "*"
  rule_resource_arn = "*"
  rule_service_name = "*"
  rule_url_path     = "*"
}

# Shared GitHub Connection (created once, used by all services)
module "github_connection" {
  source        = "./modules/github"
  project_name  = var.project_name
  github_owner  = var.github_owner
  github_repo   = var.github_repo
  github_branch = var.github_branch
  provider_type = var.provider_type
  tags          = local.common_tags
  account_id    = data.aws_caller_identity.current.account_id
  region        = var.region
  env           = var.env
}

# Shared Components Pipeline (shared-ts layer + outbox handler)
module "shared_components_pipeline" {
  source = "./services/deployment-service"
  
  project_name          = var.project_name
  env                   = var.env
  service_name          = "shared-components"
  artifacts_bucket      = module.code_bucket.bucket_id
  buildspec_path        = "buildspec.yml"  # Root buildspec
  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
    {
      name  = "PROJECT_NAME"
      value = var.project_name
      type  = "PLAINTEXT"
    },
    {
      name  = "PROJECT_DOMAIN"
      value = "${var.project_name}-domain"
      type  = "PLAINTEXT"
    },
    {
      name  = "DATABASE_URL"
      value = "${module.db_secret.secret_arn}:DATABASE_URL"
      type  = "SECRETS_MANAGER"
    },
    {
      name  = "CODE_BUCKET"
      value = module.code_bucket.bucket_id
      type  = "PLAINTEXT"
    },
    {
      name  = "OUTBOX_FUNCTION_NAME"
      value = module.event_publisher_service.lambda_function_name
      type  = "PLAINTEXT"
    },
    {
      name  = "OUTBOX_ALIAS_NAME"
      value = module.event_publisher_service.lambda_alias_name
      type  = "PLAINTEXT"
    },
    {
      name  = "SHARED_TS_LAYER_ARN"
      value = module.shared_ts_layer.layer_arn
      type  = "PLAINTEXT"
    },
  ]
  
  github_connection_arn = module.github_connection.connection_arn
  github_owner         = var.github_owner
  github_repo          = var.github_repo
  provider_type        = var.provider_type
  branch               = var.github_branch
  
  tags = local.common_tags
}

# Frontend Core Pipeline (frontend-core package publish to CodeArtifact)
module "frontend_core_pipeline" {
  source = "./services/deployment-service"
  
  project_name          = var.project_name
  env                   = var.env
  service_name          = "frontend-core"
  artifacts_bucket      = module.code_bucket.bucket_id
  buildspec_path        = "packages/frontend-core/buildspec.yml"
  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = [
    {
      name  = "CODEARTIFACT_REPO_ENDPOINTS"
      value = jsonencode(module.codeartifact.artifact_repository_endpoints)
      type  = "PLAINTEXT"
    },
    {
      name  = "PROJECT_NAME"
      value = var.project_name
      type  = "PLAINTEXT"
    },
    {
      name  = "PROJECT_DOMAIN"
      value = "${var.project_name}-domain"
      type  = "PLAINTEXT"
    },
    {
      name  = "CODE_BUCKET"
      value = module.code_bucket.bucket_id
      type  = "PLAINTEXT"
    },
  ]
  
  github_connection_arn = module.github_connection.connection_arn
  github_owner         = var.github_owner
  github_repo          = var.github_repo
  provider_type        = var.provider_type
  branch               = var.github_branch
  
  tags = local.common_tags
}