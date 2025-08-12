output "xray_group_name" {
  description = "X-Ray group name."
  value       = aws_xray_group.xray_group.group_name
}

output "xray_group_arn" {
  description = "X-Ray group ARN."
  value       = aws_xray_group.xray_group.arn
}

output "xray_sampling_rule_name" {
  description = "X-Ray sampling rule name."
  value       = aws_xray_sampling_rule.xray_sampling.rule_name
}

output "xray_encryption_type" {
  description = "X-Ray encryption type (NONE or KMS)."
  value       = try(aws_xray_encryption_config.xray_encryption.type, "NONE")
}

output "xray_kms_key_id" {
  description = "KMS key ID if encryption is enabled."
  value       = try(aws_xray_encryption_config.xray_encryption.key_id, "")
}


