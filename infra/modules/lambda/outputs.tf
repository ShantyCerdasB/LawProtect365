/**
 * Name of the AWS Lambda function.
 */
output "lambda_function_name" {
  description = "The name of the Lambda function."
  value       = aws_lambda_function.func.function_name
}

/**
 * ARN of the AWS Lambda function.
 */
output "lambda_function_arn" {
  description = "The ARN of the Lambda function."
  value       = aws_lambda_function.func.arn
}

/**
 * ARN of the IAM execution role assumed by the Lambda function.
 * This may be a provided role or one created by the module.
 */
output "execution_role_arn" {
  description = "The IAM role ARN assumed by the function (either provided or created)."
  value       = var.role_arn != null && var.role_arn != "" ? var.role_arn : aws_iam_role.lambda_exec.arn
}
