/**
 * @fileoverview Event Publisher Service - IAM Policy Documents
 * @summary IAM policy documents for the event publisher service
 * @description Defines IAM policies for DynamoDB Streams access and EventBridge publishing
 * required by the OutboxStreamHandler Lambda function.
 */

# Lambda assume role policy
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid    = "LambdaAssumeRole"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# DynamoDB Streams read policy
data "aws_iam_policy_document" "dynamodb_streams_read" {
  statement {
    sid    = "DynamoDBStreamsRead"
    effect = "Allow"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams"
    ]
    resources = [module.outbox_table.stream_arn]
  }
}

# EventBridge publish policy
data "aws_iam_policy_document" "eventbridge_publisher" {
  statement {
    sid    = "EventBridgePublish"
    effect = "Allow"
    actions = [
      "events:PutEvents"
    ]
    resources = ["arn:aws:events:${var.region}:*:event-bus/${var.event_bus_name}"]
  }
}

# Grant read access to the DB secret
data "aws_iam_policy_document" "db_secret_read" {
  statement {
    sid     = "ReadDbSecret"
    effect  = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [var.db_secret_arn]
  }
}

# Optional: Allow decrypt on the CMK used by the secret (if customer-managed)
data "aws_iam_policy_document" "kms_decrypt_db" {
  count = length(var.db_kms_key_arn) > 0 ? 1 : 0
  statement {
    sid     = "KmsDecryptDbSecret"
    effect  = "Allow"
    actions = ["kms:Decrypt"]
    resources = [var.db_kms_key_arn]
  }
}