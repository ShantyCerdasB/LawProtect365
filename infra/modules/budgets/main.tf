/**
 * @file Provisions AWS Budgets for overall and per-service cost tracking,
 * optional SNS notifications, email subscriptions, and an optional
 * CloudWatch dashboard with Cost Explorer quick links.
 */

########################################
# Locals: naming, dashboard text, notifications
########################################

/**
 * @local name_prefix
 * Base prefix for all budget-related resources, combining project and environment.
 *
 * @local dashboard_name
 * Name of the CloudWatch dashboard (defaults to `<project>-<env>-budgets`).
 *
 * @local sns_topic_name
 * Name of the SNS topic for budget alerts (defaults to `<project>-<env>-budgets-alerts`).
 *
 * @local dashboard_region
 * AWS region where the Cost Explorer dashboard will be linked.
 *
 * @local ce_base_url
 * Base URL for AWS Cost Explorer in the specified region.
 *
 * @local services_links
 * Markdown links to Cost Explorer filtered per service tag.
 *
 * @local services_section
 * Markdown section for quick service links in the dashboard.
 *
 * @local dashboard_markdown
 * Final Markdown body for the CloudWatch dashboard.
 *
 * @local notifications
 * List of base notification objects for ACTUAL and FORECASTED thresholds, populated with subscriber emails.
 */
locals {
  name_prefix    = "${var.project}-${var.environment}"
  dashboard_name = coalesce(var.dashboard_name, "${local.name_prefix}-budgets")
  sns_topic_name = coalesce(var.sns_topic_name, "${local.name_prefix}-budgets-alerts")
  dashboard_region = coalesce(var.dashboard_region, var.aws_region, "us-east-1")
  ce_base_url = "https://console.aws.amazon.com/cost-management/home?region=${local.dashboard_region}#/explorer"

  services_links = [
    for s in var.dashboard_services :
    "- [${s}](${local.ce_base_url})  \n  _Tip: in CE, filter by Tag `Service=${s}`_"
  ]

  services_section = length(local.services_links) > 0 ? join("\n", concat(["## Services"], local.services_links)) : "_Add `dashboard_services` to render quick links per microservice._"

  dashboard_markdown = <<EOF
# Cost Explorer quick links
Project: **${var.project}** — Env: **${var.environment}**
${local.services_section}

---

## Budgets
- See **AWS Budgets** console: https://console.aws.amazon.com/cost-management/home?region=${local.dashboard_region}#/budgets
EOF

  notifications = flatten([
    for p in var.threshold_percentages : [
      {
        comparison_operator        = "GREATER_THAN"
        notification_type          = "ACTUAL"
        threshold                  = p
        threshold_type             = "PERCENTAGE"
        subscriber_email_addresses = var.notify_emails
        subscriber_sns_topic_arns  = []
      },
      {
        comparison_operator        = "GREATER_THAN"
        notification_type          = "FORECASTED"
        threshold                  = p
        threshold_type             = "PERCENTAGE"
        subscriber_email_addresses = var.notify_emails
        subscriber_sns_topic_arns  = []
      }
    ]
  ])
}

########################################
# Locals: SNS selection and email mapping
########################################

/**
 * @local use_existing_sns
 * Boolean indicating if an existing SNS topic ARN should be used.
 *
 * @local created_topic_arn
 * ARN of the newly created SNS topic (if applicable).
 *
 * @local sns_topic_arn
 * Final SNS topic ARN to use for notifications.
 *
 * @local notifications_with_sns
 * List of notification objects with SNS topic ARNs injected.
 *
 * @local emails_map
 * Map of email addresses for creating subscriptions.
 */
locals {
  use_existing_sns  = try(length(trim(var.existing_sns_topic_arn)) > 0, false)
  created_topic_arn = (var.create_sns_topic && !local.use_existing_sns) ? one(aws_sns_topic.budget_alerts[*].arn) : null
  sns_topic_arn     = local.use_existing_sns ? var.existing_sns_topic_arn : local.created_topic_arn
  notifications_with_sns = [for n in local.notifications : merge(n, { subscriber_sns_topic_arns = local.sns_topic_arn != null ? [local.sns_topic_arn] : [] })]
  emails_map = { for e in var.notify_emails : e => e }
}

########################################
# SNS Topic (optional)
########################################

/**
 * @resource aws_sns_topic.budget_alerts
 * Creates an SNS topic for budget alerts if requested and no external ARN is provided.
 */
