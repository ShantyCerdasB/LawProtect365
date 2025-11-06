
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

# S3 permissions for pipeline artifacts
data "aws_iam_policy_document" "s3_artifacts_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.artifacts_bucket}",
      "arn:aws:s3:::${var.artifacts_bucket}/*"
    ]
  }
}

# CloudWatch Logs permissions for CodeBuild
data "aws_iam_policy_document" "cloudwatch_logs_policy" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*",
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/*:log-stream:*"
    ]
  }
}

# CodeArtifact permissions for CodeBuild
data "aws_iam_policy_document" "codeartifact_policy" {
  statement {
    effect = "Allow"
    actions = [
      "codeartifact:GetAuthorizationToken",
      "codeartifact:GetRepositoryEndpoint",
      "codeartifact:ReadFromRepository",
      "sts:GetServiceBearerToken"
    ]
    resources = [
      "arn:aws:codeartifact:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.project_name}-domain",
      "arn:aws:codeartifact:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.project_name}-domain/repository/*"
    ]
  }
}

# Secrets Manager permissions for CodeBuild
data "aws_iam_policy_document" "secrets_manager_policy" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:lawprotect365/database-stg-*"
    ]
  }
}

# Lambda permissions for CodeBuild (for outbox handler deployment)
data "aws_iam_policy_document" "lambda_policy" {
  # === Lambda Functions (already OK) ===
  statement {
    effect = "Allow"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:PublishVersion",
      "lambda:UpdateAlias",
      "lambda:CreateAlias",
      "lambda:GetAlias"
    ]
    resources = [
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-outbox-stream-handler-${var.env}-*",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-sign-service-*-${var.env}"
    ]
  }

  # === LIST/GET permissions for layers (shared + sign-core + sign-deps) ===
  statement {
    effect = "Allow"
    actions = [
      "lambda:GetLayerVersion",
      "lambda:ListLayers",
      "lambda:ListLayerVersions"
    ]
    resources = [
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-shared-ts-layer-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-shared-ts-layer-${var.env}:*",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-core-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-core-${var.env}:*",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-deps-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-deps-${var.env}:*"
    ]
  }

  # === Layer version publishing (shared-ts + sign-core + legacy sign-deps) ===
  statement {
    effect = "Allow"
    actions = [
      "lambda:PublishLayerVersion",
      "lambda:AddLayerVersionPermission"
    ]
    resources = [
      # Base ARN and version wildcard
      # shared-ts layer (published by CodeBuild root pipeline)
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-shared-ts-layer-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-shared-ts-layer-${var.env}:*",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-core-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-core-${var.env}:*",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-deps-${var.env}",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:layer:${var.project_name}-sign-deps-${var.env}:*"
    ]
  }
}