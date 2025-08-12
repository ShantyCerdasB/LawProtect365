output "topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.sns_topic.arn
}

output "topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.sns_topic.name
}

output "subscription_arns" {
  description = "Map of created subscription ARNs (index => ARN)"
  value       = {
    for k, v in aws_sns_topic_subscription.sns_subscriptions :
    k => v.arn
  }
}
