/**
 * Registered apex domain for the public Route 53 hosted zone.
 * Example: "example.com"
 */
variable "cert_base_domain" {
  description = "Your registered apex domain."
  type        = string
}

/**
 * Project prefix used for tagging AWS resources.
 */
variable "project_name" {
  description = "Project prefix for tagging."
  type        = string
}

/**
 * Deployment environment name.
 * Allowed values: "dev" or "prod".
 */
variable "env" {
  description = "Deployment environment."
  type        = string
}
