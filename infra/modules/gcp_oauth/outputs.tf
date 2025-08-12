############################################
# Google OAuth Outputs
############################################

/**
 * @output client_id
 * Google OAuth Client ID.
 * 
 * Used by AWS Cognito (or other services) to configure Google as an
 * external identity provider for user authentication.
 */
output "client_id" {
  description = "Google OAuth Client ID for use in AWS Cognito"
  value       = var.google_client_id
}

 /**
  * @output client_secret
  * Google OAuth Client Secret.
  * 
  * This is a sensitive value used in conjunction with the Client ID
  * to authenticate with Google's OAuth 2.0 endpoints. It should never be
  * exposed in plaintext logs or stored insecurely.
  */
output "client_secret" {
  description = "Google OAuth Client Secret for use in AWS Cognito"
  value       = var.google_client_secret
  sensitive   = true
}

 /**
  * @output redirect_uris
  * List of allowed redirect URIs for the Google OAuth Client.
  * 
  * These URIs are where Google's OAuth 2.0 server will send users after
  * authentication. They must match exactly what is configured in the Google
  * Cloud Console.
  */
output "redirect_uris" {
  description = "List of allowed redirect URIs for the Google OAuth Client"
  value       = var.google_redirect_uris
}
