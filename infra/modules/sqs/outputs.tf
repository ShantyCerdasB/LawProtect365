output "queue_name" {
  description = "The name of the main SQS queue."
  value       = aws_sqs_queue.main_queue.name
}

output "queue_arn" {
  description = "The ARN of the main SQS queue."
  value       = aws_sqs_queue.main_queue.arn
}

output "queue_url" {
  description = "The URL of the main SQS queue."
  value       = aws_sqs_queue.main_queue.url
}

output "dlq_name" {
  description = "The name of the Dead Letter Queue (if created)."
  value       = var.create_dead_letter_queue ? aws_sqs_queue.dlq[0].name : ""
}

output "dlq_arn" {
  description = "The ARN of the Dead Letter Queue (if created)."
  value       = var.create_dead_letter_queue ? aws_sqs_queue.dlq[0].arn : ""
}

output "dlq_url" {
  description = "The URL of the Dead Letter Queue (if created)."
  value       = var.create_dead_letter_queue ? aws_sqs_queue.dlq[0].url : ""
}
