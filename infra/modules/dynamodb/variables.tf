/**
 * Name of the DynamoDB table.
 * This will be used to uniquely identify the table in AWS.
 */
variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

/**
 * Name of the hash (partition) key.
 * Required for table creation.
 */
variable "hash_key" {
  description = "Name of the hash (partition) key"
  type        = string
}

/**
 * Type of the hash key: "S" (String), "N" (Number), or "B" (Binary).
 */
variable "hash_key_type" {
  description = "Type of the hash key (S | N | B)"
  type        = string
  default     = "S"
}

/**
 * Optional name of the range (sort) key.
 * Leave empty if the table does not require a sort key.
 */
variable "range_key" {
  description = "Optional name of the range (sort) key"
  type        = string
  default     = ""
}

/**
 * Type of the range key: "S" (String), "N" (Number), or "B" (Binary).
 */
variable "range_key_type" {
  description = "Type of the range key (S | N | B)"
  type        = string
  default     = "S"
}

/**
 * Billing mode for the table:
 * - "PROVISIONED" for fixed capacity
 * - "PAY_PER_REQUEST" for on-demand billing
 */
variable "billing_mode" {
  description = "Billing mode: PROVISIONED or PAY_PER_REQUEST"
  type        = string
  default     = "PAY_PER_REQUEST"
}

/**
 * Read capacity units when using PROVISIONED mode.
 */
variable "read_capacity" {
  description = "Read capacity units (only with PROVISIONED)"
  type        = number
  default     = 5
}

/**
 * Write capacity units when using PROVISIONED mode.
 */
variable "write_capacity" {
  description = "Write capacity units (only with PROVISIONED)"
  type        = number
  default     = 5
}

/**
 * Whether to enable DynamoDB Streams.
 */
variable "stream_enabled" {
  description = "Whether to enable DynamoDB Streams"
  type        = bool
  default     = false
}

/**
 * Stream view type for DynamoDB Streams:
 * - "NEW_IMAGE"
 * - "OLD_IMAGE"
 * - "NEW_AND_OLD_IMAGES"
 * - "KEYS_ONLY"
 */
variable "stream_view_type" {
  description = "Stream view type (e.g. NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES, KEYS_ONLY)"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

/**
 * Tags to apply to the DynamoDB table.
 */
variable "tags" {
  description = "Tags to apply to the DynamoDB table"
  type        = map(string)
  default     = {}
}
