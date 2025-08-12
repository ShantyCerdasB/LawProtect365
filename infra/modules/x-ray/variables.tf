variable "project_name" {
  description = "Prefix for resource names (e.g., lawprotect365)."
  type        = string
}

variable "env" {
  description = "Deployment environment (dev|prod)."
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "kms_key_arn" {
  description = "KMS key ARN for X-Ray encryption (optional)."
  type        = string
  default     = ""
}

variable "group_filter" {
  description = "X-Ray group filter expression."
  type        = string
  default     = "service(\"*\")"
}

# Sampling rule controls (sane defaults; tune per service)
variable "rule_priority" {
  description = "Lower value = higher priority."
  type        = number
  default     = 100
}

variable "rule_reservoir_size" {
  description = "Fixed samples per second before probabilistic sampling."
  type        = number
  default     = 1
}

variable "rule_fixed_rate" {
  description = "Probability (0–1) after reservoir quota is used."
  type        = number
  default     = 0.05
}

variable "rule_host" {
  description = "Host to match (\"*\" for any)."
  type        = string
  default     = "*"
}

variable "rule_http_method" {
  description = "HTTP method to match (\"*\" for any)."
  type        = string
  default     = "*"
}

variable "rule_resource_arn" {
  description = "Resource ARN to match (\"*\" for any)."
  type        = string
  default     = "*"
}

variable "rule_service_name" {
  description = "Service name to match (\"*\" for any)."
  type        = string
  default     = "*"
}

variable "rule_service_type" {
  description = "Service type (e.g., AWS::Lambda, AWS::EC2, or \"*\")."
  type        = string
  default     = "*"
}

variable "rule_url_path" {
  description = "URL path to match (e.g., \"/api/*\" or \"*\")."
  type        = string
  default     = "*"
}
