/**
 * @local alarm_actions
 * SNS topic ARNs to trigger when an alarm enters the ALARM state.
 * Empty list if `var.alarm_sns_topic_arn` is null.
 *
 * @local ok_actions
 * SNS topic ARNs to trigger when an alarm returns to the OK state.
 * Empty list if `var.ok_sns_topic_arn` is null.
 *
 * @local tags_merged
 * Combined tags from `var.tags` with module-level tags:
 * - Service: `var.service_name`
 * - Env: `var.env`
 */
locals {
  alarm_actions = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.ok_sns_topic_arn    != null ? [var.ok_sns_topic_arn]    : []

  tags_merged = merge(var.tags, {
    Service = var.service_name
    Env     = var.env
  })
}

############################
# Log groups (Lambda)
############################
/**
 * Creates a CloudWatch Log Group for each Lambda function.
 *
 * @for_each var.lambda_function_names_map
 * @tags local.tags_merged
 */
resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = var.lambda_function_names_map
  name              = "/aws/lambda/${each.value}"
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_arn
  tags              = local.tags_merged
}

############################
# Log group (API Gateway)
############################
/**
 * Creates a CloudWatch Log Group for API Gateway if enabled.
 *
 * @count Created only if:
 *  - var.create_apigw_log_group is true
 *  - var.apigw_log_group_name is not null
 */
resource "aws_cloudwatch_log_group" "apigw" {
  count             = var.create_apigw_log_group && var.apigw_log_group_name != null ? 1 : 0
  name              = var.apigw_log_group_name
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_arn
  tags              = local.tags_merged
}

############################
# Log subscription filters
############################
/**
 * Sends Lambda log events to a destination (e.g., Kinesis, Lambda, Firehose).
 * Created only if var.log_subscription_destination_arn is set.
 */
resource "aws_cloudwatch_log_subscription_filter" "lambda" {
  for_each = var.log_subscription_destination_arn == null ? {} : aws_cloudwatch_log_group.lambda

  name            = "${var.service_name}-${each.key}-sub"
  log_group_name  = each.value.name
  filter_pattern  = var.log_subscription_filter_pattern
  destination_arn = var.log_subscription_destination_arn
  role_arn        = var.log_subscription_role_arn
  depends_on      = [aws_cloudwatch_log_group.lambda]
}

/**
 * Sends API Gateway log events to a destination if subscription is enabled.
 */
resource "aws_cloudwatch_log_subscription_filter" "apigw" {
  count = (var.log_subscription_destination_arn != null && length(aws_cloudwatch_log_group.apigw) == 1) ? 1 : 0

  name            = "${var.service_name}-apigw-sub"
  log_group_name  = aws_cloudwatch_log_group.apigw[0].name
  filter_pattern  = var.log_subscription_filter_pattern
  destination_arn = var.log_subscription_destination_arn
  role_arn        = var.log_subscription_role_arn
  depends_on      = [aws_cloudwatch_log_group.apigw]
}

############################
# Lambda alarms
############################
/**
 * Alarm for Lambda errors exceeding `var.lambda_error_threshold`.
 */
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each          = var.lambda_function_names_map
  alarm_name        = "${var.service_name}-${each.value}-lambda-errors-${var.env}"
  namespace         = "AWS/Lambda"
  metric_name       = "Errors"
  dimensions        = { FunctionName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold         = var.lambda_error_threshold
  evaluation_periods = 1
  period            = var.lambda_period_seconds
  statistic         = "Sum"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}

/**
 * Alarm for Lambda throttles exceeding `var.lambda_throttle_threshold`.
 */
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each          = var.lambda_function_names_map
  alarm_name        = "${var.service_name}-${each.value}-lambda-throttles-${var.env}"
  namespace         = "AWS/Lambda"
  metric_name       = "Throttles"
  dimensions        = { FunctionName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold         = var.lambda_throttle_threshold
  evaluation_periods = 1
  period            = var.lambda_period_seconds
  statistic         = "Sum"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}

