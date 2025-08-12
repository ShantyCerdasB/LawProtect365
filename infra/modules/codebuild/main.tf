/**
 * @file AWS CodeBuild Project Module.
 * Creates a CodeBuild project for building a specific microservice from CodePipeline.
 */

########################################
# CodeBuild Project
########################################

/**
 * Creates an AWS CodeBuild project configured to be triggered from CodePipeline.
 */
resource "aws_codebuild_project" "build_project" {
  name         = var.project_name
  service_role = var.service_role_arn

  ########################################
  # Source configuration (from CodePipeline)
  ########################################
  source {
    type      = "CODEPIPELINE"
    buildspec = var.buildspec_path
  }

  ########################################
  # Artifacts configuration (from CodePipeline)
  ########################################
  artifacts {
    type = "CODEPIPELINE"
  }

  ########################################
  # Build environment configuration
  ########################################
  environment {
    compute_type    = var.compute_type
    image           = var.environment_image
    type            = "LINUX_CONTAINER"
    privileged_mode = false

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.value.name
        value = environment_variable.value.value
        type  = lookup(environment_variable.value, "type", "PLAINTEXT")
      }
    }
  }

  ########################################
  # Local cache for faster rebuilds
  ########################################
  cache {
    type  = "LOCAL"
    modes = [
      "LOCAL_DOCKER_LAYER_CACHE",
      "LOCAL_SOURCE_CACHE",
      "LOCAL_CUSTOM_CACHE"
    ]
  }

  tags = var.tags
}

########################################
# Data source for AWS region (for console URL output)
########################################
data "aws_region" "current" {}
