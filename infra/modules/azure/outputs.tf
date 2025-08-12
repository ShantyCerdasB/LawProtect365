/**
 * @file Output values for the Azure AD application registration module.
 * Exposes key identifiers and credentials for use in other modules or integrations.
 */

/**
 * @output application_id
 * Application (client) ID of the Azure AD application.
 *
 * @description Used when authenticating against Azure AD.
 * @value azuread_application.app.application_id
 */
output "application_id" {
  description = "Client ID of the Azure AD application."
  value       = azuread_application.app.application_id
}

/**
 * @output service_principal_object_id
 * Object ID of the Azure AD Service Principal.
 *
 * @description Used when assigning roles or permissions to the service principal.
 * @value azuread_service_principal.sp.object_id
 */
output "service_principal_object_id" {
  description = "Object ID of the Azure AD service principal."
  value       = azuread_service_principal.sp.object_id
}

/**
 * @output client_secret
 * Client secret value for the Azure AD application.
 *
 * @description Sensitive value used for application authentication.
 * @sensitive true
 * @value azuread_application_password.secret.value
 */
output "client_secret" {
  description = "The generated client secret value"
  value       = azuread_application_password.secret.value
  sensitive   = true
}

/**
 * @output client_id
 * Application (client) ID of the Azure AD application.
 *
 * @description Duplicate of `application_id` for compatibility with certain naming conventions.
 * @value azuread_application.app.application_id
 */
output "client_id" {
  description = "The Application (client) ID for the Azure AD app"
  value       = azuread_application.app.application_id
}
