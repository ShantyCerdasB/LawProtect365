/**
 * @variable project_name
 * Name of the project.
 * Used for naming AWS resources consistently.
 */
variable "project_name" {
  description = "Name of the project"
  type        = string
}

/**
 * @variable provider_type
 * Type of SCM provider.
 * Valid values: `GitHub` (default) or `GitHubEnterprise`.
 */
variable "provider_type" {
  description = "Type of provider: GitHub or GitHubEnterprise"
  type        = string
  default     = "GitHub"
}

/**
 * @variable github_owner
 * Name of the GitHub organization or user that owns the repository.
 */
variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
}

/**
 * @variable github_repo
 * Name of the GitHub repository to connect.
 */
variable "github_repo" {
  description = "Name of the GitHub repository"
  type        = string
}

/**
 * @variable github_branch
 * Branch to track for triggering the pipeline.
 * Defaults to `main`.
 */
variable "github_branch" {
  description = "Git branch to track for pipeline triggers"
  type        = string
  default     = "main"
}

/**
 * @variable tags
 * Tags to apply to the CodeStar Connection for cost allocation and management.
 */
variable "tags" {
  description = "Tags to apply to the CodeStar Connection"
  type        = map(string)
  default     = {}
}
