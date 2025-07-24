terraform {
  backend "s3" {
    bucket         = "<TU_BUCKET_TFSTATE>"
    key            = "lawprotect365/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "<TU_DYNAMODB_LOCK_TABLE>"
  }
}
