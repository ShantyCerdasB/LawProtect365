/**
 * Base name prefix applied to all resources in this module.
 */
variable "project_name" {
  description = "Base name for all resources."
  type        = string
}

/**
 * Deployment environment identifier.
 * Examples: dev, staging, prod.
 */
variable "env" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

/**
 * CIDR block for the VPC.
 */
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

/**
 * List of availability zones to use for subnet creation.
 */
variable "azs" {
  description = "List of availability zones to use."
  type        = list(string)
}

/**
 * List of CIDR blocks for public subnets.
 * Must have one entry per availability zone.
 */
variable "public_subnet_cidrs" {
  description = "List of CIDRs for public subnets (one per AZ)."
  type        = list(string)
}

/**
 * List of CIDR blocks for private subnets.
 * Must have one entry per availability zone.
 */
variable "private_subnet_cidrs" {
  description = "List of CIDRs for private subnets (one per AZ)."
  type        = list(string)
}

/**
 * Map of tags to apply to all networking resources.
 */
variable "tags" {
  description = "Tags to apply to all networking resources."
  type        = map(string)
  default     = {}
}
