/**
 * @resource aws_codestarconnections_connection.github
 * Creates a CodeStar Connection to a GitHub or GitHub Enterprise repository.
 *
 * This resource enables AWS services like CodePipeline and CodeBuild
 * to connect to a GitHub account for automated CI/CD workflows.
 *
 * @param name
 *   Uses the `project_name` variable as the connection name, ensuring
 *   consistency across services.
 *
 * @param provider_type
 *   Set via `provider_type` variable. Common values: "GitHub" or "GitHubEnterprise".
 *
 * @param tags
 *   Applies the common tags defined in the `tags` variable for resource tracking.
 */
resource "aws_codestarconnections_connection" "github" {
  name             = var.project_name
  provider_type    = var.provider_type
  tags             = var.tags
}
