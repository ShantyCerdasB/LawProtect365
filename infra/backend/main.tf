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
