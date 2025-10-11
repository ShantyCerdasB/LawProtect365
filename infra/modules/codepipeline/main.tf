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
  # Stage 2 — Build (CodeBuild)
  ########################################
  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = [var.build_output_artifact]

      configuration = {
        ProjectName = var.codebuild_project_name
      }
    }
  }

  ########################################
  # Stage 3 — Deploy (CodeDeploy Lambda) - Conditional
  ########################################
  dynamic "stage" {
    for_each = var.enable_codedeploy_stage ? [1] : []
    content {
      name = "Deploy"

      action {
        name            = "Deploy"
        category        = "Deploy"
        owner           = "AWS"
        provider        = "CodeDeploy"
        version         = "1"
        input_artifacts = [var.build_output_artifact]

        configuration = {
          ApplicationName     = var.codedeploy_app_name
          DeploymentGroupName = var.codedeploy_deployment_group_name
        }
      }
    }
  }

  tags = var.tags
}
