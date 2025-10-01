// Defines the S3 bucket for Terraform remote state,
// plus separate resources for versioning and encryption
// (to avoid deprecated inline blocks).
// The DynamoDB lock table remains commented out for solo work.


locals {
  bucket_name = "${var.project_name}-${var.env}-tfstate-${var.region}"
  # lock_table_name = "${var.project_name}-tfstate-locks-${var.env}"
}

# 1) Core state bucket
resource "aws_s3_bucket" "state" {
  bucket = local.bucket_name

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# 2) Dedicated versioning resource (replaces deprecated inline block)
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

# 3) Dedicated SSE configuration (replaces deprecated inline block)
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4) Public access block for security
resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  
  depends_on = [aws_s3_bucket.state]
}

# 5) HTTPS-only policy for security
resource "aws_s3_bucket_policy" "state_https_only" {
  bucket = aws_s3_bucket.state.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.state.arn,
          "${aws_s3_bucket.state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
  
  depends_on = [aws_s3_bucket.state]
}

# 6) Bucket logging for audit trail
resource "aws_s3_bucket_logging" "state" {
  bucket = aws_s3_bucket.state.id
  target_bucket = aws_s3_bucket.state.id
  target_prefix = "logs/"
  
  depends_on = [aws_s3_bucket.state]
}

/*
# 4) DynamoDB lock table (commented out for now)
resource "aws_dynamodb_table" "locks" {
  name         = local.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}
*/
