/**
 * DynamoDB table resource.
 *
 * Creates a DynamoDB table with configurable billing mode, keys, capacity, and optional streams.
 * Supports both PAY_PER_REQUEST and PROVISIONED billing modes.
 */
resource "aws_dynamodb_table" "table" {
  name         = var.table_name                      # Name of the DynamoDB table.
  billing_mode = var.billing_mode                    # "PAY_PER_REQUEST" or "PROVISIONED"
  hash_key     = var.hash_key                        # Primary partition key name.
  range_key    = var.range_key != "" ? var.range_key : null  # Optional sort key name, set to null if empty.

  /**
   * Primary partition key attribute definition.
   */
  attribute {
    name = var.hash_key                              # Partition key attribute name.
    type = var.hash_key_type                         # Attribute type: "S" (String) | "N" (Number) | "B" (Binary)
  }

  /**
   * Optional sort key attribute definition.
   * Only created if `range_key` is provided.
   */
  dynamic "attribute" {
    for_each = var.range_key != "" ? [var.range_key] : []
    content {
      name = var.range_key                           # Sort key attribute name.
      type = var.range_key_type                      # Sort key attribute type.
    }
  }

  /**
   * Provisioned capacity settings (only if billing_mode is PROVISIONED).
   */
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity  : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  /**
   * DynamoDB Streams configuration.
   */
  stream_enabled   = var.stream_enabled                              # Whether streams are enabled.
  stream_view_type = var.stream_enabled ? var.stream_view_type : null # Stream view type: "NEW_IMAGE", "OLD_IMAGE", etc.

  /**
   * Common tags for identification and cost allocation.
   */
  tags = var.tags
}
