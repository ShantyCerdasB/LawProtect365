// Defines the inputs required to configure Terraform remote‐state:
// - project_name: prefix used in resource names
// - env         : deployment environment ("dev" or "prod")
// - region      : AWS region for state bucket

variable "project_name" {
  description = "Project prefix for Terraform state resources."
  type        = string
}

variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}

variable "region" {
  description = "AWS region to host the S3 bucket."
  type        = string
  default     = "us-east-1"
}
