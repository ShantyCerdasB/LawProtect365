/**
 * @file data-policies.tf
 * @module notifications_service
 * @description
 * IAM policy documents for notifications-service Lambda functions.
 * Defines permissions for SES, Pinpoint, Secrets Manager, CloudWatch, and EventBridge.
 */

############################################
# SES Email Sending Permissions
############################################

/**
 * Policy: Allows sending emails via Amazon SES
 * Permissions:
 *   - ses:SendEmail
 *   - ses:SendRawEmail
 * Resources:
 *   - SES identity ARN (email address or domain)
 */
data "aws_iam_policy_document" "notifications_ses_send" {
  statement {
    sid    = "AllowSesSendEmail"
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = [
      "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/*"
    ]
  }
}

############################################
# Pinpoint SMS Sending Permissions
############################################

/**
 * Policy: Allows sending SMS messages via Amazon Pinpoint
 * Permissions:
 *   - mobiletargeting:SendMessages
 * Resources:
 *   - Pinpoint application ARN
 */
data "aws_iam_policy_document" "notifications_pinpoint_sms" {
  statement {
    sid    = "AllowPinpointSendSms"
    effect = "Allow"
    actions = [
      "mobiletargeting:SendMessages"
    ]
    resources = [
      "arn:aws:mobiletargeting:${var.aws_region}:${data.aws_caller_identity.current.account_id}:apps/${var.pinpoint_application_id}/*"
    ]
  }
}

############################################
# Secrets Manager Read Permissions
############################################

/**
 * Policy: Allows reading secrets from AWS Secrets Manager
 * Permissions:
 *   - secretsmanager:GetSecretValue
 * Resources:
 *   - FCM service account key secret ARN
 *   - APNS keys secret ARN
 */
data "aws_iam_policy_document" "notifications_secrets_read" {
  statement {
    sid    = "AllowSecretsRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = concat(
      [for secret_arn in var.secret_arns : secret_arn if secret_arn != null],
      [
        "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/fcm-*",
        "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/apns-*"
      ]
    )
  }
}

############################################
# CloudWatch Metrics Permissions
############################################

/**
 * Policy: Allows publishing custom metrics to CloudWatch
 * Permissions:
 *   - cloudwatch:PutMetricData
 * Resources:
 *   - Scoped to NotificationsService namespace
 */
data "aws_iam_policy_document" "notifications_cloudwatch_metrics" {
  statement {
    sid    = "AllowPutMetricData"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["NotificationsService"]
    }
  }
}

############################################
# EventBridge Rule Read Permissions (Optional)
############################################

/**
 * Policy: Allows reading EventBridge rule configuration
 * Permissions:
 *   - events:DescribeRule
 *   - events:ListTargetsByRule
 * Resources:
 *   - EventBridge rule ARN (if needed for Lambda configuration)
 */
data "aws_iam_policy_document" "notifications_eventbridge_read" {
  count = var.eventbridge_rule_arn != null ? 1 : 0

  statement {
    sid    = "AllowEventBridgeRead"
    effect = "Allow"
    actions = [
      "events:DescribeRule",
      "events:ListTargetsByRule"
    ]
    resources = [var.eventbridge_rule_arn]
  }
}

############################################
# Data Sources
############################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {
  name = var.aws_region
}

############################################
# Inline Policies Map
############################################

locals {
  inline_policies_base = {
    "ses-send-email"        = data.aws_iam_policy_document.notifications_ses_send.json
    "pinpoint-send-sms"     = data.aws_iam_policy_document.notifications_pinpoint_sms.json
    "secrets-read"          = data.aws_iam_policy_document.notifications_secrets_read.json
    "cloudwatch-metrics"    = data.aws_iam_policy_document.notifications_cloudwatch_metrics.json
  }

  inline_policies_optional = var.eventbridge_rule_arn != null ? {
    "eventbridge-read" = data.aws_iam_policy_document.notifications_eventbridge_read[0].json
  } : {}

  inline_policies = merge(
    local.inline_policies_base,
    local.inline_policies_optional,
    var.extra_inline_policies
  )
}

