terraform {
  backend "s3" {
    bucket         = "lawprotect365-dev-tfstate-us-east-1"
    key            = "lawprotect365/dev/terraform.tfstate"
    region         = "us-east-1"
    profile        = "lawprotect365"
    # Uncomment and set once you have your DynamoDB lock table created:
    # dynamodb_table = "lawprotect365-tfstate-locks-dev"
  }
}
