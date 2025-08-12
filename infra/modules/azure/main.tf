/**
 * @file Provisions an Azure AD application registration, service principal, and client secret.
 */

########################################
# Azure AD Application Registration
########################################

/**
 * @resource azuread_application.app
 * Creates an Azure AD application registration with specified redirect URIs.
 *
 * @param display_name  The display name of the Azure AD application.
 * @param web.redirect_uris List of redirect URIs for web authentication flows.
 * @param tags          Custom metadata tags for project, environment, and management source.
 */
resource "azuread_application" "app" {
  display_name = var.display_name

  web {
    redirect_uris = var.redirect_uris
  }

  tags = [
    "Project:${var.project_name}",
    "Env:${var.env}",
    "ManagedBy:Terraform"
  ]
}

########################################
# Azure AD Service Principal
########################################

/**
 * @resource azuread_service_principal.sp
 * Creates a Service Principal for the Azure AD application.
 *
 * @param client_id The Application (client) ID from the Azure AD application.
 */
resource "azuread_service_principal" "sp" {
  client_id = azuread_application.app.application_id
}

########################################
# Random Client Secret Generator
########################################

/**
 * @resource random_password.client_secret
 * Generates a secure random password for use as the application client secret.
 *
 * @param length  Number of characters in the generated password.
 * @param special Whether to include special characters in the password.
 */
resource "random_password" "client_secret" {
  length  = 32
  special = true
}

########################################
# Azure AD Application Password
########################################

/**
 * @resource azuread_application_password.secret
 * Creates and assigns a client secret to the Azure AD application.
 *
 * @param application_id Full resource path of the Azure AD application.
 * @param display_name   Name for the secret, including the app display name and environment.
 * @param end_date       Expiration date for the secret (default: 1 year from creation).
 */
resource "azuread_application_password" "secret" {
  application_id = "/applications/${azuread_application.app.object_id}"
  display_name   = "${var.display_name}-secret-${var.env}"
  end_date       = timeadd(timestamp(), "8760h")
}
