/**
 * @file Input variables for configuring an AWS API Gateway HTTP API with optional
 * CORS, JWT authorizer, CloudWatch access logs, and WAFv2 integration.
 */

########################################
# Identification & basic settings
########################################

/**
 * @variable api_name
 * Name of the API Gateway HTTP API.
 *
 * @type string
 */
variable "api_name" {
  description = "Name of the API Gateway HTTP API"
  type        = string
}

/**
 * @variable enable_jwt_authorizer
 * Enables creation of a JWT authorizer for the API Gateway.
 *
 * @description When set to `true`, attaches the JWT authorizer to routes where `authorization_type` is `JWT`.
 * @type bool
 * @default false
 */
variable "enable_jwt_authorizer" {
  description = "Create a JWT authorizer and attach it to routes that set authorization_type = JWT."
  type        = bool
  default     = false
}

/**
 * @variable jwt_issuer
 * JWT issuer URL.
 *
 * @description Commonly the Cognito User Pool issuer, e.g., `https://cognito-idp.us-east-1.amazonaws.com/<userPoolId>`.
 * @type string
 * @default ""
 */
variable "jwt_issuer" {
  description = "JWT issuer URL (e.g., https://cognito-idp.us-east-1.amazonaws.com/<userPoolId>)."
  type        = string
  default     = ""
}

/**
 * @variable jwt_audiences
 * List of allowed JWT audiences.
 *
 * @description Typically corresponds to one or more App Client IDs in Cognito or other identity providers.
 * @type list(string)
 * @default []
 */
variable "jwt_audiences" {
  description = "List of allowed JWT audiences (typically the App Client ID)."
  type        = list(string)
  default     = []
}

/**
 * @variable description
 * Description of the API Gateway HTTP API.
 *
 * @type string
 * @default ""
 */
variable "description" {
  description = "Description of the API"
  type        = string
  default     = ""
}

/**
 * @variable protocol_type
 * Protocol for the API Gateway.
 *
 * @description Must be either `HTTP` or `WEBSOCKET`.
 * @type string
 * @default "HTTP"
 */
variable "protocol_type" {
  description = "Protocol for the API: HTTP or WEBSOCKET"
  type        = string
  default     = "HTTP"
}

/**
 * @variable stage_name
 * Name of the API Gateway deployment stage.
 *
 * @type string
 * @default "prod"
 */
variable "stage_name" {
  description = "Name of the deployment stage"
  type        = string
  default     = "prod"
}

/**
 * @variable tags
 * Tags to apply to all API Gateway resources.
 *
 * @type map(string)
 * @default {}
 */
variable "tags" {
  description = "Tags to apply to all API Gateway resources"
  type        = map(string)
  default     = {}
}

########################################
# CORS (optional)
########################################

/**
 * @variable cors
 * Optional CORS configuration for the API Gateway.
 *
 * @description Set to `null` to disable CORS. Supports origins, methods, headers, credentials, and more.
 * @type object
 * @default null
 * @example
 * {
 *   allow_origins     = ["*"],
 *   allow_methods     = ["GET","POST"],
 *   allow_headers     = ["*"],
 *   allow_credentials = false,
 *   expose_headers    = [],
 *   max_age           = 0
 * }
 */
variable "cors" {
  description = <<-EOT
    Optional CORS configuration. Set to null to disable CORS.
    Example:
    {
      allow_origins     = ["*"],
      allow_methods     = ["GET","POST"],
      allow_headers     = ["*"],
      allow_credentials = false,
      expose_headers    = [],
      max_age           = 0
    }
  EOT
  type = object({
    allow_origins     = list(string)
    allow_methods     = optional(list(string))
    allow_headers     = optional(list(string))
    allow_credentials = optional(bool)
    expose_headers    = optional(list(string))
    max_age           = optional(number)
  })
  default = null
}

########################################
# Stage variables (optional)
########################################

/**
 * @variable stage_variables
 * Key-value pairs to set as stage variables for the API Gateway.
 *
 * @type map(string)
 * @default {}
 */
