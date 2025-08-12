# ---------- Identity & tagging ----------

/**
 * @variable key_name
 * @description
 * Alias for the KMS key.  
 * The module will create an alias in the format `alias/<key_name>`.
 */
variable "key_name" {
  description = "Alias for the KMS key (the module creates alias/<key_name>)."
  type        = string
}

/**
 * @variable description
 * @description
 * Human-readable description for the KMS key.
 */
variable "description" {
  description = "Description for the KMS key."
  type        = string
  default     = null
}

/**
 * @variable tags
 * @description
 * Key-value tags to apply to both the KMS key and its alias.
 */
variable "tags" {
  description = "Tags to apply to the KMS key and alias."
  type        = map(string)
  default     = {}
}

# ---------- Rotation ----------

/**
 * @variable enable_key_rotation
 * @description
 * Whether to enable **annual automatic key rotation**.  
 * Ignored when `key_usage` is `SIGN_VERIFY` because rotation is not supported by KMS for asymmetric keys.
 */
variable "enable_key_rotation" {
  description = "Enable annual key rotation. Ignored for SIGN_VERIFY keys (not supported by KMS)."
  type        = bool
  default     = true
}

# ---------- Root-provided context (no data sources in the module) ----------

/**
 * @variable account_id
 * @description
 * AWS Account ID where the KMS key will be created.  
 * Used in key policy statements.
 */
variable "account_id" {
  description = "AWS Account ID (used in key policy statements)."
  type        = string
  default     = null
}

/**
 * @variable region
 * @description
 * AWS Region where the KMS key will reside.  
 * Used in key policy statements.
 */
variable "region" {
  description = "AWS Region (used in key policy statements)."
  type        = string
  default     = null
}

# ---------- Optional policy toggles for common services (symmetric keys) ----------

/**
 * @variable allow_cloudwatch_logs
 * @description
 * If `true`, allows **CloudWatch Logs** in this region to use the key.  
 * Only applies when `key_usage` is `ENCRYPT_DECRYPT`.
 */
variable "allow_cloudwatch_logs" {
  description = "Allow CloudWatch Logs in this region to use the key (only meaningful for ENCRYPT_DECRYPT)."
  type        = bool
  default     = false
}

/**
 * @variable allow_sns
 * @description
 * If `true`, allows **SNS** in this account/region to use the key.  
 * Only applies when `key_usage` is `ENCRYPT_DECRYPT`.
 */
variable "allow_sns" {
  description = "Allow SNS in this account/region to use the key (only meaningful for ENCRYPT_DECRYPT)."
  type        = bool
  default     = false
}

/**
 * @variable admin_role_arns
 * @description
 * List of IAM Role ARNs that should have permissions matching the `key_usage` (Encrypt/Decrypt, Sign/Verify, etc.).
 */
variable "admin_role_arns" {
  description = "Optional IAM role ARNs with permissions appropriate to key_usage (Encrypt/Decrypt or Sign/Verify, etc.)."
  type        = list(string)
  default     = []
}

# ---------- Purpose & algorithm ----------

/**
 * @variable key_usage
 * @description
 * Specifies the **purpose** of the KMS key.  
 * One of:
 * - `ENCRYPT_DECRYPT`
 * - `SIGN_VERIFY`
 * - `GENERATE_VERIFY_MAC`
 */
variable "key_usage" {
  description = "What the key will be used for. One of: ENCRYPT_DECRYPT | SIGN_VERIFY | GENERATE_VERIFY_MAC."
  type        = string
  default     = "ENCRYPT_DECRYPT"
}

/**
 * @variable key_spec
 * @description
 * Defines the **algorithm/spec** for the key.  
 * 
 * - Symmetric encryption: `SYMMETRIC_DEFAULT`  
 * - Asymmetric signing: `RSA_2048`, `RSA_3072`, `RSA_4096`, `ECC_NIST_P256`, `ECC_NIST_P384`, `ECC_NIST_P521`, `ECC_SECG_P256K1`  
 * - HMAC (MAC keys): `HMAC_224`, `HMAC_256`, `HMAC_384`, `HMAC_512`  
 * 
 * @remarks
 * With older AWS provider schemas, this value is passed via `customer_master_key_spec`.
 */
variable "key_spec" {
  description = <<EOT
Algorithm/spec for the key.
Use SYMMETRIC_DEFAULT for symmetric encryption.
For asymmetric signing, use one of: RSA_2048 | RSA_3072 | RSA_4096 | ECC_NIST_P256 | ECC_NIST_P384 | ECC_NIST_P521 | ECC_SECG_P256K1.
For HMAC (MAC keys), use one of: HMAC_224 | HMAC_256 | HMAC_384 | HMAC_512.
Note: With older AWS provider schemas, this value is passed via customer_master_key_spec.
EOT
  type        = string
  default     = "SYMMETRIC_DEFAULT"
}
