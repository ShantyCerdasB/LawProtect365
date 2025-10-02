// Configure Terraform core and all cloud providers:
// - Locks Terraform to >=1.3.0
// - Pins AWS, Google and AzureAD providers to safe minor ranges
// - Reads AWS region and GCP project/region from variables

terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "aws" {
  region = var.region
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "azuread" {
}

provider "aws" {
  alias  = "acm"
  region = "us-east-1"
}
