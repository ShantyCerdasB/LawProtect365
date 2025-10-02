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
    sid     = "AllowKmsSignAndVerify"
    effect  = "Allow"
    actions = [
      "kms:Sign",
      "kms:Verify",
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
 * @policy CloudWatch custom metrics
 * @purpose Publish service KPIs (latency, errors, signature counts).
 * @permissions
 *  - cloudwatch:PutMetricData (scoped to a specific namespace)
 */
data "aws_iam_policy_document" "sign_cloudwatch_metrics" {
  statement {
    sid     = "AllowPutMetricData"
    effect  = "Allow"
    actions = ["cloudwatch:PutMetricData"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["SignService"]
    }
  }
}

/**
 * @policy EventBridge (optional)
 * @purpose Publish domain/integration events when envelopes change state.
 * @permissions
 *  - events:PutEvents
 * @resources
 *  - var.event_bus_arn (when provided)
 */
data "aws_iam_policy_document" "sign_eventbridge_put" {
  statement {
    sid     = "AllowPutEvents"
    effect  = "Allow"
    actions = ["events:PutEvents"]
    resources = [local.event_bus_arn_safe]
  }
}

/**
 * @policy S3 multipart upload (evidence) with enforced SSE
 * @purpose Efficient uploads for large evidence files while forcing server-side encryption.
 * @permissions
 *  - s3:CreateMultipartUpload, s3:UploadPart, s3:ListMultipartUploadParts,
 *    s3:CompleteMultipartUpload, s3:AbortMultipartUpload
 * @resources
 *  - local.evidence_objs_arn (bucket/*)
 * @encryption
 *  - Enforce AES256 for SSE_S3, or aws:kms + specific CMK for SSE_KMS
 */
data "aws_iam_policy_document" "sign_s3_evidence_mpu" {
  statement {
    sid     = "CreateMultipartWithKMSEnforced"
    effect  = "Allow"
    actions = ["s3:CreateMultipartUpload"]
    resources = [local.evidence_objs_arn]

    # Enforce SSE at initiation
    dynamic "condition" {
      for_each = var.evidence_encryption == "SSE_KMS" ? [1] : []
      content {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["aws:kms"]
      }
    }
    dynamic "condition" {
      for_each = var.evidence_encryption == "SSE_KMS" ? [1] : []
      content {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
        values   = [var.evidence_kms_key_arn]
      }
    }
    dynamic "condition" {
      for_each = var.evidence_encryption == "SSE_S3" ? [1] : []
      content {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["AES256"]
      }
    }
  }

  statement {
    sid     = "UploadAndCompleteMultipart"
    effect  = "Allow"
    actions = [
      "s3:UploadPart",
      "s3:ListMultipartUploadParts",
      "s3:CompleteMultipartUpload",
      "s3:AbortMultipartUpload"
    ]
    resources = [local.evidence_objs_arn]
  }
}

/**
 * @policy S3 Object Lock management (WORM)
 * @purpose Set/inspect retention and legal holds for evidence immutability policies.
 * @permissions
 *  - s3:GetObjectRetention, s3:PutObjectRetention,
 *    s3:GetObjectLegalHold, s3:PutObjectLegalHold
 * @resources
 *  - local.evidence_objs_arn (bucket/*)
 */
data "aws_iam_policy_document" "sign_s3_object_lock" {
  statement {
    sid     = "ObjectLockRetentionAndLegalHold"
    effect  = "Allow"
    actions = [
      "s3:GetObjectRetention",
      "s3:PutObjectRetention",
      "s3:GetObjectLegalHold",
      "s3:PutObjectLegalHold"
    ]
    resources = [local.evidence_objs_arn]
  }
}


/**
 * @policy SSM Parameter Store (feature flags / client config)
 * @purpose Read service feature flags and client-specific settings.
 * @permissions
 *  - ssm:GetParameter, ssm:GetParameters, ssm:GetParametersByPath
 * @resources
 *  - arn:aws:ssm:${var.aws_region}:${account}:parameter/${var.project_name}/${var.env}/*
 */
data "aws_iam_policy_document" "sign_ssm_read" {
  statement {
    sid     = "ReadFeatureFlags"
    effect  = "Allow"
    actions = ["ssm:GetParameter","ssm:GetParameters","ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.aws_region}:${var.aws_caller.account_id}:parameter/${var.project_name}/${var.env}/*"]
  }
}

############################################################
# Inline policies map
############################################################
/**
 * @local inline_policies_base
 * Core policies used by all sign-service Lambdas.
 */

 locals {
  # Si var.event_bus_arn aún es unknown o null, usa un ARN placeholder inofensivo.
  event_bus_arn_safe = coalesce(
    var.event_bus_arn,
    "arn:aws:events:${var.aws_region}:${var.aws_caller.account_id}:event-bus/__unused__"
  )
}
locals {
  inline_policies_base = {
    # KMS asymmetric signing/verification for document hashes & certs
    "kms-sign"            = data.aws_iam_policy_document.sign_kms_sign.json

    # Read from documents S3 (final PDFs to be signed/validated)
    "s3-documents-read"   = data.aws_iam_policy_document.sign_s3_documents_read.json

    # Evidence bucket RW with enforced SSE (Put/Get/Abort/Multipart list)
    "s3-evidence-rw"      = data.aws_iam_policy_document.sign_s3_evidence_rw.json

    # Multipart upload flow (CreateMultipart, UploadPart, Complete/Abort)
    "s3-evidence-mpu"     = data.aws_iam_policy_document.sign_s3_evidence_mpu.json

    # Object Lock (retention & legal hold) for evidence immutability
    "s3-object-lock"      = data.aws_iam_policy_document.sign_s3_object_lock.json

    # Outbox table for event publishing (from root)
    "outbox-publisher"    = var.outbox_publisher_policy

    # EventBridge publishing (from root)
    "eventbridge-publisher" = var.eventbridge_publisher_policy

    # CloudWatch custom metrics in the "SignService" namespace
    "cw-metrics"          = data.aws_iam_policy_document.sign_cloudwatch_metrics.json

    # SSM Parameter Store read (feature flags/config)
    "ssm-read"            = data.aws_iam_policy_document.sign_ssm_read.json
  }

  /**
   * @local inline_policies_kms
   * Extra KMS permissions when evidence SSE mode is SSE_KMS.
   */
  inline_policies_kms = var.evidence_encryption == "SSE_KMS" ? {
    "kms-evidence-s3" = data.aws_iam_policy_document.sign_kms_evidence_s3[0].json
  } : {}

  /**
   * @local inline_policies_optional
   * EventBridge policies, only when configured.
   *
   * Always define keys with `null` when not used, then clean them below.
   */
  inline_policies_optional = {
    "events-put" = var.event_bus_arn != null ? data.aws_iam_policy_document.sign_eventbridge_put.json : null
  }

  /**
   * @local inline_policies_clean
   * Filter out null values from optional policies.
   */
  inline_policies_clean = {
    for k, v in local.inline_policies_optional : k => v if v != null
  }

  /**
   * @local inline_policies
   * Final merged inline policies:
   *  - base + (optional KMS for SSE_KMS) + (optional EB) + extra overrides from root.
   */
  inline_policies = merge(
    local.inline_policies_base,
    local.inline_policies_kms,
    local.inline_policies_clean,
    var.extra_inline_policies
  )
}
