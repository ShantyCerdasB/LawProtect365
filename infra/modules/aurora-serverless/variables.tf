/**
 * @file Input variables for provisioning an Amazon Aurora PostgreSQL Serverless v2 cluster.
 * Includes configuration for scaling, networking, credentials, and backup settings.
 */

/**
 * @variable cluster_identifier
 * Unique name for the Aurora RDS cluster.
 *
 * @description Used to identify and name resources associated with the cluster.
 * @type string
 */
variable "cluster_identifier" {
  description = "Unique identifier for the RDS cluster"
  type        = string
}

/**
 * @variable database_name
 * Name of the initial database created in the cluster.
 *
 * @type string
 */
variable "database_name" {
  description = "Initial database name"
  type        = string
}

/**
 * @variable master_username
 * Username for the master user of the Aurora cluster.
 *
 * @type string
 */
variable "master_username" {
  description = "Master username for the cluster"
  type        = string
}

/**
 * @variable master_password
 * Password for the master user of the Aurora cluster.
 *
 * @description In production environments, store in AWS Secrets Manager or SSM Parameter Store.
 * @type string
 * @sensitive true
 */
variable "master_password" {
  description = "Master user password (use Secrets Manager or SSM in prod)"
  type        = string
  sensitive   = true
}

/**
 * @variable engine_version
 * Version of the Aurora PostgreSQL engine.
 *
 * @type string
 * @default "13.18"
 */
variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "13.18"
}

/**
 * @variable vpc_security_group_ids
 * List of VPC security group IDs associated with the Aurora cluster.
 *
 * @type list(string)
 */
variable "vpc_security_group_ids" {
  description = "List of VPC security group IDs"
  type        = list(string)
}

/**
 * @variable subnet_ids
 * List of private subnet IDs for the DB Subnet Group.
 *
 * @description Ensures the cluster is deployed within private subnets.
 * @type list(string)
 */
variable "subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group"
  type        = list(string)
}

/**
 * @variable scaling_configuration
 * Auto-scaling and auto-pause settings for Aurora Serverless v2.
 *
 * @description Controls the minimum/maximum Aurora Capacity Units (ACUs) and auto-pause timing.
 * - `min_capacity` 0 allows pause; values ≥ 0.5 disable pause.
 * - `max_capacity` Maximum ACUs the cluster can scale to.
 * - `seconds_until_auto_pause` Idle time before pausing (300–86400 seconds).
 * @type object
 * @default { min_capacity = 0, max_capacity = 2, seconds_until_auto_pause = 300 }
 */
variable "scaling_configuration" {
  description = "Auto-scaling and auto-pause settings for Aurora Serverless v2"
  type = object({
    min_capacity             = number
    max_capacity             = number
    seconds_until_auto_pause = number
  })
  default = {
    min_capacity             = 0       # start at zero to enable pause
    max_capacity             = 2       # scale up to 2 ACU on demand
    seconds_until_auto_pause = 300     # pause after 5 minutes of inactivity
  }
}

/**
 * @variable backup_retention_period
 * Number of days to retain automated backups.
 *
 * @type number
 * @default 7
 */
variable "backup_retention_period" {
  description = "Days to retain backups"
  type        = number
  default     = 7
}

/**
 * @variable skip_final_snapshot
 * Whether to skip creating a final snapshot when destroying the cluster.
 *
 * @type bool
 * @default true
 */
variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = true
}

/**
 * @variable kms_key_id
 * KMS key ID for encrypting the Aurora cluster storage.
 *
 * @description Optional KMS key for encryption. If not provided, AWS managed key is used.
 * @type string
 * @default null
 */
variable "kms_key_id" {
  description = "KMS key ID for cluster encryption (optional)"
  type        = string
  default     = null
}

/**
 * @variable tags
 * Tags to apply to all resources created by this module.
 *
 * @type map(string)
 * @default {}
 */
variable "tags" {
  description = "Tags to apply to the cluster"
  type        = map(string)
  default     = {}
}
