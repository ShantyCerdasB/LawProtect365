/**
 * @file Output values for the AWS API Gateway HTTP API module.
 * Provides key identifiers, ARNs, endpoints, and configuration details
 * for referencing in other Terraform modules or external systems.
 */

/**
 * @output api_id
 * Unique identifier for the HTTP API Gateway.
 *
 * @description Used for referencing the API in other resources or modules.
 * @value aws_apigatewayv2_api.api_gateway.id
 */
output "api_id" {
  description = "ID of the HTTP API"
  value       = aws_apigatewayv2_api.api_gateway.id
}

/**
 * @output api_arn
 * Execution ARN of the HTTP API Gateway.
 *
 * @description Required when configuring IAM permissions for invoking the API.
 * @value aws_apigatewayv2_api.api_gateway.execution_arn
 */
output "api_arn" {
  description = "Execution ARN for IAM permissions"
  value       = aws_apigatewayv2_api.api_gateway.execution_arn
}

/**
 * @output api_endpoint
 * Base invoke URL for the HTTP API Gateway.
 *
 * @description Used as the root endpoint for making API requests.
 * @value aws_apigatewayv2_api.api_gateway.api_endpoint
 */
output "api_endpoint" {
  description = "Invoke URL base for the HTTP API"
  value       = aws_apigatewayv2_api.api_gateway.api_endpoint
}

/**
 * @output stage_name
 * Name of the deployed API Gateway stage.
 *
 * @description Useful for building the full invoke URL and managing deployments.
 * @value aws_apigatewayv2_stage.stage.name
 */
output "stage_name" {
  description = "Name of the stage"
  value       = aws_apigatewayv2_stage.stage.name
}

/**
 * @output stage_arn
 * ARN of the deployed API Gateway stage.
 *
 * @description Used for associating WAFv2 Web ACLs or applying IAM policies to the stage.
 * @value aws_apigatewayv2_stage.stage.arn
 */
output "stage_arn" {
  description = "Stage ARN (useful for WAF association or IAM)"
  value       = aws_apigatewayv2_stage.stage.arn
}

/**
 * @output invoke_url
 * Full invoke URL including the stage name.
 *
 * @description Directly usable for sending HTTP requests to the deployed API.
 * @value Interpolated from API endpoint and stage name.
 */
output "invoke_url" {
  description = "Full invoke URL including stage"
  value       = "${aws_apigatewayv2_api.api_gateway.api_endpoint}/${aws_apigatewayv2_stage.stage.name}"
}

/**
 * @output access_log_group_name
 * Name of the CloudWatch Log Group used for API Gateway access logs.
 *
 * @description Returns `null` if access logs are not enabled.
 * @value aws_cloudwatch_log_group.access_logs[0].name
 */
output "access_log_group_name" {
  description = "CloudWatch Log Group used by API access logs (if enabled)"
  value       = try(aws_cloudwatch_log_group.access_logs[0].name, null)
}

/**
 * @output routes
 * Mapping of route keys to their corresponding integration IDs.
 *
 * @description Useful for debugging and referencing integration configurations.
 * @value Map derived from aws_apigatewayv2_integration.integrations
 */
output "routes" {
  description = "Map of route keys to integration IDs"
  value       = { for k, v in aws_apigatewayv2_integration.integrations : k => v.id }
}
