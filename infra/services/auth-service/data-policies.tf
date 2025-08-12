/**
 * @file main.tf
 * @module sns_mfa_role
 * @description
 * Configures the IAM trust policy for Amazon Cognito Identity Provider
 * and prepares a local map for SNS MFA role inline policies.
 */

########################################
# Trust Policy
########################################

/**
 * @data aws_iam_policy_document.sns_assume
 * @description
 * Trust policy document that allows the Amazon Cognito Identity Provider
 * service (`cognito-idp.amazonaws.com`) to assume this role via STS.
 */
data "aws_iam_policy_document" "sns_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cognito-idp.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

########################################
# Inline Policies Map
########################################

/**
 * @local sns_role_inline_policies_base
 * @description
 * Base set of inline policies for the SNS MFA role.
 * Initially empty, can be extended to include minimal SNS publish policies if needed.
 */
locals {
  sns_role_inline_policies_base = {}

  /**
   * @local sns_role_inline_policies
   * @description
   * Merged map of base inline policies and any extra inline policies
   * provided via module input variables.
   */
  sns_role_inline_policies = merge(local.sns_role_inline_policies_base, var.extra_inline_policies)
}
