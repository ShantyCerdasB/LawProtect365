/**
 * @file Output values for the AWS CloudWatch Monitoring module.
 * Exposes key attributes of log groups, alarms, and dashboards for use by other modules.
 */

########################################
# Log groups
########################################

/**
 * @output lambda_log_group_names
 * List of log group names created for Lambda functions.
 *
 * @type list(string)
 * @example ["/aws/lambda/my-function-1", "/aws/lambda/my-function-2"]
 */
output "lambda_log_group_names" {
  description = "Log group names created for Lambda functions"
  value       = [for lg in aws_cloudwatch_log_group.lambda : lg.name]
}

/**
 * @output apigw_log_group_name
 * The name of the API Gateway log group if created.
 *
 * @type string|null
 * @example "/aws/apigateway/my-api"
 */
output "apigw_log_group_name" {
  description = "API Gateway log group name (if created)"
  value       = try(aws_cloudwatch_log_group.apigw[0].name, null)
}

########################################
# Dashboard
########################################

/**
 * @output dashboard_name
 * The name of the CloudWatch dashboard if created.
 *
 * @type string|null
 * @example "my-service-dev"
 */
output "dashboard_name" {
  description = "CloudWatch dashboard name (if created)"
  value       = try(aws_cloudwatch_dashboard.service[0].dashboard_name, null)
}

########################################
# Lambda alarms
########################################

/**
 * @output lambda_error_alarm_arns
 * List of ARNs for Lambda error alarms.
 *
 * @type list(string)
 */
output "lambda_error_alarm_arns" {
  description = "Lambda error alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.lambda_errors : a.arn]
}

/**
 * @output lambda_throttle_alarm_arns
 * List of ARNs for Lambda throttle alarms.
 *
 * @type list(string)
 */
output "lambda_throttle_alarm_arns" {
  description = "Lambda throttle alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.lambda_throttles : a.arn]
}

/**
 * @output lambda_p95_duration_alarm_arns
 * List of ARNs for Lambda p95 duration alarms.
 *
 * @type list(string)
 */
output "lambda_p95_duration_alarm_arns" {
  description = "Lambda p95 duration alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.lambda_p95_duration : a.arn]
}

########################################
# API Gateway alarms
########################################

/**
 * @output apigw_5xx_alarm_arn
 * ARN of the API Gateway 5XX alarm if created.
 *
 * @type string
 */
output "apigw_5xx_alarm_arn" {
  description = "API Gateway 5XX alarm ARN (if created)"
  value       = aws_cloudwatch_metric_alarm.apigw_5xx.arn
}

/**
 * @output apigw_latency_p99_alarm_arn
 * ARN of the API Gateway p99 latency alarm if created.
 *
 * @type string
 */
output "apigw_latency_p99_alarm_arn" {
  description = "API Gateway p99 latency alarm ARN (if created)"
  value       = aws_cloudwatch_metric_alarm.apigw_latency_p99.arn
}

########################################
# DynamoDB alarms
########################################

/**
 * @output dynamodb_read_throttle_alarm_arns
 * List of ARNs for DynamoDB read throttle alarms.
 *
 * @type list(string)
 */
output "dynamodb_read_throttle_alarm_arns" {
  description = "DynamoDB read throttle alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.dynamodb_read_throttles : a.arn]
}

/**
 * @output dynamodb_write_throttle_alarm_arns
 * List of ARNs for DynamoDB write throttle alarms.
 *
 * @type list(string)
 */
output "dynamodb_write_throttle_alarm_arns" {
  description = "DynamoDB write throttle alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.dynamodb_write_throttles : a.arn]
}

########################################
# SQS alarms
########################################

/**
 * @output sqs_oldest_age_alarm_arns
 * List of ARNs for SQS oldest message age alarms.
 *
 * @type list(string)
 */
output "sqs_oldest_age_alarm_arns" {
  description = "SQS age alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.sqs_oldest_age : a.arn]
}

/**
 * @output sqs_visible_messages_alarm_arns
 * List of ARNs for SQS visible messages alarms.
 *
 * @type list(string)
 */
output "sqs_visible_messages_alarm_arns" {
  description = "SQS depth alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.sqs_visible_messages : a.arn]
}

########################################
# EventBridge alarms
########################################

/**
 * @output eventbridge_failed_alarm_arns
 * List of ARNs for EventBridge failed invocation alarms.
 *
 * @type list(string)
 */
output "eventbridge_failed_alarm_arns" {
  description = "EventBridge failed invocation alarm ARNs"
  value       = [for a in aws_cloudwatch_metric_alarm.eventbridge_failed : a.arn]
}

########################################
# Aggregated outputs
########################################

/**
 * @output all_alarm_arns
 * Flattened list of all CloudWatch alarm ARNs created by this module.
 *
 * @type list(string)
 */
output "all_alarm_arns" {
  description = "Flattened list of all CloudWatch alarm ARNs created by this module"
  value       = concat(
    [for a in aws_cloudwatch_metric_alarm.lambda_errors           : a.arn],
    [for a in aws_cloudwatch_metric_alarm.lambda_throttles        : a.arn],
    [for a in aws_cloudwatch_metric_alarm.lambda_p95_duration     : a.arn],
    try([aws_cloudwatch_metric_alarm.apigw_5xx.arn], []),
    try([aws_cloudwatch_metric_alarm.apigw_latency_p99.arn], []),
    [for a in aws_cloudwatch_metric_alarm.dynamodb_read_throttles : a.arn],
    [for a in aws_cloudwatch_metric_alarm.dynamodb_write_throttles: a.arn],
    [for a in aws_cloudwatch_metric_alarm.sqs_oldest_age           : a.arn],
    [for a in aws_cloudwatch_metric_alarm.sqs_visible_messages     : a.arn],
    [for a in aws_cloudwatch_metric_alarm.eventbridge_failed       : a.arn]
  )
}

/**
 * @output region
 * AWS region where the CloudWatch resources are deployed.
 *
 * @type string
 * @example "us-east-1"
 */
output "region" {
  description = "AWS region where the CloudWatch resources are deployed"
  value       = data.aws_region.current.name
}
