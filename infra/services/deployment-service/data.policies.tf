
# Allows AWS CodeBuild service to assume the role
data "aws_iam_policy_document" "codebuild_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Allows AWS CodeDeploy service to assume the role
data "aws_iam_policy_document" "codedeploy_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codedeploy.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Allows AWS CodePipeline service to assume the role
data "aws_iam_policy_document" "pipeline_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["codepipeline.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Data sources for CodeStar Connection policy
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# CodeStar Connection permissions for CodePipeline
data "aws_iam_policy_document" "codestar_connection_policy" {
  statement {
    effect = "Allow"
    actions = [
      "codestar-connections:UseConnection"
    ]
    resources = [
      "arn:aws:codestar-connections:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:connection/*"
    ]
  }
}