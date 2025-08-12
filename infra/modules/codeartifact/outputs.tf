/**
 * @file Output values for the AWS CodeArtifact module.
 * Exposes ARNs and endpoint URLs for use by other modules.
 */

########################################
# Domain
########################################

/**
 * @output artifact_domain_arn
 * The ARN of the CodeArtifact domain.
 *
 * @type string
 */
output "artifact_domain_arn" {
  description = "The ARN of the CodeArtifact domain"
  value       = aws_codeartifact_domain.artifact_domain.arn
}

########################################
# Repository
########################################

/**
 * @output artifact_repository_arn
 * The ARN of the CodeArtifact repository.
 *
 * @type string
 */
output "artifact_repository_arn" {
  description = "The ARN of the CodeArtifact repository"
  value       = aws_codeartifact_repository.artifact_repository.arn
}

########################################
# Endpoints
########################################

/**
 * @output artifact_repository_endpoints
 * Map of package format to repository endpoint URL.
 *
 * @type map(string)
 * @example { "npm" = "https://domain-1234567890.d.codeartifact.us-east-1.amazonaws.com/npm/repo/" }
 */
output "artifact_repository_endpoints" {
  description = "Map of package format to repository endpoint URL"
  value = {
    for fmt, ds in data.aws_codeartifact_repository_endpoint.repo :
    fmt => ds.repository_endpoint
  }
}
