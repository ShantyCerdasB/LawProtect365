/**
 * @file main.tf
 * @module secrets-manager
 * @description
 * Provisions an AWS Secrets Manager secret with an initial version.
 * The secret can store sensitive configuration data such as API keys, passwords,
 * or connection strings. 
 * 
 * Includes:
 * - Creation of the secret resource with project/environment tagging.
 * - Storage of the initial secret value.
 */

/**
 * Creates an AWS Secrets Manager secret.
 * 
 * @resource aws_secretsmanager_secret.secret
 * @description
 * Defines a named secret in AWS Secrets Manager. The secret is tagged with
 * project and environment metadata for easier identification and management.
 */
resource "aws_secretsmanager_secret" "secret" {
  name        = var.secret_name
  description = "Managed by Terraform for ${var.project_name} (${var.env})"

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

/**
 * Creates the initial version of the AWS Secrets Manager secret.
 * 
 * @resource aws_secretsmanager_secret_version.secret_version
 * @description
 * Stores the initial secret value as a secret version. 
 * This resource links to the `aws_secretsmanager_secret.secret` created above.
 */
resource "aws_secretsmanager_secret_version" "secret_version" {
  secret_id     = aws_secretsmanager_secret.secret.id
  secret_string = var.secret_string
}
