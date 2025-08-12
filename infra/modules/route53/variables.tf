/**
 * ID of the Route 53 Hosted Zone where the record will be created.
 */
variable "hosted_zone_id" {
  description = "ID of the Route 53 Hosted Zone where the record will be created."
  type        = string
}

/**
 * DNS name to create, relative to the hosted zone.
 * Example: "www" or "api".
 */
variable "record_name" {
  description = "The DNS name to create, relative to the zone (e.g. 'www' or 'api')."
  type        = string
}

/**
 * DNS record type.
 * Common values: "A", "CNAME", "TXT".
 */
variable "record_type" {
  description = "DNS record type (e.g. 'A', 'CNAME', 'TXT')."
  type        = string
  default     = "A"
}

/**
 * Time-to-live for simple records (in seconds).
 * Not used when an alias record is configured.
 */
variable "ttl" {
  description = "Time-to-live for simple records (in seconds). Not used when alias is set."
  type        = number
  default     = 300
}

/**
 * List of values for a simple record.
 * Example: IP addresses or hostnames.
 */
variable "records" {
  description = "List of values for a simple record (e.g. IP addresses or hostnames)."
  type        = list(string)
  default     = []
}

/**
 * Optional alias configuration for AWS-backed endpoints (CloudFront, ELB, API Gateway).
 * If provided, creates an alias record instead of a simple record.
 *
 * Example:
 * {
 *   name                   = "<target DNS name>"
 *   zone_id                = "<target zone ID>"
 *   evaluate_target_health = true
 * }
 */
variable "alias" {
  description = "Optional alias configuration for AWS-backed endpoints."
  type = object({
    name                   = string
    zone_id                = string
    evaluate_target_health = bool
  })
  default = null
}

/**
 * Project prefix for tagging.
 */
variable "project_name" {
  description = "Project prefix for tagging."
  type        = string
}

/**
 * Deployment environment.
 * Example: "dev" or "prod".
 */
variable "env" {
  description = "Deployment environment ('dev' or 'prod')."
  type        = string
}
