output "bucket_id" {
  description = "The name (ID) of the S3 bucket."
  value       = aws_s3_bucket.main_bucket.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket."
  value       = aws_s3_bucket.main_bucket.arn
}

output "bucket_domain_name" {
  description = "The DNS domain name of the S3 bucket (for website hosting if enabled)."
  value       = aws_s3_bucket.main_bucket.bucket_domain_name
}

output "bucket_region" {
  description = "The region the bucket resides in."
  value       = aws_s3_bucket.main_bucket.region
}
