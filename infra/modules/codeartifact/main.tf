/**
 * @file AWS CodeArtifact domain and repository setup.
 * Creates a CodeArtifact domain, repository, and package-format-specific endpoints.
 */

########################################
# CodeArtifact Domain
########################################

/**
 * Creates the CodeArtifact domain.
 */
resource "aws_codeartifact_domain" "artifact_domain" {
  domain         = var.domain_name
  encryption_key = var.encryption_key_arn != "" ? var.encryption_key_arn : null
  tags           = var.tags
}

########################################
# CodeArtifact Repository
########################################

/**
 * Creates the CodeArtifact repository within the domain.
 */
resource "aws_codeartifact_repository" "artifact_repository" {
  repository  = var.repository_name
  domain      = aws_codeartifact_domain.artifact_domain.domain
  description = "Repository ${var.repository_name} for internal packages"
  tags        = var.tags
}

########################################
# Package Format Endpoints
########################################

/**
 * One endpoint data source per package format.
 */
data "aws_codeartifact_repository_endpoint" "repo" {
  for_each   = toset(var.package_formats)
  domain     = aws_codeartifact_domain.artifact_domain.domain
  repository = aws_codeartifact_repository.artifact_repository.repository
  format     = each.key
}
