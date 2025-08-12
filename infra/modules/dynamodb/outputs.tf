/**
 * Exposes the DynamoDB table name.
 */
output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.table.name
}

/**
 * Exposes the DynamoDB table ARN for referencing in other modules or services.
 */
output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.table.arn
}

/**
 * Exposes the DynamoDB Streams ARN, if streams are enabled.
 * Returns an empty string if streams are disabled.
 */
output "stream_arn" {
  description = "Stream ARN (if enabled)"
  value       = try(aws_dynamodb_table.table.stream_arn, "")
}
