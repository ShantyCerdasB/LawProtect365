############################################
# EventBridge Bus
############################################
/**
 * Creates an Amazon EventBridge custom event bus.
 * The bus serves as a channel to receive and route events between services.
 */
resource "aws_eventbridge_bus" "event_bus" {
  name = "${var.project_name}-event-bus-${var.env}"
}

############################################
# EventBridge Rule
############################################
/**
 * Creates an EventBridge rule that matches incoming events based on an event pattern
 * or runs on a schedule using cron/rate expressions.
 */
resource "aws_eventbridge_rule" "event_rule" {
  name                 = "${var.project_name}-event-rule-${var.env}"
  description          = var.rule_description
  event_bus_name       = aws_eventbridge_bus.event_bus.name
  event_pattern        = var.event_pattern
  schedule_expression  = var.schedule_expression

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-event-rule-${var.env}"
    }
  )
}

############################################
# EventBridge Target
############################################
/**
 * Associates a target with the EventBridge rule.
 * The target receives the events matched or scheduled by the rule.
 */
resource "aws_eventbridge_target" "event_target" {
  rule      = aws_eventbridge_rule.event_rule.name
  arn       = var.target_arn
  target_id = "${var.project_name}-event-target-${var.env}"
}