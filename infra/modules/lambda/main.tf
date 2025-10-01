/**
 * Provisions an IAM role (optional) and an AWS Lambda function whose code is stored in S3.
 *
 * If `role_arn` is not provided, this module creates an IAM role with the required permissions.
 */

/**
 * IAM role for Lambda execution (created only if `role_arn` is NOT provided).
 */
resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}-role-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

/**
 * Attaches the AWS managed policy for basic Lambda execution (CloudWatch Logs).
 */
resource "aws_iam_role_policy_attachment" "exec_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

/**
 * Attaches AWS X-Ray daemon write access policy if X-Ray tracing is enabled.
 */
resource "aws_iam_role_policy_attachment" "xray_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

/**
 * Creates the AWS Lambda function using code from S3.
 *
 * Uses the provided `role_arn` if specified, otherwise uses the role created above.
 * Includes optional X-Ray tracing configuration and environment variables.
 */
resource "aws_lambda_function" "func" {
  function_name = "${var.function_name}-${var.env}"
  s3_bucket     = var.s3_bucket
  s3_key        = var.s3_key
  handler       = var.handler
  runtime       = var.runtime
  memory_size   = var.memory_size
  timeout       = var.timeout

  role = var.role_arn != null ? var.role_arn : aws_iam_role.lambda_exec.arn

  tracing_config {
    mode = var.xray_tracing ? "Active" : "PassThrough"
  }

  layers = var.layers

  environment {
    variables = merge(
      {
        PROJECT = var.project_name
        ENV     = var.env
      },
      var.environment_variables
    )
  }

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}
