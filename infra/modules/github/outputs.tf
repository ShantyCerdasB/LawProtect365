output "connection_arn" {
  value = aws_codestarconnections_connection.github.arn
}

output "connection_name" {
  value = aws_codestarconnections_connection.github.name
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}

output "github_actions_role_name" {
  value = aws_iam_role.github_actions_role.name
}

output "github_actions_policy_arn" {
  value = aws_iam_policy.github_actions_policy.arn
}