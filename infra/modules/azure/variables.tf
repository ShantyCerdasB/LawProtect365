/**
 * @file Input variables for registering an Azure AD application, creating a service principal, and generating a client secret.
 */

########################################
# Application Configuration
########################################

/**
 * @variable display_name
 * Display name for the Azure AD application.
 *
 * @type string
 */
variable "display_name" {
  description = "Display name for the Azure AD application."
  type        = string
}

/**
 * @variable redirect_uris
 * List of OAuth 2.0 redirect URIs for the application.
 *
 * @description Used for web sign-in flows and authentication callbacks.
 * @type list(string)
 */
variable "redirect_uris" {
  description = "OAuth2 redirect URIs for the application."
  type        = list(string)
}

/**
 * @variable logout_uris
 * List of post-logout redirect URIs for the application.
 *
 * @description Defines where users are redirected after signing out.
 * @type list(string)
 * @default []
 */
variable "logout_uris" {
  description = "Post-logout redirect URIs."
  type        = list(string)
  default     = []
}

########################################
# Tagging & Environment
########################################

/**
 * @variable project_name
 * Project name used for tagging Azure resources.
 *
 * @type string
 */
variable "project_name" {
  description = "Project name used for tagging."
  type        = string
}

/**
 * @variable env
 * Deployment environment for the Azure AD application.
 *
 * @description Examples: `dev`, `prod`.
 * @type string
 */
variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}
