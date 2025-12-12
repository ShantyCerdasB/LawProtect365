############################################################
# Tag all resources consistently
############################################################
/**
 * Common tags applied to all resources in this service.
 * Inherited from root variables for consistent tagging across the stack.
 */
locals {
  tags = var.tags
}

############################################################
# 1) Static assets bucket
############################################################
/**
 * S3 bucket for storing static frontend assets.
 * - Named using project and environment for uniqueness.
 * - Used as the origin for CloudFront.
 */
module "frontend_bucket" {
  source       = "../../modules/s3"
  bucket_name  = "${var.project_name}-frontend-${var.env}"
  project_name = var.project_name
  env          = var.env
  enable_acl   = true  # Enable ACL for CloudFront logging
}

############################################################
# 2) Route 53 & ACM & CloudFront & DNS
############################################################
/**
 * Route 53 hosted zone for DNS management.
 * Used to validate ACM certificates and create DNS records.
 */
module "route53_zone" {
  source           = "../../modules/route53-zone"
  cert_base_domain = var.cert_base_domain
  project_name     = var.project_name
  env              = var.env
}

/**
 * ACM certificate for the frontend domain.
 * Validates via DNS in the created hosted zone.
 */
module "acm" {
  source                    = "../../modules/acm"
  project_name              = var.project_name
  env                       = var.env
  domain_name               = "${var.cert_domain_name}.${var.cert_base_domain}"
  subject_alternative_names = []
  hosted_zone_id            = module.route53_zone.zone_id
}

/**
 * CloudFront distribution to serve frontend assets globally.
 * - Points to the S3 bucket as the origin.
 * - Uses the ACM certificate for HTTPS.
 * - Restricts direct bucket access for security.
 */
module "cloudfront" {
  source                 = "../../modules/cloudfront"
  bucket_name            = module.frontend_bucket.bucket_id
  project_name           = var.project_name
  env                    = var.env
  aliases                = [ module.acm.certificate_domain ]
  acm_certificate_arn    = module.acm.certificate_arn
  price_class            = var.price_class
  restrict_bucket_access = true
}

/**
 * Route 53 DNS record to point the frontend domain to CloudFront.
 */
module "dns_frontend" {
  source         = "../../modules/route53"
  hosted_zone_id = module.route53_zone.zone_id
  record_name    = var.cert_domain_name
  record_type    = "A"
  alias = {
    name                   = module.cloudfront.domain_name
    zone_id                = module.cloudfront.hosted_zone_id
    evaluate_target_health = false
  }
  project_name = var.project_name
  env          = var.env
}

############################################################
# 3) Build callback/logout URLs
############################################################
/**
 * Constructs the OAuth/OIDC callback and logout URLs
 * based on the CloudFront domain.
 */
locals {
  frontend_domain = module.cloudfront.domain_name
  callback_url    = "https://${local.frontend_domain}/callback"
  logout_url      = "https://${local.frontend_domain}/logout"
}

############################################################
# 4) Merge root-provided env vars + service-specific ones
############################################################
/**
 * Merges:
 *  - Environment variables passed from the root module
 *  - Frontend-specific environment variables for the deployment pipeline
 */
locals {
  merged_env_vars = concat(
    var.environment_variables,      # from root main.tf
    [
      { name = "FRONTEND_BUCKET",           value = module.frontend_bucket.bucket_id,   type = "PLAINTEXT" },
      { name = "CLOUDFRONT_DOMAIN",         value = module.cloudfront.domain_name,      type = "PLAINTEXT" },
      { name = "CLOUDFRONT_DISTRIBUTION_ID", value = module.cloudfront.distribution_id, type = "PLAINTEXT" },
      { name = "CALLBACK_URL",             value = local.callback_url,                 type = "PLAINTEXT" },
      { name = "LOGOUT_URL",               value = local.logout_url,                   type = "PLAINTEXT" }
    ]
  )
}

############################################################
# 5) Deployment pipeline (via generic deployment-service module)
############################################################
/**
 * Configures CI/CD pipeline for the frontend.
 * - Uses the deployment-service shared module.
 * - Builds from GitHub, uploads to S3, invalidates CloudFront cache.
 */
module "frontend_deployment" {
  source                        = "../deployment-service"

  project_name                  = var.project_name
  env                           = var.env
  service_name                  = var.service_name

  artifacts_bucket              = var.artifacts_bucket
  buildspec_path                = "apps/web/buildspec.yml"
  extra_s3_buckets              = [
    "arn:aws:s3:::${var.project_name}-frontend-${var.env}",
    "arn:aws:s3:::${var.project_name}-frontend-${var.env}/*"
  ]
  
  # GitHub connection
  github_connection_arn         = var.github_connection_arn

  compute_type                  = var.compute_type
  environment_image             = var.environment_image
  environment_variables         = local.merged_env_vars
  github_owner                  = var.github_owner
  github_repo                   = var.github_repo
  provider_type                 = var.provider_type

  tags                          = local.tags
}

############################################################
# 6) AWS Budgets (FinOps)
############################################################
/**
 * Creates a per-service AWS Budget for the frontend service.
 * - Tracks costs using AWS Budgets
 * - Sends alerts via SNS/email when thresholds are exceeded.
 * - Optionally creates a CloudWatch dashboard.
 */
module "frontend_budgets" {
  source = "../../modules/budgets"

  # Project identification
  project     = var.project_name
  environment = var.env
  common_tags = local.tags

  # Per-service budget configuration
  service_budgets = [
    {
      name         = "frontend-service"
      amount       = var.frontend_budget_amount
      cost_filters = { TagKeyValue = ["Service$frontend-service"] }
    }
  ]

  # Currency and alert thresholds
  budget_currency       = "USD"
  threshold_percentages = [80, 100, 120]
  create_sns_topic      = false
  existing_sns_topic_arn = var.existing_sns_topic_arn
  create_overall_budget  = false

  # Email recipients for budget alerts
  notify_emails = var.budget_notify_emails

  # Dashboard configuration
  create_dashboard   = true
  dashboard_services = ["frontend-service"]
  aws_region         = var.aws_region
}
