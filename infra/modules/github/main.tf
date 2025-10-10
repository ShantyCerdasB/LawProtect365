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

resource "aws_iam_role" "github_actions_role" {
  name = "${var.project_name}-github-actions-${var.env}"
  
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
  
  tags = var.tags
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
  
  client_id_list = [
    "sts.amazonaws.com"
  ]
  
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "github_actions_policy_attachment" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_policy.arn
}
