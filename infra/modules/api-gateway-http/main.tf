/**
 * @file Provisions an AWS API Gateway HTTP API with optional CORS, CloudWatch access logs,
 * JWT authorizer, route integrations, and optional AWS WAFv2 association.
 */

locals {
  /**
   * @local cw_log_group_name
   * Determines the CloudWatch Log Group name for API Gateway access logs.
   * Falls back to a default naming convention if `var.access_log_group_name` is not provided.
   */
  cw_log_group_name = coalesce(var.access_log_group_name, "/aws/apigateway/${var.api_name}-${var.stage_name}")
}

########################################
# API Gateway HTTP API
########################################

/**
 * @resource aws_apigatewayv2_api.api_gateway
 * Creates an API Gateway HTTP API with optional CORS configuration.
 *
 * @param name          API name.
 * @param protocol_type Type of API (e.g., `HTTP` or `WEBSOCKET`).
 * @param description   API description.
 * @param tags          Resource tags.
 * @param cors_configuration Optional block to define CORS behavior.
 */
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = var.api_name
  protocol_type = var.protocol_type
  description   = var.description
  tags          = var.tags

  dynamic "cors_configuration" {
    for_each = var.cors == null ? [] : [var.cors]
    content {
      allow_origins     = cors_configuration.value.allow_origins
      allow_methods     = lookup(cors_configuration.value, "allow_methods", null)
      allow_headers     = lookup(cors_configuration.value, "allow_headers", null)
      allow_credentials = lookup(cors_configuration.value, "allow_credentials", null)
      expose_headers    = lookup(cors_configuration.value, "expose_headers", null)
      max_age           = lookup(cors_configuration.value, "max_age", null)
    }
  }
}

########################################
# CloudWatch Log Group for Access Logs
########################################

/**
 * @resource aws_cloudwatch_log_group.access_logs
 * Creates a CloudWatch Log Group for API Gateway access logs.
 *
 * @condition Only created when `var.enable_access_logs` is true.
 * @param name              Log Group name.
 * @param retention_in_days Retention period for log data.
 * @param kms_key_id        Optional KMS key for log encryption.
 * @param tags              Resource tags.
 */
resource "aws_cloudwatch_log_group" "access_logs" {
  count             = var.enable_access_logs ? 1 : 0
  name              = local.cw_log_group_name
  retention_in_days = var.log_retention_in_days
  kms_key_id        = var.kms_key_arn
  tags              = var.tags
}

########################################
# Stage with Access Logs
########################################

/**
 * @resource aws_apigatewayv2_stage.stage
 * Creates a deployment stage for the API Gateway, optionally with access logs.
 *
 * @param api_id           ID of the API Gateway resource.
 * @param name             Stage name.
 * @param auto_deploy      Enables automatic deployment for changes.
 * @param stage_variables  Key-value map of stage variables.
 * @param access_log_settings Optional block for enabling access logs.
 */
resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = var.stage_name
  auto_deploy = true
  tags        = var.tags

  stage_variables = var.stage_variables

  dynamic "access_log_settings" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.access_logs[0].arn
      format          = var.access_log_format
    }
  }

  depends_on = [aws_cloudwatch_log_group.access_logs]
}

########################################
# Optional JWT Authorizer
########################################

/**
 * @resource aws_apigatewayv2_authorizer.jwt
 * Configures a JWT authorizer for the API Gateway.
 *
 * @condition Created only when `var.enable_jwt_authorizer` is true.
 * @param api_id           ID of the API Gateway.
 * @param name             Authorizer name.
 * @param authorizer_type  Always set to `JWT`.
 * @param identity_sources Location to extract the JWT (e.g., HTTP Authorization header).
 * @param jwt_configuration Defines issuer and audiences for token validation.
 */
resource "aws_apigatewayv2_authorizer" "jwt" {
  count            = var.enable_jwt_authorizer ? 1 : 0
  api_id           = aws_apigatewayv2_api.api_gateway.id
  name             = "${var.api_name}-jwt"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = var.jwt_issuer
    audience = var.jwt_audiences
  }
}

########################################
# Routes & Integrations
########################################

/**
 * @resource aws_apigatewayv2_integration.integrations
 * Defines integrations for API routes.
 *
 * @param api_id                 ID of the API Gateway.
 * @param integration_uri        URI of the backend service or Lambda.
 * @param integration_type       Type of integration (e.g., `AWS_PROXY`, `HTTP_PROXY`).
 * @param payload_format_version Payload format version (defaults to `2.0`).
 */
resource "aws_apigatewayv2_integration" "integrations" {
  for_each = { for r in var.routes : r.route_key => r }

  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_uri        = each.value.integration_uri
  integration_type       = each.value.integration_type
  payload_format_version = "2.0"
}

/**
 * @resource aws_apigatewayv2_route.routes
 * Creates API Gateway routes and associates them with integrations.
 *
 * @param api_id             ID of the API Gateway.
 * @param route_key          HTTP method and path pattern for the route.
 * @param target             Reference to the integration resource.
 * @param authorization_type Authorization type (`NONE` or `JWT`).
 * @param authorizer_id      Optional JWT authorizer ID if required by the route.
 */
resource "aws_apigatewayv2_route" "routes" {
  for_each = { for r in var.routes : r.route_key => r }

  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.integrations[each.key].id}"
  authorization_type = each.value.authorization_type

  authorizer_id = (each.value.authorization_type == "JWT" && var.enable_jwt_authorizer) ? aws_apigatewayv2_authorizer.jwt[0].id : null
}

########################################
# Optional WAFv2 association
########################################

/**
 * @resource aws_wafv2_web_acl_association.waf
 * Associates an AWS WAFv2 Web ACL with the API Gateway stage.
 *
 * @condition Created only when `var.attach_waf_web_acl` is true and `var.waf_web_acl_arn` is provided.
 * @param resource_arn ARN of the API Gateway stage.
 * @param web_acl_arn  ARN of the WAFv2 Web ACL.
 */
resource "aws_wafv2_web_acl_association" "waf" {
  count        = var.attach_waf_web_acl && var.waf_web_acl_arn != null ? 1 : 0
  resource_arn = aws_apigatewayv2_stage.stage.arn
  web_acl_arn  = var.waf_web_acl_arn
}
