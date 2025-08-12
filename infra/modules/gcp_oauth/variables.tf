/**
 * @variable gcp_project_id
 * Google Cloud Project ID where the OAuth Client is configured.
 *
 * This is the unique identifier of your Google Cloud project.
 * It is required to manage resources and APIs (such as IAP) in that project.
 */
variable "gcp_project_id" {
  description = "Google Cloud Project ID where the OAuth Client is configured"
  type        = string
}

/**
 * @variable gcp_region
 * Google Cloud region.
 *
 * Used for provider compatibility when deploying or managing resources
 * in GCP. Must be a valid GCP region name (e.g., us-central1).
 */
variable "gcp_region" {
  description = "Google Cloud region (for provider compatibility)"
  type        = string
}

/**
 * @variable google_client_id
 * Google OAuth 2.0 Client ID.
 *
 * Obtained from the Google Cloud Console when creating an OAuth client.
 * Used by AWS Cognito (or other apps) to integrate Google sign-in.
 */
variable "google_client_id" {
  description = "Google OAuth 2.0 Client ID from the GCP console"
  type        = string
}

/**
 * @variable google_client_secret
 * Google OAuth 2.0 Client Secret.
 *
 * This is the confidential secret linked to the OAuth client.
 * It should be stored securely and never exposed in logs.
 */
variable "google_client_secret" {
  description = "Google OAuth 2.0 Client Secret from the GCP console"
  type        = string
  sensitive   = true
}

/**
 * @variable google_redirect_uris
 * List of allowed redirect URIs.
 *
 * After successful authentication, Google will redirect users
 * to one of these URLs. These must match exactly the URIs registered
 * in the Google Cloud Console for the OAuth client.
 */
variable "google_redirect_uris" {
  description = "List of allowed redirect URIs for the Google OAuth Client"
  type        = list(string)
}
