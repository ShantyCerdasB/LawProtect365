resource "aws_iam_policy" "github_actions_policy" {
  name = "${var.project_name}-github-actions-policy-${var.env}"
  
  policy = data.aws_iam_policy_document.github_actions_policy.json
  
  tags = var.tags
}
