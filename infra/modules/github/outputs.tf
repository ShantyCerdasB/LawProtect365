/**
 * @output connection_arn
 * ARN of the created CodeStar Connection.
 * This ARN is required by AWS services such as CodePipeline and CodeBuild
 * to reference the GitHub connection for source actions.
 */
output "connection_arn" {
  description = "ARN of the created CodeStar Connection"
  value       = aws_codestarconnections_connection.github.arn
}

/**
 * @output connection_id
 * ID of the CodeStar Connection resource.
 * Useful for referencing or troubleshooting connection configuration.
 */
output "connection_id" {
  description = "ID of the CodeStar Connection"
  value       = aws_codestarconnections_connection.github.id
}

/**
 * @output owner
 * GitHub organization or user name tied to the repository.
 */
output "owner" {
  description = "GitHub organization or user"
  value       = var.github_owner
}

/**
 * @output repository
 * Name of the GitHub repository integrated with this connection.
 */
output "repository" {
  description = "GitHub repository name"
  value       = var.github_repo
}

/**
 * @output branch
 * Git branch that will be used as the source in the CI/CD pipeline.
 */
output "branch" {
  description = "Git branch for pipeline"
  value       = var.github_branch
}
