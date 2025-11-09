/**
 * @file AWS CodePipeline Module
 * Creates a CodePipeline with Source (GitHub), Build (CodeBuild), and Deploy (CodeDeploy) stages.
 */

########################################
# Data Source — Current Region
########################################
data "aws_region" "current" {}

########################################
# CodePipeline
########################################
resource "aws_codepipeline" "pipeline" {
  name     = var.pipeline_name
  role_arn = var.role_arn

  ########################################
  # Artifact Store (S3)
  ########################################
  artifact_store {
    type     = "S3"
    location = var.artifacts_bucket
  }

  ########################################
  # Stage 1 — Source (GitHub via CodeStar)
  ########################################
  stage {
    name = "Source"

    action {
      name             = "GitHub_Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = var.github_connection_arn
        FullRepositoryId = "${var.github_owner}/${var.github_repo}"
        BranchName       = var.github_branch
        DetectChanges    = "false"
      }
    }
  }

  ########################################
  # Optional Stage — Test (CodeBuild)
  ########################################
  dynamic "stage" {
    for_each = var.enable_test_stage ? [1] : []
    content {
      name = "Test"
      action {
        name             = "Run_Tests"
        category         = "Test"
        owner            = "AWS"
        provider         = "CodeBuild"
        version          = "1"
        input_artifacts  = ["source_output"]
        output_artifacts = [var.test_output_artifact]
        configuration = {
          ProjectName = var.test_codebuild_project_name
        }
      }
    }
  }

  ########################################
  # Stage 2 — Build (CodeBuild)
  ########################################
  # Build stage — supports multiple actions to bypass 5-artifact limit
  stage {
    name = "Build"

    dynamic "action" {
      for_each = length(var.build_actions) > 0 ? var.build_actions : [{
        name             = "Build"
        output_artifacts = length(var.build_output_artifacts) > 0 ? var.build_output_artifacts : [var.build_output_artifact]
      }]
      content {
        name             = action.value.name
        category         = "Build"
        owner            = "AWS"
        provider         = "CodeBuild"
        version          = "1"
        input_artifacts  = [var.enable_test_stage ? var.test_output_artifact : "source_output"]
        output_artifacts = action.value.output_artifacts
        configuration = {
          ProjectName = var.codebuild_project_name
        }
      }
    }
  }

  ########################################
  # Stage 3 — Deploy (CodeDeploy Lambda) - Conditional
  ########################################
  # Prefer explicit deploy actions when provided (multi-Lambda)
  dynamic "stage" {
    for_each = length(var.deploy_actions) > 0 ? [1] : []
    content {
      name = "Deploy"
      dynamic "action" {
        for_each = var.deploy_actions
        content {
          name            = action.value.name
          category        = "Deploy"
          owner           = "AWS"
          provider        = "CodeDeploy"
          version         = "1"
          input_artifacts = [action.value.input_artifact]
          configuration = {
            ApplicationName     = action.value.application_name
            DeploymentGroupName = action.value.deployment_group_name
          }
        }
      }
    }
  }

  # Single CodeDeploy action fallback
  dynamic "stage" {
    for_each = (length(var.deploy_actions) == 0 && var.enable_codedeploy_stage) ? [1] : []
    content {
      name = "Deploy"
      action {
        name            = "Deploy"
        category        = "Deploy"
        owner           = "AWS"
        provider        = "CodeDeploy"
        version         = "1"
        input_artifacts = [length(var.build_output_artifacts) > 0 ? var.build_output_artifacts[0] : var.build_output_artifact]
        configuration = {
          ApplicationName     = var.codedeploy_app_name
          DeploymentGroupName = var.codedeploy_deployment_group_name
        }
      }
    }
  }

  tags = var.tags
}
