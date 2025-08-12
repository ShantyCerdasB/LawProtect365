/**
 * @file Input variables for requesting and validating an AWS ACM certificate via DNS in Route 53.
 */

/**
 * @variable project_name
 * Prefix used for tagging AWS resources to associate them with a specific project.
 *
 * @description Helps group and identify resources across environments and services.
 * @type string
 */
variable "project_name" {
  description = "Project prefix used for tagging."
  type        = string
}

/**
 * @variable env
 * Deployment environment identifier (e.g., `dev` or `prod`).
 *
 * @description Used to differentiate resources between environments.
 * @type string
 */
variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}

/**
 * @variable domain_name
 * Primary domain name for which the ACM certificate will be issued.
 *
 * @description Typically includes a subdomain such as `www.example.com`.
 * @type string
 */
variable "domain_name" {
  description = "Primary domain name for the certificate (e.g. \"www.example.com\")."
  type        = string
}

/**
 * @variable subject_alternative_names
 * Additional domain names (SANs) to be included in the ACM certificate.
 *
 * @description Examples include the apex domain `example.com` or other subdomains.
 * @type list(string)
 * @default []
 */
variable "subject_alternative_names" {
  description = "Additional domains (e.g. \"example.com\") to include in the certificate."
  type        = list(string)
  default     = []
}

/**
 * @variable hosted_zone_id
 * The Route 53 Hosted Zone ID where DNS validation records will be created.
 *
 * @description Required for automatic DNS validation of the ACM certificate.
 * @type string
 */
variable "hosted_zone_id" {
  description = "Route 53 Hosted Zone ID for DNS validation."
  type        = string
}
