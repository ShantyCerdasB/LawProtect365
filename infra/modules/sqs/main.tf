/**
 * @file main.tf
 * @module sqs
 * @description
 * Provisions an AWS SQS queue with optional encryption, FIFO configuration,
 * dead-letter queue (DLQ), and redrive policies. Includes tagging for
 * environment and project identification.
 */

########################################
# Locals
########################################

/**
 * @local queue_name
 * @description
 * Constructs a standardized queue name using project, purpose, and environment.
 * Format: `<project>-<purpose>-queue-<env>`.
 */
locals {
  queue_name = "${var.project_name}-${var.queue_purpose}-queue-${var.env}"

  /**
   * @local tags_named
   * @description
   * Merges provided common tags with the queue Name tag.
   */
  tags_named = merge(var.common_tags, { Name = local.queue_name })
}

########################################
# Main SQS Queue
########################################

/**
 * @resource aws_sqs_queue.main_queue
 * @description
 * Creates the primary SQS queue with configurable retention, size limits,
 * encryption, and optional FIFO/content deduplication.
 *
 * Includes an optional redrive policy if a Dead Letter Queue (DLQ) is provided.
 */
resource "aws_sqs_queue" "main_queue" {
  name                        = local.queue_name
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  message_retention_seconds   = var.message_retention_seconds
  delay_seconds               = var.delay_seconds
  max_message_size            = var.max_message_size
  receive_wait_time_seconds   = var.receive_wait_time_seconds
  fifo_queue                  = var.fifo_queue
  content_based_deduplication = var.content_based_deduplication

  # Optional encryption with AWS-managed or custom KMS key
  kms_master_key_id                  = var.kms_key_arn == "" ? null : var.kms_key_arn
  kms_data_key_reuse_period_seconds  = var.kms_data_key_reuse_seconds

  # Optional Redrive policy linking to DLQ
  redrive_policy = var.redrive_policy_enabled && var.dead_letter_queue_arn != "" ? jsonencode({
    deadLetterTargetArn = var.dead_letter_queue_arn
    maxReceiveCount     = var.max_receive_count
  }) : null

  tags = local.tags_named
}

########################################
# Dead Letter Queue (Optional)
########################################

/**
 * @resource aws_sqs_queue.dlq
 * @description
 * Creates an optional Dead Letter Queue (DLQ) for message failure handling.
 *
 * Triggered if `create_dead_letter_queue` is true.
 */
resource "aws_sqs_queue" "dlq" {
  count = var.create_dead_letter_queue ? 1 : 0

  name                      = "${local.queue_name}-dlq"
  message_retention_seconds = var.dlq_message_retention_seconds
  kms_master_key_id         = var.kms_key_arn == "" ? null : var.kms_key_arn

  tags = merge(local.tags_named, { Type = "DLQ" })
}
