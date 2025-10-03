/**
 * @fileoverview Event Publisher Service - Main Terraform Configuration
 * @summary Infrastructure for outbox event processing with DynamoDB Streams
 * @description This service manages the outbox table, OutboxStreamHandler Lambda,
 * and all related infrastructure for real-time event publishing across microservices.
 */

# Outbox DynamoDB Table
module "outbox_table" {
  source = "../../modules/dynamodb"
  
  table_name = "${var.project_name}-outbox-${var.env}"
  hash_key   = "pk"
  range_key  = "sk"
  
  # Enable DynamoDB Streams for real-time event processing
  stream_enabled    = true
  stream_view_type  = "NEW_AND_OLD_IMAGES"
  
  global_secondary_indexes = [
    {
      name             = "gsi1"
      hash_key         = "sk"
      hash_key_type    = "S"
      range_key        = "pk"
      range_key_type   = "S"
      projection_type  = "ALL"
    }
  ]
  
  tags = var.tags
}

# OutboxStreamHandler Lambda Function
module "outbox_stream_handler" {
  source = "../../modules/lambda"
  
  function_name = "${var.project_name}-outbox-stream-handler-${var.env}"
  s3_bucket     = var.code_bucket
  s3_key        = "outbox-stream-handler.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role_arn      = module.outbox_stream_role.role_arn
  
  project_name = var.project_name
  env          = var.env
  
  environment_variables = {
    OUTBOX_TABLE_NAME    = module.outbox_table.table_name
    EVENT_BUS_NAME       = var.event_bus_name
    EVENT_SOURCE         = "${var.project_name}.${var.env}.outbox-stream"
    MAX_CONCURRENCY      = "10"
    MAX_RETRIES          = "3"
    RETRY_DELAY_MS       = "1000"
  }
}

# IAM Role for OutboxStreamHandler
module "outbox_stream_role" {
  source = "../../modules/iam-role"
  
  role_name = "${var.project_name}-outbox-stream-role-${var.env}"
  
  project_name = var.project_name
  env          = var.env
  
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  
        inline_policies = {
          "dynamodb-streams-read" = data.aws_iam_policy_document.dynamodb_streams_read.json
          "eventbridge-publish"   = data.aws_iam_policy_document.eventbridge_publisher.json
        }
}

# DynamoDB Streams Event Source Mapping
resource "aws_lambda_event_source_mapping" "outbox_stream_mapping" {
  event_source_arn                   = module.outbox_table.stream_arn
  function_name                      = module.outbox_stream_handler.lambda_function_arn
  starting_position                  = "LATEST"
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  
  depends_on = [
    module.outbox_stream_handler,
    module.outbox_table
  ]
}

# Lambda Alias for CodeDeploy
resource "aws_lambda_alias" "outbox_stream_handler_alias" {
  name             = "outbox-stream-handler-alias"
  description      = "Alias for outbox stream handler Lambda function"
  function_name    = module.outbox_stream_handler.lambda_function_name
  function_version = "$LATEST"
  
  lifecycle {
    ignore_changes = [function_version]
  }
}