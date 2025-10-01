/**
 * @fileoverview Lambda Layer Module Variables
 * @summary Input variables for Lambda layer module
 * @description Defines all input parameters required for creating Lambda layers
 */

variable "layer_name" {
  description = "Name of the Lambda layer"
  type        = string
}

variable "s3_bucket" {
  description = "S3 bucket containing the layer zip file"
  type        = string
}

variable "s3_key" {
  description = "S3 key of the layer zip file"
  type        = string
}

variable "compatible_runtimes" {
  description = "List of compatible runtimes for the layer"
  type        = list(string)
  default     = ["nodejs20.x"]
}

variable "description" {
  description = "Description of the Lambda layer"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "env" {
  description = "Environment name"
  type        = string
}
