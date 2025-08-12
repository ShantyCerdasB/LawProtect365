############################################
# Google OAuth Client Info Module
############################################
/**
 * This module provisions and outputs Google OAuth Client information
 * so it can be consumed by other Terraform modules (e.g., AWS Cognito).
 * 
 * Prerequisites:
 * - The Identity-Aware Proxy (IAP) API must be enabled in the target GCP project.
 * - OAuth client configuration must be managed to include redirect URIs.
 */

############################################
# Enable IAP API
############################################
/**
 * Enables the Identity-Aware Proxy (IAP) API for the specified GCP project.
 * This is required before creating or managing OAuth clients for IAP-secured resources.
 */
resource "google_project_service" "iap" {
  project = var.gcp_project_id
  service = "iap.googleapis.com"
}

############################################
# Local Values
############################################
/**
 * Stores the list of Google OAuth redirect URIs.
 * These URIs are provided via variable to allow updates without recreating the OAuth client.
 * 
 * Example:
 * [
 *   "https://yourapp.example.com/callback",
 *   "https://yourapp.example.com/auth/google/callback"
 * ]
 */
locals {
  redirect_uris = var.google_redirect_uris
}
