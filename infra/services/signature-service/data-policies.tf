############################################################
# sign-service — IAM policy documents (module-local)
############################################################

/**
 * Policy: Allows KMS asymmetric key signing operations
 * for document hash signing.
 *
 * Permissions:
 * - kms:Sign
 * - kms:GetPublicKey
 * - kms:DescribeKey
 *
 * Resource scope: var.kms_sign_key_arn (asymmetric CMK ARN)
 */
data "aws_iam_policy_document" "sign_kms_sign" {
  statement {
    sid     = "AllowKmsSign"
    effect  = "Allow"
    actions = [
      "kms:Sign",
      "kms:GetPublicKey",
      "kms:DescribeKey"
    ]
    resources = [var.kms_sign_key_arn]
  }
}

/**
 * Policy: Grants read-only access to the documents S3 bucket.
 *
 * Bucket-level:
 * - s3:GetBucketLocation
 * - s3:ListBucket
 * - s3:ListBucketVersions
 *
 * Object-level:
 * - s3:GetObject
 * - s3:GetObjectVersion
 */
data "aws_iam_policy_document" "sign_s3_documents_read" {
  statement {
    sid     = "ListDocumentsBucket"
    effect  = "Allow"
    actions = ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketVersions"]
    resources = ["arn:aws:s3:::${var.documents_bucket_name}"]
  }

  statement {
    sid     = "GetDocumentsObjects"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = ["arn:aws:s3:::${var.documents_bucket_name}/*"]
  }
}

/**
 * Local values for the evidence bucket name and ARNs.
 * This bucket is created in main.tf via `module.evidence_bucket`.
 */
locals {
  evidence_bucket_name = module.evidence_bucket.bucket_id
  evidence_bucket_arn  = "arn:aws:s3:::${local.evidence_bucket_name}"
  evidence_objs_arn    = "arn:aws:s3:::${local.evidence_bucket_name}/*"
}

/**
 * Policy: Grants read/write access to the evidence S3 bucket
 * with enforced server-side encryption.
 *
 * Modes:
 * - SSE_S3  => Require `AES256` encryption header
 * - SSE_KMS => Require `aws:kms` header and a specific CMK ID
 */
data "aws_iam_policy_document" "sign_s3_evidence_rw" {
  # Bucket list & multipart operations
  statement {
    sid     = "ListEvidenceBucket"
    effect  = "Allow"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads"
    ]
    resources = [local.evidence_bucket_arn]
  }

  # Object read access
  statement {
    sid     = "ReadEvidenceObjects"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = [local.evidence_objs_arn]
  }

  # SSE-S3 (AES256) enforced writes
  dynamic "statement" {
    for_each = var.evidence_encryption == "SSE_S3" ? [1] : []
    content {
      sid     = "WriteEvidenceObjectsWithSSES3"
      effect  = "Allow"
      actions = ["s3:PutObject", "s3:AbortMultipartUpload"]
      resources = [local.evidence_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["AES256"]
      }
    }
  }

  # SSE-KMS enforced writes with specific CMK
  dynamic "statement" {
    for_each = var.evidence_encryption == "SSE_KMS" ? [1] : []
    content {
      sid     = "WriteEvidenceObjectsWithKMS"
      effect  = "Allow"
      actions = ["s3:PutObject", "s3:AbortMultipartUpload"]
      resources = [local.evidence_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["aws:kms"]
      }
      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
        values   = [var.evidence_kms_key_arn]
      }
    }
  }
}

/**
 * Policy: Grants KMS permissions for SSE-KMS encryption
 * on the evidence bucket.
 *
 * Included only when evidence_encryption == "SSE_KMS".
 *
 * Permissions:
 * - kms:Encrypt
 * - kms:Decrypt
 * - kms:GenerateDataKey
 * - kms:ReEncrypt*
 * - kms:DescribeKey
 */
data "aws_iam_policy_document" "sign_kms_evidence_s3" {
  count = var.evidence_encryption == "SSE_KMS" ? 1 : 0

  statement {
    sid     = "AllowKmsForEvidenceBucket"
    effect  = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:ReEncrypt*",
      "kms:DescribeKey"
    ]
    resources = [var.evidence_kms_key_arn]
  }
}

/**
 * Local maps:
 * - inline_policies_base: Base inline IAM policies required by sign-service
 * - inline_policies_kms: Additional policies for SSE-KMS encryption (conditional)
 * - inline_policies: Final merged policies (base + kms + extra overrides from root)
 */
locals {
  inline_policies_base = {
    "kms-sign"          = data.aws_iam_policy_document.sign_kms_sign.json
    "s3-documents-read" = data.aws_iam_policy_document.sign_s3_documents_read.json
    "s3-evidence-rw"    = data.aws_iam_policy_document.sign_s3_evidence_rw.json
  }

  inline_policies_kms = var.evidence_encryption == "SSE_KMS" ? {
    "kms-evidence-s3" = data.aws_iam_policy_document.sign_kms_evidence_s3[0].json
  } : {}

  inline_policies = merge(
    local.inline_policies_base,
    local.inline_policies_kms,
    var.extra_inline_policies
  )
}