variable "stage_variables" {
  description = "Key-value pairs for stage variables"
  type        = map(string)
  default     = {}
}

########################################
# Access Logs (CloudWatch Logs)
########################################

/**
 * @variable enable_access_logs
 * Enables CloudWatch access logs for the API Gateway stage.
 *
 * @type bool
 * @default true
 */
variable "enable_access_logs" {
  description = "Enable CloudWatch Logs for stage access logs"
  type        = bool
  default     = true
}

/**
 * @variable access_log_group_name
 * Name of the CloudWatch Log Group for API Gateway access logs.
 *
 * @description Used only if `enable_access_logs` is `true`. Defaults to an auto-generated name.
 * @type string
 * @default null
 */
variable "access_log_group_name" {
  description = "CloudWatch Log Group name for access logs (created if enable_access_logs = true)"
  type        = string
  default     = null
}

/**
 * @variable access_log_format
 * JSON format string for API Gateway access logs.
 *
 * @type string
 */
variable "access_log_format" {
  description = "Access log JSON format for API Gateway v2 stage"
  type        = string
}

/**
 * @variable log_retention_in_days
 * Retention period for CloudWatch access log data.
 *
 * @type number
 * @default 30
 */
variable "log_retention_in_days" {
  description = "Retention for the created access log group"
  type        = number
  default     = 30
}

/**
 * @variable kms_key_arn
 * Optional AWS KMS key ARN for encrypting the CloudWatch Log Group.
 *
 * @description If not provided, AWS-managed encryption is used.
 * @type string
 * @default null
 */
variable "kms_key_arn" {
  description = "Optional CMK to encrypt access log group (CloudWatch Logs is AWS-managed by default)"
  type        = string
  default     = null
}

########################################
# WAFv2 (optional, recommended in prod)
########################################

/**
 * @variable attach_waf_web_acl
 * Whether to attach a WAFv2 Web ACL to the API Gateway stage.
 *
 * @type bool
 * @default false
 */
variable "attach_waf_web_acl" {
  description = "If true, attach the given WAFv2 Web ACL to the API stage"
  type        = bool
  default     = false
}

/**
 * @variable waf_web_acl_arn
 * ARN of the WAFv2 Web ACL to associate with the API Gateway stage.
 *
 * @type string
 * @default null
 */
variable "waf_web_acl_arn" {
  description = "ARN of the WAFv2 Web ACL to associate with the API stage"
  type        = string
  default     = null
}

########################################
# Routes
########################################

/**
 * @variable routes
 * List of route definitions for the API Gateway HTTP API.
 *
 * @description Each route must define:
 * - `route_key` (HTTP method and path, e.g., `GET /path`)
 * - `integration_uri` (e.g., Lambda ARN or HTTP endpoint)
 * - `integration_type` (`AWS_PROXY`, `MOCK`, `HTTP_PROXY`, etc.)
 * - `authorization_type` (`NONE`, `JWT`, or `CUSTOM`)
 * @type list(object)
 * @default []
 * @example
 * [
 *   {
 *     route_key          = "GET /health"
 *     integration_uri    = "arn:aws:lambda:us-east-1:123456789012:function:healthCheck"
 *     integration_type   = "AWS_PROXY"
 *     authorization_type = "NONE"
 *   }
 * ]
 */
variable "routes" {
  description = <<-EOT
    List of route definitions for the API Gateway HTTP API.
    Each route must define:
      - route_key         = "METHOD /path"
      - integration_uri   = "arn:aws:lambda:region:account-id:function:function-name"
      - integration_type  = "AWS_PROXY" (or MOCK, HTTP_PROXY, etc.)
      - authorization_type = "NONE" | "JWT" | "CUSTOM"
    Example:
    [
      {
        route_key         = "GET /health"
        integration_uri   = "arn:aws:lambda:us-east-1:123456789012:function:healthCheck"
        integration_type  = "AWS_PROXY"
        authorization_type = "NONE"
      }
    ]
  EOT
  type    = list(object({
    route_key          = string
    integration_uri    = string
    integration_type   = string
    authorization_type = string
  }))
  default = []
}
