/**
 * @module Cognito User Pool with OIDC Identity Providers
 * @description
 * Creates a Cognito User Pool with:
 * - MFA support via SMS
 * - Hosted UI domain for OAuth flows
 * - Built-in RBAC groups
 * - Google and Azure OIDC identity providers
 * - Optional Apple OIDC provider
 * - App Client with OAuth configuration
 */

############################################
# Tenant info for Azure OIDC issuer discovery
############################################
data "azuread_client_config" "tenant" {}

############################################
# Optional: Apple private key from Secrets Manager
# Only retrieved if Apple IdP is enabled via variable
############################################
data "aws_secretsmanager_secret_version" "apple_key" {
  count     = var.apple_private_key_arn != "" ? 1 : 0
  secret_id = var.apple_private_key_arn
}

############################################
# Cognito User Pool
############################################
resource "aws_cognito_user_pool" "pool" {
  name              = "${var.project_name}-${var.env}-user-pool"
  mfa_configuration = "OPTIONAL"

  # SMS configuration for MFA (uses your dedicated SNS IAM role)
  sms_configuration {
    sns_caller_arn = var.sns_mfa_role_arn
    external_id    = var.project_name
  }

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

############################################
# Hosted UI Domain
# - Required for OAuth flows
# - Domain prefix must be unique per region/account
############################################
resource "aws_cognito_user_pool_domain" "domain" {
  domain       = "${var.project_name}-${var.env}"
  user_pool_id = aws_cognito_user_pool.pool.id
}

############################################
# User Groups (RBAC)
############################################
resource "aws_cognito_user_group" "superadmin" {
  name         = "SuperAdmin"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Full platform super-administrator"
}

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Platform administrator with elevated privileges"
}

resource "aws_cognito_user_group" "lawyer" {
  name         = "Lawyer"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Verified lawyer user"
}

resource "aws_cognito_user_group" "customer" {
  name         = "Customer"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "End-user customer"
}

############################################
# Identity Providers — OIDC
############################################

# Google OIDC Provider
resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.pool.id
  provider_name = "accounts.google.com"
  provider_type = "OIDC"

  provider_details = {
    client_id                 = var.google_client_id
    client_secret             = var.google_client_secret
    attributes_request_method = "GET"
    oidc_issuer               = "https://accounts.google.com"
    authorize_scopes          = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

# Azure OIDC Provider
resource "aws_cognito_identity_provider" "azure" {
  user_pool_id  = aws_cognito_user_pool.pool.id
  provider_name = "login.microsoftonline.com"
  provider_type = "OIDC"

  provider_details = {
    client_id                 = var.azure_client_id
    client_secret             = var.azure_client_secret
    attributes_request_method = "GET"
    oidc_issuer               = "https://login.microsoftonline.com/${data.azuread_client_config.tenant.tenant_id}/v2.0"
    authorize_scopes          = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

# Apple OIDC Provider (disabled by default)
# Uncomment when Apple client ID and key are configured
# resource "aws_cognito_identity_provider" "apple" {
#   count         = var.apple_client_id != "" ? 1 : 0
#   user_pool_id  = aws_cognito_user_pool.pool.id
#   provider_name = "SignInWithApple"
#   provider_type = "OIDC"
#
#   provider_details = {
#     client_id                 = var.apple_client_id
#     client_secret             = data.aws_secretsmanager_secret_version.apple_key[0].secret_string
#     attributes_request_method = "GET"
#     oidc_issuer               = "https://appleid.apple.com"
#     authorize_scopes          = "openid email"
#   }
#
#   attribute_mapping = {
#     email    = "email"
#     username = "sub"
#   }
# }

############################################
# App Client (after IdPs)
############################################
resource "aws_cognito_user_pool_client" "app_client" {
  name         = "${var.project_name}-${var.env}-app-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  # Enable OAuth for the client
  allowed_oauth_flows_user_pool_client = true

  generate_secret      = true
  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = [
    "openid",
    "email",
    "profile",
    "aws.cognito.signin.user.admin"
  ]

  # List of IdPs supported by this client
  supported_identity_providers = compact([
    "COGNITO",
    aws_cognito_identity_provider.google.provider_name,
    aws_cognito_identity_provider.azure.provider_name,
    # var.apple_client_id != "" ? aws_cognito_identity_provider.apple[0].provider_name : "",
  ])

  # Hosted UI redirect URLs
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # SRP + Refresh Token
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}
