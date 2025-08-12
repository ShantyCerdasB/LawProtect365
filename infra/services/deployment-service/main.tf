################################################################
# GitHub → CodeBuild → CodeDeploy → CodePipeline CI/CD Setup
#
# This Terraform configuration provisions a complete CI/CD
# pipeline for a given microservice. It:
#   1) Connects AWS to GitHub via CodeStar Connection.
#   2) Builds the service using AWS CodeBuild.
#   3) Deploys the service using AWS CodeDeploy.
#   4) Orchestrates the flow with AWS CodePipeline.
#
# All IAM roles are created with least privilege for their
# respective AWS services, tagged for cost tracking, and
# scoped to the given `project_name`, `service_name`, and `env`.
#
# PARAMETERS:
#   - project_name         : Project identifier prefix.
#   - service_name         : Name of the microservice (e.g., "auth").
#   - env                  : Environment (dev, prod, etc.).
#   - github_owner         : GitHub org/user name.
#   - github_repo          : GitHub repository name.
#   - provider_type        : CodeStar provider type (e.g., GitHub).
#   - artifacts_bucket     : S3 bucket for storing pipeline artifacts.
#   - buildspec_path       : Path to CodeBuild buildspec file.
#   - compute_type         : CodeBuild compute capacity.
#   - environment_image    : CodeBuild environment image.
#   - environment_variables: Environment variables for the build.
#   - deployment_config_name: CodeDeploy config (e.g., LambdaAllAtOnce).
#   - auto_rollback        : Enable/disable rollback on failure.
#   - blue_green_termination_wait_minutes: Time to wait before terminating old resources.
#   - blue_green_ready_wait_minutes      : Time to wait for resources to be ready.
#   - tags                 : Common AWS tags.
################################################################

################################################################
# 0) GitHub CodeStar Connection
#
# Creates a CodeStar connection between AWS and the specified
# GitHub repository for pulling source code.
#
# Outputs:
#   - connection_arn : ARN of the CodeStar connection.
#   - owner          : GitHub organization/user.
#   - repository     : GitHub repository name.
#   - branch         : Default branch for pipeline source.
################################################################
module "github" {
  source        = "../../modules/github"
  project_name  = var.project_name
  github_owner  = var.github_owner
  github_repo   = var.github_repo
  provider_type = var.provider_type
  tags          = var.tags
}

################################################################
# 1) CodeBuild Execution Role
#
# IAM role for CodeBuild with policies to:
#   - Read/write to S3 artifact buckets.
#   - Access AWS CodeBuild developer actions.
#
# Outputs:
#   - role_arn  : ARN of the CodeBuild IAM role.
#   - role_name : Name of the CodeBuild IAM role.
################################################################
module "codebuild_role" {
  source             = "../../modules/iam-role"
  role_name          = "${var.project_name}-${var.service_name}-codebuild-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess",
  ]
  inline_policies = {}
  project_name    = var.project_name
  env             = var.env
}

################################################################
# 2) CodeDeploy Execution Role
#
# IAM role for CodeDeploy with Lambda deployment permissions.
#
# Outputs:
#   - role_arn  : ARN of the CodeDeploy IAM role.
#   - role_name : Name of the CodeDeploy IAM role.
################################################################
module "codedeploy_role" {
  source             = "../../modules/iam-role"
  role_name          = "${var.project_name}-${var.service_name}-codedeploy-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda",
  ]
  inline_policies = {}
  project_name    = var.project_name
  env             = var.env
}

################################################################
# 3) CodePipeline Service Role
#
# IAM role for CodePipeline with permissions to:
#   - Manage AWS CodePipeline workflows.
#   - Read artifacts from S3.
#   - Invoke CodeBuild and CodeDeploy.
#
# Outputs:
#   - role_arn  : ARN of the CodePipeline IAM role.
#   - role_name : Name of the CodePipeline IAM role.
################################################################
module "pipeline_role" {
  source             = "../../modules/iam-role"
  role_name          = "${var.project_name}-${var.service_name}-pipeline-${var.env}"
  assume_role_policy = data.aws_iam_policy_document.pipeline_assume.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AWSCodePipeline_FullAccess",
    "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
    "arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess",
    "arn:aws:iam::aws:policy/AWSCodeDeployFullAccess",
  ]
  inline_policies = {}
  project_name    = var.project_name
  env             = var.env
}

################################################################
# 4) CodeBuild Project
#
# Creates a CodeBuild project that compiles, tests, and packages
# the service according to the buildspec file.
#
# Outputs:
#   - codebuild_project_name : Name of the CodeBuild project.
################################################################
module "build" {
  source                = "../../modules/codebuild"
  project_name          = "${var.project_name}-${var.service_name}"
  env                   = var.env
  service_role_arn      = module.codebuild_role.role_arn
  artifacts_bucket      = var.artifacts_bucket
  buildspec_path        = var.buildspec_path
  compute_type          = var.compute_type
  environment_image     = var.environment_image
  environment_variables = var.environment_variables
  tags                  = var.tags
}

################################################################
# 5) CodeDeploy Application & Deployment Group
#
# Creates a CodeDeploy application and deployment group
# for Lambda-based blue/green or all-at-once deployments.
#
# Outputs:
#   - codedeploy_application_name       : Name of the CodeDeploy application.
#   - codedeploy_deployment_group_name  : Name of the CodeDeploy deployment group.
################################################################
module "codedeploy" {
  source                               = "../../modules/codedeploy"
  application_name                     = "${var.project_name}-${var.service_name}-app-${var.env}"
  deployment_group_name                = "${var.project_name}-${var.service_name}-dg-${var.env}"
  service_role_arn                     = module.codedeploy_role.role_arn
  deployment_config_name               = var.deployment_config_name
  auto_rollback                        = var.auto_rollback
  blue_green_termination_wait_minutes  = var.blue_green_termination_wait_minutes
  blue_green_ready_wait_minutes        = var.blue_green_ready_wait_minutes
  tags                                 = var.tags
}

################################################################
# 6) CodePipeline: Source → Build → Deploy
#
# Creates the CodePipeline definition with:
#   - Source stage (GitHub)
#   - Build stage (CodeBuild)
#   - Deploy stage (CodeDeploy)
#
# Outputs:
#   - pipeline_name : Name of the CodePipeline.
################################################################
data "aws_region" "current" {}

module "pipeline" {
  source                           = "../../modules/codepipeline"
  pipeline_name                    = "${var.project_name}-${var.service_name}-pipeline-${var.env}"
  role_arn                         = module.pipeline_role.role_arn
  artifacts_bucket                 = var.artifacts_bucket
  github_connection_arn            = module.github.connection_arn
  github_owner                     = module.github.owner
  github_repo                      = module.github.repository
  github_branch                    = module.github.branch
  codebuild_project_name           = module.build.codebuild_project_name
  build_output_artifact            = "${var.service_name}_build_output"
  codedeploy_app_name              = module.codedeploy.codedeploy_application_name
  codedeploy_deployment_group_name = module.codedeploy.codedeploy_deployment_group_name
  tags                             = var.tags
}
