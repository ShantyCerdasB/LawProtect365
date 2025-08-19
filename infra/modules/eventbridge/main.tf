/**
 * Custom EventBridge event bus for the project/environment.
 */
resource "aws_cloudwatch_event_bus" "event_bus" {
  name = "${var.project_name}-event-bus-${var.env}"
  tags = var.common_tags
}

/**
 * Optional EventBridge rule on the custom bus.
 */
resource "aws_cloudwatch_event_rule" "event_rule" {
  count          = var.create_rule ? 1 : 0
  name           = "${var.project_name}-event-rule-${var.env}"
  description    = var.rule_description
  event_bus_name = aws_cloudwatch_event_bus.event_bus.name

  # Provide one of the following (not both):
  event_pattern       = var.event_pattern
  schedule_expression = var.schedule_expression

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-event-rule-${var.env}"
  })
}

/**
 * Optional target attached to the rule.
 */
resource "aws_cloudwatch_event_target" "event_target" {
  count          = var.create_rule && var.create_target ? 1 : 0
  rule           = aws_cloudwatch_event_rule.event_rule[0].name
  arn            = var.target_arn
  event_bus_name = aws_cloudwatch_event_bus.event_bus.name
  target_id      = "${var.project_name}-event-target-${var.env}"
}

/**
 * Grants EventBridge permission to invoke the target Lambda (when applicable).
 */
resource "aws_lambda_permission" "allow_events_invoke" {
  count         = var.create_rule && var.create_target && var.target_type == "lambda" ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge-${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = var.target_arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.event_rule[0].arn
}
