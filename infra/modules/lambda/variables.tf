/**
 * Name of the AWS Lambda function.
 */
variable "function_name" {
  description = "Name of the Lambda function."
  type        = string
}

/**
 * Name of the S3 bucket where the Lambda deployment package is stored.
 */
variable "s3_bucket" {
  description = "S3 bucket where the deployment package is stored."
  type        = string
}

/**
 * Key (path) of the deployment .zip file inside the S3 bucket.
 */
variable "s3_key" {
  description = "Key (path) of the deployment .zip in the S3 bucket."
  type        = string
}

/**
 * Function entry point, specified as `file_name.handler_name`.
 * Example: `index.handler`
 */
variable "handler" {
  description = "Function entrypoint (e.g. index.handler)."
  type        = string
}

/**
 * Runtime environment for the Lambda function.
 * Example values: nodejs18.x, python3.9, java11.
 */
variable "runtime" {
  description = "Lambda runtime (e.g. nodejs18.x, python3.9)."
  type        = string
}

/**
 * Amount of memory (in MB) allocated to the Lambda function.
 * Default: 128 MB
 */
variable "memory_size" {
  description = "Amount of memory (MB) allocated to the function."
  type        = number
  default     = 128
}

/**
 * Maximum time (in seconds) that the Lambda function can run before timing out.
 * Default: 10 seconds
 */
variable "timeout" {
  description = "Function execution timeout in seconds."
  type        = number
  default     = 10
}

/**
 * Map of environment variables to set inside the Lambda function.
 */
variable "environment_variables" {
  description = "Map of environment variables to set in the function."
  type        = map(string)
  default     = {}
}

/**
 * Project prefix used for tagging AWS resources.
 */
variable "project_name" {
  description = "Project prefix used for tagging."
  type        = string
}

/**
 * Deployment environment.
 * Examples: dev, prod
 */
variable "env" {
  description = "Deployment environment (e.g. \"dev\" or \"prod\")."
  type        = string
}

/**
 * ARN of an existing IAM role to assign to the Lambda function.
 * If provided, the module will not create a new role.
 */
variable "role_arn" {
  description = "Existing IAM role ARN for the Lambda. If set, the module does NOT create a role."
  type        = string
  default     = null
}

/**
 * Enables AWS X-Ray active tracing for the Lambda function.
 * If the module creates a role, it will attach the AWSXRayDaemonWriteAccess policy.
 * Default: false
 */
variable "xray_tracing" {
  description = "Enable X-Ray active tracing. If the module creates the role, it will attach AWSXRayDaemonWriteAccess."
  type        = bool
  default     = false
}
