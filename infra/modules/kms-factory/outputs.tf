############################################################
# KMS Factory — Outputs
############################################################

/**
 * ARN of the observability CMK (used for CloudWatch Logs and SNS).
 */
output "observability_kms_key_arn" {
  description = "ARN of the observability CMK."
  value       = module.kms_observability.kms_key_arn
}

/**
 * ARN of the templates CMK (used for S3 templates).
 */
output "templates_kms_key_arn" {
  description = "ARN of the templates CMK."
  value       = module.kms_templates.kms_key_arn
}

/**
 * ARN of the documents CMK (used for S3 documents).
 */
output "documents_kms_key_arn" {
  description = "ARN of the documents CMK."
  value       = module.kms_documents.kms_key_arn
}

/**
 * ARN of the evidence CMK (used for S3 evidence).
 */
output "evidence_kms_key_arn" {
  description = "ARN of the evidence CMK."
  value       = module.kms_evidence.kms_key_arn
}

/**
 * ARN of the signing CMK (asymmetric SIGN_VERIFY).
 */
output "signing_kms_key_arn" {
  description = "ARN of the signing CMK (asymmetric SIGN_VERIFY)."
  value       = module.kms_signing.kms_key_arn
}

/**
 * ARN of the artifact CMK (used for CodeArtifact encryption).
 */
output "artifact_kms_key_arn" {
  description = "ARN of the artifact CMK."
  value       = module.kms_artifact.kms_key_arn
}

# ---------- Handy extras (IDs and aliases) ----------

/**
 * Key ID of the artifact CMK.
 */
output "artifact_kms_key_id" {
  description = "Key ID of the artifact CMK."
  value       = module.kms_artifact.kms_key_id
}

/**
 * Key ID of the observability CMK.
 */
output "observability_kms_key_id" {
  description = "Key ID of the observability CMK."
  value       = module.kms_observability.kms_key_id
}

/**
 * Alias name of the templates CMK.
 */
output "templates_kms_alias_name" {
  description = "Alias name for the templates CMK."
  value       = module.kms_templates.kms_alias_name
}

/**
 * Alias name of the documents CMK.
 */
output "documents_kms_alias_name" {
  description = "Alias name for the documents CMK."
  value       = module.kms_documents.kms_alias_name
}

/**
 * Alias name of the evidence CMK.
 */
output "evidence_kms_alias_name" {
  description = "Alias name for the evidence CMK."
  value       = module.kms_evidence.kms_alias_name
}

/**
 * Key ID of the signing CMK.
 */
output "signing_kms_key_id" {
  description = "Key ID of the signing CMK."
  value       = module.kms_signing.kms_key_id
}

