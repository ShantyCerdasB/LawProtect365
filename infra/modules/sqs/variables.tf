variable "project_name" {
  description = "Prefix for all resource names (e.g., lawprotect365)."
  type        = string
}

variable "env" {
  description = "Deployment environment (dev|prod)."
  type        = string
}

variable "queue_purpose" {
  description = "Short identifier for the queue purpose (e.g., auth-events, payments, notifications)."
  type        = string
}

variable "common_tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default     = {}
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for messages in seconds."
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "How long to retain messages (in seconds)."
  type        = number
  default     = 345600 # 4 days
}

variable "delay_seconds" {
  description = "Time in seconds to delay delivery of new messages."
  type        = number
  default     = 0
}

variable "max_message_size" {
  description = "Max message size in bytes (1024–262144)."
  type        = number
  default     = 262144
}

variable "receive_wait_time_seconds" {
  description = "Wait time for long polling in seconds."
  type        = number
  default     = 0
}

variable "fifo_queue" {
  description = "Whether the queue is FIFO."
  type        = bool
  default     = false
}

variable "content_based_deduplication" {
  description = "Enable content-based deduplication for FIFO queues."
  type        = bool
  default     = false
}

variable "kms_key_arn" {
  description = "KMS key ARN for SQS encryption (optional)."
  type        = string
  default     = ""
}

variable "kms_data_key_reuse_seconds" {
  description = "The length of time (seconds) that Amazon SQS can reuse a data key."
  type        = number
  default     = 300
}

variable "create_dead_letter_queue" {
  description = "Whether to create a DLQ automatically."
  type        = bool
  default     = false
}

variable "dead_letter_queue_arn" {
  description = "ARN of an existing DLQ to attach."
  type        = string
  default     = ""
}

variable "max_receive_count" {
  description = "Max number of times a message is received before being sent to DLQ."
  type        = number
  default     = 5
}

variable "redrive_policy_enabled" {
  description = "Whether to enable redrive policy."
  type        = bool
  default     = true
}

variable "dlq_message_retention_seconds" {
  description = "Retention for messages in the DLQ."
  type        = number
  default     = 1209600 # 14 days
}
