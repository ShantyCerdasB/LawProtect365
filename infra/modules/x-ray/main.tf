locals {
  xray_group_name = "${var.project_name}-xray-group-${var.env}"
  xray_rule_name  = "${var.project_name}-xray-sam-${var.env}"
  tags_named      = merge(var.common_tags, { Name = local.xray_group_name })
}

resource "aws_xray_group" "xray_group" {
  group_name        = local.xray_group_name
  filter_expression = var.group_filter
  tags              = local.tags_named
}

# Default sampling rule (applies broadly; tune via variables)
resource "aws_xray_sampling_rule" "xray_sampling" {
  rule_name      = local.xray_rule_name
  priority       = var.rule_priority
  reservoir_size = var.rule_reservoir_size
  fixed_rate     = var.rule_fixed_rate
  host           = var.rule_host
  http_method    = var.rule_http_method
  resource_arn   = var.rule_resource_arn
  service_name   = var.rule_service_name
  service_type   = var.rule_service_type
  url_path       = var.rule_url_path
  version        = 1
  tags           = local.tags_named
}

# Optional encryption with KMS (recommended in prod)
resource "aws_xray_encryption_config" "xray_encryption" {
  type  = "KMS"
  key_id = var.kms_key_arn
}
