/**
 * Primary S3 bucket.
 */
resource "aws_s3_bucket" "main_bucket" {
  bucket = var.bucket_name

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

/**
 * Optional S3 bucket versioning.
 */
resource "aws_s3_bucket_versioning" "main_bucket_versioning" {
  count  = var.enable_versioning ? 1 : 0
  bucket = aws_s3_bucket.main_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

/**
 * Optional S3 server-side encryption (AES256).
 */
resource "aws_s3_bucket_server_side_encryption_configuration" "main_bucket_encryption" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.main_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

/**
 * Lifecycle rule to expire non-current object versions after 30 days.
 */
resource "aws_s3_bucket_lifecycle_configuration" "main_bucket_lifecycle" {
  bucket = aws_s3_bucket.main_bucket.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    filter {}
  }
}
