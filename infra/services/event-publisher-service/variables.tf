/**
 * @fileoverview Event Publisher Service - Variables
 * @summary Input variables for the event publisher service
 * @description Defines all input variables required by the event publisher service
 * for configuration and resource naming.
 */

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "AWS region for resources"
  type        = string
}

variable "code_bucket" {
  description = "S3 bucket name for Lambda deployment packages"
  type        = string
}

variable "event_bus_name" {
  description = "EventBridge bus name for event publishing"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Optional: Secrets Manager ARN for the database secret (grants Lambda read access)
variable "db_secret_arn" {
  description = "Secrets Manager ARN for the database credentials/URL"
  type        = string
  default     = ""
}

# Optional: KMS key ARN if the DB secret uses a customer-managed CMK
variable "db_kms_key_arn" {
  description = "KMS key ARN used to encrypt the DB secret (optional)"
  type        = string
  default     = ""
}