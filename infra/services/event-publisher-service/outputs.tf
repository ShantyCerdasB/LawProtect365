/**
 * @fileoverview Event Publisher Service - Outputs
 * @summary Output values from the event publisher service
 * @description Exports key resource identifiers and configuration values
 * for use by other services and the root infrastructure.
 */

output "outbox_table_name" {
  description = "Name of the outbox DynamoDB table"
  value       = module.outbox_table.table_name
}

output "outbox_table_arn" {
  description = "ARN of the outbox DynamoDB table"
  value       = module.outbox_table.table_arn
}

output "outbox_table_stream_arn" {
  description = "ARN of the outbox DynamoDB table stream"
  value       = module.outbox_table.stream_arn
}

output "lambda_function_arn" {
  description = "ARN of the OutboxStreamHandler Lambda function"
  value       = module.outbox_stream_handler.lambda_function_arn
}

output "lambda_function_name" {
  description = "Name of the OutboxStreamHandler Lambda function"
  value       = module.outbox_stream_handler.lambda_function_name
}

output "iam_role_arn" {
  description = "ARN of the OutboxStreamHandler IAM role"
  value       = module.outbox_stream_role.role_arn
}

output "lambda_alias_name" {
  description = "Name of the OutboxStreamHandler Lambda alias"
  value       = aws_lambda_alias.outbox_stream_handler_alias.name
}