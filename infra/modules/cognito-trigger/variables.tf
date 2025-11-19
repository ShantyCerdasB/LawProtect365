/**
 * @var user_pool_id
 * @description
 * ID of the existing Cognito User Pool to which the PreAuthentication Lambda will be attached.
 */
variable "user_pool_id" {
  description = "ID of the existing Cognito User Pool."
  type        = string
}

/**
 * @var pre_auth_lambda_arn
 * @description
 * ARN of the Lambda function to set as the PreAuthentication trigger for the User Pool.
 */
variable "pre_auth_lambda_arn" {
  description = "ARN of the Lambda function to set as Pre-authentication trigger."
  type        = string
  default     = ""
}

variable "post_auth_lambda_arn" {
  description = "ARN of the Lambda function to set as Post-authentication trigger."
  type        = string
  default     = ""
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of the Lambda function to set as Post-confirmation trigger."
  type        = string
  default     = ""
}

variable "pre_token_generation_lambda_arn" {
  description = "ARN of the Lambda function to set as Pre-token-generation trigger."
  type        = string
  default     = ""
}
