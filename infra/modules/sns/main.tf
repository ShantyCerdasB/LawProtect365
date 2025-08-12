/**
 * @fileoverview
 * SNS Topic Terraform Module
 *
 * Creates an AWS SNS Topic with:
 * - Optional FIFO validation
 * - IAM policy with optional publisher restrictions
 * - Optional CloudWatch Alarm publish permissions
 * - Optional subscriptions
 *
 * @platform Compatible with Windows, macOS, and Linux.
 */

# -------------------------------------------------------------------------------------------------
# Caller Identity
# -------------------------------------------------------------------------------------------------
data "aws_caller_identity" "sns_caller" {}

locals {
  /**
   * @property fifo_ok
   * Checks whether the topic name ends with `.fifo` if `fifo` is enabled.
   */
  fifo_ok = var.fifo ? (can(regex("\\.fifo$", var.topic_name)) ? true : false) : true
}

# -------------------------------------------------------------------------------------------------
# FIFO Name Guard (Cross-platform)
# -------------------------------------------------------------------------------------------------
resource "null_resource" "sns_fifo_name_guard" {
  triggers = {
    fifo_ok = tostring(local.fifo_ok)
  }

  lifecycle {
    ignore_changes = all
  }

  # Destroy always passes
  provisioner "local-exec" {
    when    = destroy
    command = "echo OK"
  }

  # Create validates FIFO suffix
  provisioner "local-exec" {
    when    = create
    command = local.fifo_ok ? "echo OK" : "powershell -Command \"Write-Error 'ERROR: topic_name must end with .fifo when fifo=true'; exit 1\""
  }
}

# -------------------------------------------------------------------------------------------------
# SNS Topic
# -------------------------------------------------------------------------------------------------
resource "aws_sns_topic" "sns_topic" {
  name                         = var.topic_name
  fifo_topic                   = var.fifo
  content_based_deduplication  = var.fifo ? var.content_based_deduplication : null
  kms_master_key_id            = var.kms_master_key_id
  delivery_policy              = var.topic_delivery_policy

  application_success_feedback_role_arn    = var.application_success_feedback_role_arn
  application_success_feedback_sample_rate = var.application_success_feedback_sample_rate
  application_failure_feedback_role_arn    = var.application_failure_feedback_role_arn
  http_success_feedback_role_arn           = var.http_success_feedback_role_arn
  http_success_feedback_sample_rate        = var.http_success_feedback_sample_rate
  http_failure_feedback_role_arn           = var.http_failure_feedback_role_arn

  tags = var.tags

  depends_on = [null_resource.sns_fifo_name_guard]
}

# -------------------------------------------------------------------------------------------------
# SNS Topic IAM Policy (always at least one statement)
# -------------------------------------------------------------------------------------------------
data "aws_iam_policy_document" "sns_topic_policy_doc" {
  # Base: full owner access
  statement {
    sid     = "AllowOwnerFullAccess"
    effect  = "Allow"
   actions = [
  "SNS:Publish",
  "SNS:Subscribe",
  "SNS:Receive"
]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.sns_caller.account_id}:root"]
    }
    resources = [aws_sns_topic.sns_topic.arn]
  }

  # Conditional: CloudWatch Alarms
  dynamic "statement" {
    for_each = var.allow_cloudwatch_alarms ? [1] : []
    content {
      sid     = "AllowCloudWatchAlarmsPublish"
      effect  = "Allow"
      actions = ["SNS:Publish"]
      principals {
        type        = "Service"
        identifiers = ["cloudwatch.amazonaws.com"]
      }
      resources = [aws_sns_topic.sns_topic.arn]
    }
  }

  # Conditional: Specific publishers
  dynamic "statement" {
    for_each = length(var.allowed_publish_arns) > 0 ? [1] : []
    content {
      sid     = "AllowSpecificPublishers"
      effect  = "Allow"
      actions = ["SNS:Publish"]
      principals {
        type        = "AWS"
        identifiers = var.allowed_publish_arns
      }
      resources = [aws_sns_topic.sns_topic.arn]
    }
  }
}

# -------------------------------------------------------------------------------------------------
# SNS Topic Policy Resource
# -------------------------------------------------------------------------------------------------
resource "aws_sns_topic_policy" "sns_topic_policy" {
  arn    = aws_sns_topic.sns_topic.arn
  policy = data.aws_iam_policy_document.sns_topic_policy_doc.json
  depends_on = [
    aws_sns_topic.sns_topic
  ]
}

# -------------------------------------------------------------------------------------------------
# SNS Subscriptions
# -------------------------------------------------------------------------------------------------
resource "aws_sns_topic_subscription" "sns_subscriptions" {
  for_each = {
    for idx, s in var.subscriptions : idx => s
  }

  topic_arn              = aws_sns_topic.sns_topic.arn
  protocol               = each.value.protocol
  endpoint               = each.value.endpoint
  raw_message_delivery   = try(each.value.raw_message_delivery, false)
  filter_policy          = try(each.value.filter_policy, null)
  delivery_policy        = try(each.value.delivery_policy, null)
  redrive_policy         = try(each.value.redrive_policy, null)
  subscription_role_arn  = try(each.value.subscription_role_arn, null)
}
