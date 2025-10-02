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
