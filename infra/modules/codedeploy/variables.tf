/**
 * @file Input variables for AWS CodeDeploy for Lambda Module
 * Defines the required configuration for application, deployment group, and blue/green settings.
 */

########################################
# Application Configuration
########################################

/**
 * @variable application_name
 * Name of the CodeDeploy application for Lambda.
 * @type string
 */
variable "application_name" {
  description = "Name of the CodeDeploy application for Lambda"
  type        = string
}

/**
 * @variable deployment_group_name
 * Name of the CodeDeploy deployment group.
 * @type string
 */
variable "deployment_group_name" {
  description = "Name of the Deployment Group (e.g. documents-live-dg)"
  type        = string
}

########################################
# IAM Role
########################################

/**
 * @variable service_role_arn
 * IAM Role ARN that CodeDeploy will assume.
 * @type string
 */
variable "service_role_arn" {
  description = "IAM Role ARN that CodeDeploy will use"
  type        = string
}

########################################
# Deployment Configuration
########################################

/**
 * @variable deployment_config_name
 * CodeDeploy predefined or custom configuration for Lambda deployments.
 * @default "CodeDeployDefault.LambdaAllAtOnce"
 */
variable "deployment_config_name" {
  description = "CodeDeploy configuration (e.g. CodeDeployDefault.LambdaCanary10Percent5Minutes)"
  type        = string
  default     = "CodeDeployDefault.LambdaAllAtOnce"
}

/**
 * @variable auto_rollback
 * Enables or disables automatic rollback on failure.
 * @type bool
 * @default true
 */
variable "auto_rollback" {
  description = "Whether to enable automatic rollback on failure"
  type        = bool
  default     = true
}

########################################
# Blue/Green Wait Timers
########################################

/**
 * @variable blue_green_termination_wait_minutes
 * Minutes to wait before terminating the old Lambda version after a successful deployment.
 * @type number
 * @default 5
 */
variable "blue_green_termination_wait_minutes" {
  description = "Minutes to wait before terminating old version after successful deployment"
  type        = number
  default     = 5
}

/**
 * @variable blue_green_ready_wait_minutes
 * Minutes to wait before starting the traffic shift to the new Lambda version.
 * @type number
 * @default 0
 */
variable "blue_green_ready_wait_minutes" {
  description = "Wait minutes before proceeding with traffic shift"
  type        = number
  default     = 0
}

########################################
# Tags
########################################

/**
 * @variable tags
 * Tags applied to all CodeDeploy resources.
 * @type map(string)
 */
variable "tags" {
  description = "Tags to apply to CodeDeploy resources"
  type        = map(string)
  default     = {}
}
