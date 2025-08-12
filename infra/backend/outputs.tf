// Exposes the key identifiers for the Terraform remote‐state resources:
// - state_bucket_name: the S3 bucket name where Terraform stores its state.
// - state_bucket_arn : the ARN of that S3 bucket.
// - lock_table_name  : (optional) DynamoDB table for state locks (commented out).

output "state_bucket_name" {
  description = "Name of the S3 bucket holding Terraform remote state."
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket holding Terraform remote state."
  value       = aws_s3_bucket.state.arn
}

# Uncomment to export the DynamoDB lock table name when locking is enabled:
# output "lock_table_name" {
#   description = "Name of the DynamoDB table used by Terraform for state locks."
#   value       = aws_dynamodb_table.locks.name
# }
