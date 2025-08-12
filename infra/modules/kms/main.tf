############################################
# KMS — Main resources (key + alias)
############################################

/**
 * AWS KMS Key Resource
 *
 * @description
 * Creates a Customer Managed Key (CMK) in AWS Key Management Service (KMS).
 * The key can be configured for symmetric encryption/decryption or asymmetric
 * operations (signing/verifying or MAC generation/verification).
 *
 * @remarks
 * - If `key_usage` is `ENCRYPT_DECRYPT`, automatic rotation can be enabled.
 * - Asymmetric keys (`SIGN_VERIFY` or `GENERATE_VERIFY_MAC`) do not support rotation.
 * - The CMK is protected with a deletion window of 30 days by default.
 * - Key policy is sourced from the `cmk_policy` data block defined in the module.
 *
 * @see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key
 */
resource "aws_kms_key" "master_key" {
  /** Free-text description for the KMS key. */
  description             = var.description

  /**
   * Whether automatic key rotation is enabled.
   * Only applies if `key_usage` is ENCRYPT_DECRYPT.
   */
  enable_key_rotation     = var.key_usage == "ENCRYPT_DECRYPT" ? var.enable_key_rotation : false

  /** Number of days before scheduled key deletion occurs. */
  deletion_window_in_days = 30

  /** The intended key usage: ENCRYPT_DECRYPT, SIGN_VERIFY, or GENERATE_VERIFY_MAC. */
  key_usage               = var.key_usage

  /**
   * Key specification:
   * - For ENCRYPT_DECRYPT: SYMMETRIC_DEFAULT
   * - For asymmetric operations: provided via `var.key_spec`
   */
  customer_master_key_spec = var.key_usage == "ENCRYPT_DECRYPT" ? "SYMMETRIC_DEFAULT" : var.key_spec

  /** IAM policy document controlling key permissions. */
  policy = data.aws_iam_policy_document.cmk_policy.json

  /** Tags applied to the KMS key. */
  tags   = var.tags
}

/**
 * AWS KMS Alias Resource
 *
 * @description
 * Creates a human-readable alias for the KMS key to simplify referencing it
 * in AWS services and Terraform modules.
 *
 * @remarks
 * - Aliases must be unique within the account/region.
 * - Aliases cannot be deleted directly; they must be disassociated from the key first.
 *
 * @see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_alias
 */
resource "aws_kms_alias" "key_alias" {
  /** Name of the KMS alias (must start with 'alias/'). */
  name          = "alias/${var.key_name}"

  /** ID of the KMS key this alias will point to. */
  target_key_id = aws_kms_key.master_key.key_id
}
