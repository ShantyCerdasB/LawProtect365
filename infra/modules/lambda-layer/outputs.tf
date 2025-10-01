/**
 * @fileoverview Lambda Layer Module Outputs
 * @summary Output values for Lambda layer module
 * @description Exposes layer ARN and version for use by other modules
 */

output "layer_arn" {
  description = "ARN of the Lambda layer version"
  value       = aws_lambda_layer_version.layer.arn
}

output "layer_version" {
  description = "Version number of the Lambda layer"
  value       = aws_lambda_layer_version.layer.version
}

output "layer_name" {
  description = "Name of the Lambda layer"
  value       = aws_lambda_layer_version.layer.layer_name
}
