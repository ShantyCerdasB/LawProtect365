data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }
    actions = ["sts:AssumeRole", "sts:AssumeRoleWithWebIdentity"]
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}/${var.github_repo}:*"]
    }
  }
}

data "aws_iam_policy_document" "github_actions_policy" {
  statement {
    effect = "Allow"
    actions = [
      "codepipeline:StartPipelineExecution",
      "codepipeline:GetPipeline",
      "codepipeline:GetPipelineState",
      "codepipeline:ListPipelines",
      "codepipeline:GetPipelineExecution",
      "codepipeline:ListPipelineExecutions"
    ]
    resources = [
      "arn:aws:codepipeline:${var.region}:${var.account_id}:pipeline/*"
    ]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "codepipeline:StartPipelineExecution"
    ]
    resources = [
      "arn:aws:codepipeline:${var.region}:${var.account_id}:pipeline/lawprotect365-shared-components-pipeline-${var.env}",
      "arn:aws:codepipeline:${var.region}:${var.account_id}:pipeline/lawprotect365-sign-pipeline-${var.env}"
    ]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = [
      "arn:aws:iam::${var.account_id}:role/*"
    ]
  }
}
