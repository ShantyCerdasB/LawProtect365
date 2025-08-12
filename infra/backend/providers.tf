//
// Configure Terraform and the AWS provider for remote‐state management.
// - Locks Terraform to version 1.3.0 or later.
// - Pins the AWS provider to ~>4.0.
// - Reads the target region from var.region.

terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region
}
