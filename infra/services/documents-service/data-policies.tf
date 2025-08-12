############################################################
# documents-service — data-policies.tf
# Purpose:
#   - Define IAM policy documents used as inline policies for
#     the Lambda execution role of this service.
#   - Keep the iam-role module generic: we pass a plain map.
#
# What’s here:
#   0) Trust policy for Lambda
#   1) S3 RW for Templates bucket (with SSE/SSE-KMS enforcement)
#   2) S3 RW for Documents bucket (with SSE/SSE-KMS enforcement)
#   3) KMS perms for S3 SSE-KMS (templates/documents) — conditional
#   4) DynamoDB CRUD for the documents single-table
#   5) local.inline_policies (final map consumed by main.tf)
#
# Assumptions:
#   - Buckets & table are created in main.tf:
#       module.templates_bucket.bucket_id
#       module.documents_bucket.bucket_id
#       module.docs_table.table_name
#   - Encryption mode variables (strings):
#       var.templates_encryption  = "SSE_S3" | "SSE_KMS"
#       var.documents_encryption  = "SSE_S3" | "SSE_KMS"
#     And optional key ARNs when SSE_KMS:
#       var.templates_kms_key_arn, var.documents_kms_key_arn
############################################################

############################
# Identity & Region (for ARNs)
############################
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}



############################
# Common locals (ARN helpers)
############################
locals {
  # Buckets (names from child modules)
  templates_bucket_name = module.templates_bucket.bucket_id
  documents_bucket_name = module.documents_bucket.bucket_id

  templates_bucket_arn  = "arn:aws:s3:::${local.templates_bucket_name}"
  templates_objs_arn    = "arn:aws:s3:::${local.templates_bucket_name}/*"

  documents_bucket_arn  = "arn:aws:s3:::${local.documents_bucket_name}"
  documents_objs_arn    = "arn:aws:s3:::${local.documents_bucket_name}/*"

  # DynamoDB table ARN (table + any indexes)
  ddb_table_name        = module.docs_table.table_name
  ddb_table_arn         = "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${local.ddb_table_name}"
  ddb_indexes_arn       = "${local.ddb_table_arn}/index/*"
}

############################################################
# 1) S3 RW — Templates bucket (enforce encryption on writes)
############################################################
data "aws_iam_policy_document" "s3_templates_rw" {
  # List/location/versions
  statement {
    sid     = "TemplatesBucketList"
    effect  = "Allow"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
      "s3:ListBucketVersions",
      "s3:ListBucketMultipartUploads"
    ]
    resources = [local.templates_bucket_arn]
  }

  # Read objects
  statement {
    sid     = "TemplatesObjectsRead"
    effect  = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ]
    resources = [local.templates_objs_arn]
  }

  # Writes MUST be encrypted. We support two modes via var.templates_encryption.
  # SSE-S3 (AES256)
  dynamic "statement" {
    for_each = var.templates_encryption == "SSE_S3" ? [1] : []
    content {
      sid     = "TemplatesObjectsWriteWithSSES3"
      effect  = "Allow"
      actions = [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ]
      resources = [local.templates_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["AES256"]
      }
    }
  }

  # SSE-KMS (aws:kms), enforce algorithm header + the specific CMK id
  dynamic "statement" {
    for_each = var.templates_encryption == "SSE_KMS" ? [1] : []
    content {
      sid     = "TemplatesObjectsWriteWithSSEKMS"
      effect  = "Allow"
      actions = [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ]
      resources = [local.templates_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["aws:kms"]
      }
      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
        values   = [var.templates_kms_key_arn]
      }
    }
  }
}

############################################################
# 2) S3 RW — Documents bucket (uploads & finalized PDFs)
#     Same encryption enforcement as Templates.
############################################################
data "aws_iam_policy_document" "s3_documents_rw" {
  # List/location/versions
  statement {
    sid     = "DocumentsBucketList"
    effect  = "Allow"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
      "s3:ListBucketVersions",
      "s3:ListBucketMultipartUploads"
    ]
    resources = [local.documents_bucket_arn]
  }

  # Read objects
  statement {
    sid     = "DocumentsObjectsRead"
    effect  = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ]
    resources = [local.documents_objs_arn]
  }

  # Writes MUST be encrypted (mode depends on var.documents_encryption)
  # SSE-S3 (AES256)
  dynamic "statement" {
    for_each = var.documents_encryption == "SSE_S3" ? [1] : []
    content {
      sid     = "DocumentsObjectsWriteWithSSES3"
      effect  = "Allow"
      actions = [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ]
      resources = [local.documents_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["AES256"]
      }
    }
  }

  # SSE-KMS (aws:kms), enforce algorithm header + the specific CMK id
  dynamic "statement" {
    for_each = var.documents_encryption == "SSE_KMS" ? [1] : []
    content {
      sid     = "DocumentsObjectsWriteWithSSEKMS"
      effect  = "Allow"
      actions = [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ]
      resources = [local.documents_objs_arn]

      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption"
        values   = ["aws:kms"]
      }
      condition {
        test     = "StringEquals"
        variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
        values   = [var.documents_kms_key_arn]
      }
    }
  }
}

#####################################################################
# 3) KMS for S3 SSE-KMS (Templates & Documents) — optional, conditional
#
#    When buckets enforce SSE-KMS, Lambdas must also have KMS perms to:
#      Encrypt, Decrypt, GenerateDataKey, ReEncrypt*, DescribeKey
#####################################################################
data "aws_iam_policy_document" "kms_templates_s3" {
  count = var.templates_encryption == "SSE_KMS" ? 1 : 0

  statement {
    sid     = "AllowKmsForTemplatesBucket"
    effect  = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:ReEncrypt*",
      "kms:DescribeKey"
    ]
    resources = [var.templates_kms_key_arn]
  }
}

data "aws_iam_policy_document" "kms_documents_s3" {
  count = var.documents_encryption == "SSE_KMS" ? 1 : 0

  statement {
    sid     = "AllowKmsForDocumentsBucket"
    effect  = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:ReEncrypt*",
      "kms:DescribeKey"
    ]
    resources = [var.documents_kms_key_arn]
  }
}

############################################################
# 4) DynamoDB CRUD — single-table (templates, drafts, doc meta)
############################################################
data "aws_iam_policy_document" "ddb_docs_rw" {
  statement {
    sid     = "DynamoDbCrudOnTable"
    effect  = "Allow"
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      local.ddb_table_arn,
      local.ddb_indexes_arn  # safe even if no GSIs; IAM will just ignore
    ]
  }
}

############################################################
# 5) Final inline policies map for the role module
############################################################
locals {
  inline_policies_base = {
    "s3-templates-rw" = data.aws_iam_policy_document.s3_templates_rw.json
    "s3-documents-rw" = data.aws_iam_policy_document.s3_documents_rw.json
    "ddb-docs-rw"     = data.aws_iam_policy_document.ddb_docs_rw.json
  }

  inline_policies_kms = merge(
    var.templates_encryption == "SSE_KMS" ? {
      "kms-templates-s3" = data.aws_iam_policy_document.kms_templates_s3[0].json
    } : {},
    var.documents_encryption == "SSE_KMS" ? {
      "kms-documents-s3" = data.aws_iam_policy_document.kms_documents_s3[0].json
    } : {}
  )

  # Exported symbol consumed by main.tf:
  inline_policies = merge(local.inline_policies_base, local.inline_policies_kms, var.extra_inline_policies)
}
