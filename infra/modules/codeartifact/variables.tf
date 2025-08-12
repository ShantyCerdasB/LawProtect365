/**
 * @file Input variables for the AWS CodeArtifact module.
 * Defines configuration for the domain, repository, encryption, and package formats.
 */

########################################
# Domain & Repository
########################################

/**
 * @variable domain_name
 * The CodeArtifact domain name.
 *
 * @type string
 * @example "lawprotect365-domain"
 */
variable "domain_name" {
  description = "The CodeArtifact domain name (e.g. lawprotect365-domain)"
  type        = string
}

/**
 * @variable repository_name
 * The CodeArtifact repository name.
 *
 * @type string
 * @example "shared-packages"
 */
variable "repository_name" {
  description = "The CodeArtifact repository name (e.g. shared-packages)"
  type        = string
}

########################################
# Encryption
########################################

/**
 * @variable encryption_key_arn
 * Optional KMS key ARN to encrypt the CodeArtifact domain.
 *
 * @type string
 * @default ""
 */
variable "encryption_key_arn" {
  description = "Optional KMS key ARN to encrypt your CodeArtifact domain"
  type        = string
  default     = ""
}

########################################
# Upstream Connections
########################################

/**
 * @variable upstream_connections
 * List of external repositories to proxy (e.g. public npmjs.org).
 *
 * @type list(string)
 * @default []
 */
variable "upstream_connections" {
  description = "List of external repositories to proxy (e.g. public npmjs.org)"
  type        = list(string)
  default     = []
}

########################################
# Tags
########################################

/**
 * @variable tags
 * A map of tags to apply to all CodeArtifact resources.
 *
 * @type map(string)
 * @default {}
 */
variable "tags" {
  description = "A map of tags to apply to all CodeArtifact resources"
  type        = map(string)
  default     = {}
}

########################################
# Package Formats
########################################

/**
 * @variable package_formats
 * Formats of packages to support in the repository.
 *
 * @type list(string)
 * @default ["npm"]
 * @example ["npm", "pypi", "maven"]
 */
variable "package_formats" {
  description = "Formats of packages to support in the repository (e.g. npm, pypi, maven)"
  type        = list(string)
  default     = ["npm"]
}