resource "aws_sns_topic" "budget_alerts" {
  count             = (var.create_sns_topic && !local.use_existing_sns) ? 1 : 0
  name              = local.sns_topic_name
  kms_master_key_id = var.kms_master_key_id
  tags = merge(var.common_tags, { Name = local.sns_topic_name, Project = var.project, Environment = var.environment })
}

########################################
# Email Subscriptions
########################################

/**
 * @resource aws_sns_topic_subscription.email_subs_existing
 * Subscribes provided emails to an existing SNS topic ARN.
 */
resource "aws_sns_topic_subscription" "email_subs_existing" {
  for_each = local.use_existing_sns ? local.emails_map : {}
  topic_arn = var.existing_sns_topic_arn
  protocol  = "email"
  endpoint  = each.value
}

/**
 * @resource aws_sns_topic_subscription.email_subs_new
 * Subscribes provided emails to the newly created SNS topic.
 */
resource "aws_sns_topic_subscription" "email_subs_new" {
  for_each = (!local.use_existing_sns && var.create_sns_topic) ? local.emails_map : {}
  topic_arn = one(aws_sns_topic.budget_alerts[*].arn)
  protocol  = "email"
  endpoint  = each.value
}

########################################
# Overall Budget (optional)
########################################

/**
 * @resource aws_budgets_budget.overall
 * Creates an overall monthly cost budget with optional cost filters and notifications.
 */
resource "aws_budgets_budget" "overall" {
  count        = var.create_overall_budget ? 1 : 0
  name         = "${local.name_prefix}-${var.overall_budget_name}"
  budget_type  = "COST"
  limit_amount = var.overall_budget_amount
  limit_unit   = var.budget_currency
  time_unit    = "MONTHLY"

  dynamic "cost_filter" {
    for_each = try(var.overall_cost_filters.TagKeyValue, [])
    content {
      name   = "TagKeyValue"
      values = [for v in var.overall_cost_filters.TagKeyValue : v]
    }
  }

  dynamic "notification" {
    for_each = local.notifications_with_sns
    content {
      comparison_operator        = notification.value.comparison_operator
      notification_type          = notification.value.notification_type
      threshold                  = notification.value.threshold
      threshold_type             = notification.value.threshold_type
      subscriber_email_addresses = notification.value.subscriber_email_addresses
      subscriber_sns_topic_arns  = notification.value.subscriber_sns_topic_arns
    }
  }
}

########################################
# Per-service Budgets
########################################

/**
 * @resource aws_budgets_budget.service
 * Creates a monthly cost budget per service, filtered by service tag or provided filters.
 */
resource "aws_budgets_budget" "service" {
  for_each     = { for b in var.service_budgets : b.name => b }
  name         = "${local.name_prefix}-${each.value.name}-monthly-budget"
  budget_type  = "COST"
  limit_amount = each.value.amount
  limit_unit   = var.budget_currency
  time_unit    = "MONTHLY"

  dynamic "cost_filter" {
    for_each = (length(lookup(each.value, "cost_filters", {})) > 0 && length(lookup(each.value.cost_filters, "TagKeyValue", [])) > 0) ? lookup(each.value.cost_filters, "TagKeyValue", []) : ["Service$${each.value.name}"]
    content {
      name   = "TagKeyValue"
      values = [cost_filter.value]
    }
  }

  dynamic "notification" {
    for_each = local.notifications_with_sns
    content {
      comparison_operator        = notification.value.comparison_operator
      notification_type          = notification.value.notification_type
      threshold                  = notification.value.threshold
      threshold_type             = notification.value.threshold_type
      subscriber_email_addresses = notification.value.subscriber_email_addresses
      subscriber_sns_topic_arns  = notification.value.subscriber_sns_topic_arns
    }
  }
}

########################################
# CloudWatch Dashboard (optional)
########################################

/**
 * @resource aws_cloudwatch_dashboard.budgets
 * Creates a CloudWatch dashboard containing Cost Explorer quick links and budget references.
 */
resource "aws_cloudwatch_dashboard" "budgets" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = local.dashboard_name
  dashboard_body = jsonencode({
    widgets = [{
      type       = "text",
      x          = 0,
      y          = 0,
      width      = 24,
      height     = 10,
      properties = { markdown = local.dashboard_markdown }
    }]
  })
}
