/** Unique identifier for the RDS instance */
variable "instance_identifier" {
  type        = string
  description = "Unique identifier for the RDS instance"
}

/** Name of the initial database to be created */
variable "database_name" {
  type        = string
  description = "Initial database name"
}

/** Master username for database authentication */
variable "master_username" {
  type        = string
  description = "Master username for the DB"
}

/** Master password for database authentication */
variable "master_password" {
  type        = string
  sensitive   = true
  description = "Master password for the DB"
}

/** PostgreSQL engine version */
variable "engine_version" {
  type        = string
  default     = "17.5"
  description = "PostgreSQL engine version"
}

/** Instance class (e.g., db.t3.micro for Free Tier) */
variable "instance_class" {
  type        = string
  default     = "db.t3.micro"
  description = "RDS instance class"
}

/** Allocated storage size in GB */
variable "allocated_storage" {
  type        = number
  default     = 20
  description = "Storage size in GB"
}

/** Whether the instance is publicly accessible */
variable "publicly_accessible" {
  type        = bool
  default     = false
  description = "If true, RDS is publicly accessible with SG rules applied"
}

/** List of allowed IPv4 CIDR blocks for PostgreSQL access */
variable "allowed_ips" {
  type        = list(string)
  default     = []
  description = "List of allowed CIDR blocks for inbound PostgreSQL access (e.g., [\"203.0.113.25/32\"])"
}

/** VPC ID where the RDS instance will be deployed */
variable "vpc_id" {
  type        = string
  description = "VPC ID for the RDS instance"
}

/** Private subnets for DB deployment */
variable "subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs"
}

/** Number of days to retain automated backups */
variable "backup_retention_period" {
  type        = number
  default     = 1
  description = "Days to retain automated backups"
}

/** Skip final snapshot before deletion */
variable "skip_final_snapshot" {
  type        = bool
  default     = true
  description = "Skip final snapshot when destroying"
}

/** Enable deletion protection */
variable "deletion_protection" {
  type        = bool
  default     = false
  description = "Enable deletion protection"
}

/** KMS key ID for encrypting the RDS instance storage */
variable "kms_key_id" {
  type        = string
  default     = null
  description = "KMS key ID for RDS encryption (optional)"
}

/** Common tags applied to resources */
variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}