/**
 * Alarm for Lambda P95 duration exceeding `var.lambda_p95_duration_threshold_ms`.
 */
resource "aws_cloudwatch_metric_alarm" "lambda_p95_duration" {
  for_each          = var.lambda_function_names_map
  alarm_name        = "${var.service_name}-${each.value}-lambda-p95-duration-${var.env}"
  namespace         = "AWS/Lambda"
  metric_name       = "Duration"
  dimensions        = { FunctionName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold         = var.lambda_p95_duration_threshold_ms
  evaluation_periods = 1
  period            = var.lambda_period_seconds
  extended_statistic = "p95"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}

############################
# API Gateway alarms
############################
/**
 * Alarm for API Gateway 5xx errors exceeding `var.apigw_5xx_threshold`.
 */
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name        = "${var.service_name}-apigw-5xx-${var.env}"
  namespace         = "AWS/ApiGateway"
  metric_name       = "5xx"
  dimensions        = { ApiId = var.apigw_api_id, Stage = var.apigw_stage }
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold         = var.apigw_5xx_threshold
  evaluation_periods = 1
  period            = var.apigw_period_seconds
  statistic         = "Sum"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}

/**
 * Alarm for API Gateway P99 latency exceeding `var.apigw_latency_p99_threshold_ms`.
 */
resource "aws_cloudwatch_metric_alarm" "apigw_latency_p99" {
  alarm_name        = "${var.service_name}-apigw-p99-latency-${var.env}"
  namespace         = "AWS/ApiGateway"
  metric_name       = "Latency"
  dimensions        = { ApiId = var.apigw_api_id, Stage = var.apigw_stage }
  comparison_operator = "GreaterThanThreshold"
  threshold         = var.apigw_latency_p99_threshold_ms
  evaluation_periods = 1
  period            = var.apigw_period_seconds
  extended_statistic = "p99"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}

############################
# DynamoDB alarms
############################
/**
 * Alarm for DynamoDB read throttles exceeding `var.dynamodb_throttle_threshold`.
 */
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttles" {
  for_each          = toset(var.dynamodb_table_names)
  alarm_name        = "${var.service_name}-${each.value}-dynamodb-read-throttle-${var.env}"
  namespace         = "AWS/DynamoDB"
  metric_name       = "ReadThrottleEvents"
  dimensions        = { TableName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold         = var.dynamodb_throttle_threshold
  evaluation_periods = 1
  period            = var.dynamodb_period_seconds
  statistic         = "Sum"
  treat_missing_data = var.treat_missing_data
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
  tags              = local.tags_merged
}
############################
# DynamoDB write throttles alarm
############################
/**
 * Alarm for DynamoDB write throttles exceeding `var.dynamodb_throttle_threshold`.
 *
 * @for_each var.dynamodb_table_names
 * @metric WriteThrottleEvents
 */
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttles" {
  for_each            = toset(var.dynamodb_table_names)
  alarm_name          = "${var.service_name}-${each.value}-dynamodb-write-throttle-${var.env}"
  namespace           = "AWS/DynamoDB"
  metric_name         = "WriteThrottleEvents"
  dimensions          = { TableName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.dynamodb_throttle_threshold
  evaluation_periods  = 1
  period              = var.dynamodb_period_seconds
  statistic           = "Sum"
  treat_missing_data  = var.treat_missing_data
  alarm_actions       = local.alarm_actions
  ok_actions          = local.ok_actions
  tags                = local.tags_merged
}

############################
# SQS alarms
############################
/**
 * Alarm for SQS queues when the oldest message age exceeds `var.sqs_oldest_age_threshold_seconds`.
 *
 * @metric ApproximateAgeOfOldestMessage
 */
