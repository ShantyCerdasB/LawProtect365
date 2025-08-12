/**
 * @file variables.tf
 * @module secrets-manager
 * @description
 * Defines input variables for provisioning a secret in AWS Secrets Manager.
 * These variables allow customization of the secret's name, value, and tagging
 * for identification and environment separation.
 */

/**
 * @variable secret_name
 * @description
 * The unique name (or path) of the secret in AWS Secrets Manager.
 * This must be globally unique within the account and region.
 */
variable "secret_name" {
  description = "The name (path) of the secret in Secrets Manager."
  type        = string
}

/**
 * @variable secret_string
 * @description
 * The sensitive value to be stored in the secret.
 * This field is marked as sensitive to avoid accidental exposure in logs or plans.
 */
variable "secret_string" {
  description = "The sensitive value to store in the secret."
  type        = string
  sensitive   = true
}

/**
 * @variable project_name
 * @description
 * Prefix used for tagging AWS resources to identify the owning project.
 */
variable "project_name" {
  description = "Project prefix used for tagging."
  type        = string
}

/**
 * @variable env
 * @description
 * Deployment environment identifier (e.g., `dev`, `staging`, `prod`).
 */
variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}
