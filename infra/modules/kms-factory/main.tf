/**
 * KMS CMK for encrypting S3 templates.
 * - Key usage: ENCRYPT_DECRYPT (symmetric)
 * - Key rotation: enabled
 * - CloudWatch Logs/SNS access: disabled
 */
module "kms_templates" {
  source               = "../kms"
  key_name             = "${var.project_name}-templates-${var.env}"
  description          = "CMK for ${var.project_name} templates S3 (${var.env})"
  key_usage            = "ENCRYPT_DECRYPT"
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = false
  allow_sns             = false
  admin_role_arns       = var.admin_role_arns
}

/**
 * KMS CMK for encrypting S3 documents.
 * - Key usage: ENCRYPT_DECRYPT (symmetric)
 * - Key rotation: enabled
 * - CloudWatch Logs/SNS access: disabled
 */
module "kms_documents" {
  source               = "../kms"
  key_name             = "${var.project_name}-documents-${var.env}"
  description          = "CMK for ${var.project_name} documents S3 (${var.env})"
  key_usage            = "ENCRYPT_DECRYPT"
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = false
  allow_sns             = false
  admin_role_arns       = var.admin_role_arns
}

/**
 * KMS CMK for encrypting S3 evidence.
 * - Key usage: ENCRYPT_DECRYPT (symmetric)
 * - Key rotation: enabled
 * - CloudWatch Logs/SNS access: disabled
 */
module "kms_evidence" {
  source               = "../kms"
  key_name             = "${var.project_name}-evidence-${var.env}"
  description          = "CMK for ${var.project_name} evidence S3 (${var.env})"
  key_usage            = "ENCRYPT_DECRYPT"
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = false
  allow_sns             = false
  admin_role_arns       = var.admin_role_arns
}

/**
 * KMS CMK for encrypting CloudWatch logs and SNS messages.
 * - Key usage: ENCRYPT_DECRYPT (symmetric)
 * - Key rotation: enabled
 * - CloudWatch Logs/SNS access: enabled
 */
module "kms_observability" {
  source               = "../kms"
  key_name             = "${var.project_name}-observability-${var.env}"
  description          = "CMK for logs & SNS (${var.env})"
  key_usage            = "ENCRYPT_DECRYPT"
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = true
  allow_sns             = true
  admin_role_arns       = var.admin_role_arns
}

/**
 * Asymmetric KMS CMK for e-signature signing/verification.
 * - Key usage: SIGN_VERIFY (asymmetric)
 * - Key spec: defined by `signing_key_spec` variable
 * - Key rotation: internally forced to false by module for SIGN_VERIFY
 * - CloudWatch Logs/SNS access: disabled
 */
module "kms_signing" {
  source               = "../kms"
  key_name             = "${var.project_name}-signing-${var.env}"
  description          = "Asymmetric CMK (SIGN_VERIFY) for e-signatures (${var.env})"
  key_usage            = "SIGN_VERIFY"
  key_spec             = var.signing_key_spec
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = false
  allow_sns             = false
  admin_role_arns       = var.admin_role_arns
}

/**
 * KMS CMK for CodeArtifact encryption.
 * - Key usage: ENCRYPT_DECRYPT (symmetric)
 * - Key rotation: enabled
 * - CloudWatch Logs/SNS access: disabled
 */
module "kms_artifact" {
  source               = "../kms"
  key_name             = "${var.project_name}-artifact-${var.env}"
  description          = "CMK for CodeArtifact encryption (${var.env})"
  enable_key_rotation  = true
  tags                 = var.tags

  account_id            = var.account_id
  region                = var.region
  allow_cloudwatch_logs = false
  allow_sns             = false
  admin_role_arns       = var.admin_role_arns
}