resource "aws_cloudwatch_metric_alarm" "sqs_oldest_age" {
  for_each            = toset(var.sqs_queue_names)
  alarm_name          = "${var.service_name}-${each.value}-sqs-oldest-age-${var.env}"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateAgeOfOldestMessage"
  dimensions          = { QueueName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.sqs_oldest_age_threshold_seconds
  evaluation_periods  = 1
  period              = var.sqs_period_seconds
  statistic           = "Maximum"
  treat_missing_data  = var.treat_missing_data
  alarm_actions       = local.alarm_actions
  ok_actions          = local.ok_actions
  tags                = local.tags_merged
}

/**
 * Alarm for SQS queues when the number of visible messages exceeds `var.sqs_visible_messages_threshold`.
 *
 * @metric ApproximateNumberOfMessagesVisible
 */
resource "aws_cloudwatch_metric_alarm" "sqs_visible_messages" {
  for_each            = toset(var.sqs_queue_names)
  alarm_name          = "${var.service_name}-${each.value}-sqs-visible-messages-${var.env}"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.sqs_visible_messages_threshold
  evaluation_periods  = 1
  period              = var.sqs_period_seconds
  statistic           = "Average"
  treat_missing_data  = var.treat_missing_data
  alarm_actions       = local.alarm_actions
  ok_actions          = local.ok_actions
  tags                = local.tags_merged
}

############################
# EventBridge alarms
############################
/**
 * Alarm for EventBridge rules when failed invocations exceed `var.eventbridge_failed_invocations_threshold`.
 *
 * @metric FailedInvocations
 */
resource "aws_cloudwatch_metric_alarm" "eventbridge_failed" {
  for_each            = toset(var.eventbridge_rule_names)
  alarm_name          = "${var.service_name}-${each.value}-eventbridge-failed-${var.env}"
  namespace           = "AWS/Events"
  metric_name         = "FailedInvocations"
  dimensions          = { RuleName = each.value }
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.eventbridge_failed_invocations_threshold
  evaluation_periods  = 1
  period              = var.eventbridge_period_seconds
  statistic           = "Sum"
  treat_missing_data  = var.treat_missing_data
  alarm_actions       = local.alarm_actions
  ok_actions          = local.ok_actions
  tags                = local.tags_merged
}

############################
# Dashboard (optional)
############################
/**
 * Optional CloudWatch dashboard for monitoring Lambda, API Gateway, and other services.
 *
 * Includes:
 * - Lambda Errors
 * - API Gateway 5xx errors
 *
 * @count Created only if `var.create_dashboard` is true.
 */
resource "aws_cloudwatch_dashboard" "service" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "${var.service_name}-${var.env}"
  dashboard_body = jsonencode({
    widgets = [
      # Lambda Errors
      {
        "type" : "metric", "x" : 0, "y" : 0, "width" : 12, "height" : 6,
        "properties" : {
          "title" : "Lambda Errors",
          "metrics" : [
            for f in values(var.lambda_function_names_map) :
            ["AWS/Lambda", "Errors", "FunctionName", f, {"stat" : "Sum"}]
          ],
          "view" : "timeSeries", "stacked" : false, "region" : "${data.aws_region.current.name}",
          "period" : var.lambda_period_seconds
        }
      },
      # API Gateway 5XX
      {
        "type" : "metric", "x" : 12, "y" : 0, "width" : 12, "height" : 6,
        "properties" : {
          "title" : "API Gateway 5XX",
          "metrics" : var.apigw_api_id != null && var.apigw_stage != null ? [
            ["AWS/ApiGateway", "5xx", "ApiId", "${var.apigw_api_id}", "Stage", "${var.apigw_stage}", {"stat" : "Sum"}]
          ] : [],
          "region" : "${data.aws_region.current.name}", "view" : "timeSeries", "stacked" : false,
          "period" : var.apigw_period_seconds
        }
      }
    ]
  })
}

/**
 * Data source to fetch the current AWS region for dashboard metrics.
 */
data "aws_region" "current" {}
