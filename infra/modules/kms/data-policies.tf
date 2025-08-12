############################################
# KMS — Generic Policy (module-level)
############################################

# Locals for determining key usage type
locals {
  # True if the KMS key is for encryption/decryption
  is_encrypt = var.key_usage == "ENCRYPT_DECRYPT"
  # True if the KMS key is for signing/verifying
  is_sign    = var.key_usage == "SIGN_VERIFY"
  # True if the KMS key is for MAC generation/verification
  is_mac     = var.key_usage == "GENERATE_VERIFY_MAC"
}

data "aws_iam_policy_document" "cmk_policy" {
  # 1) Root account full control (prevents lockout)
  statement {
    sid     = "AllowRootAccountFullAccess"
    effect  = "Allow"
    actions = ["kms:*"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.account_id}:root"]
    }

    resources = ["*"]
  }

  # 2) Optional: admin roles — adapt actions to key usage (ENCRYPT_DECRYPT)
  dynamic "statement" {
    for_each = length(var.admin_role_arns) > 0 && local.is_encrypt ? [1] : []
    content {
      sid     = "AllowAdminRolesUseEncrypt"
      effect  = "Allow"
      actions = [
        "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
        "kms:GenerateDataKey*", "kms:DescribeKey"
      ]

      principals {
        type        = "AWS"
        identifiers = var.admin_role_arns
      }

      resources = ["*"]
    }
  }

  # 2b) Optional: admin roles — adapt actions to key usage (SIGN_VERIFY)
  dynamic "statement" {
    for_each = length(var.admin_role_arns) > 0 && local.is_sign ? [1] : []
    content {
      sid     = "AllowAdminRolesUseSign"
      effect  = "Allow"
      actions = [
        "kms:Sign", "kms:Verify", "kms:GetPublicKey", "kms:DescribeKey"
      ]

      principals {
        type        = "AWS"
        identifiers = var.admin_role_arns
      }

      resources = ["*"]
    }
  }

  # 2c) Optional: admin roles — adapt actions to key usage (GENERATE_VERIFY_MAC)
  dynamic "statement" {
    for_each = length(var.admin_role_arns) > 0 && local.is_mac ? [1] : []
    content {
      sid     = "AllowAdminRolesUseMac"
      effect  = "Allow"
      actions = [
        "kms:GenerateMac", "kms:VerifyMac", "kms:DescribeKey"
      ]

      principals {
        type        = "AWS"
        identifiers = var.admin_role_arns
      }

      resources = ["*"]
    }
  }

  # 3) Allow CloudWatch Logs service to use KMS key (ENCRYPT_DECRYPT only)
  dynamic "statement" {
    for_each = var.allow_cloudwatch_logs && local.is_encrypt ? [1] : []
    content {
      sid     = "AllowCloudWatchLogsUse"
      effect  = "Allow"
      actions = [
        "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
        "kms:GenerateDataKey*", "kms:DescribeKey"
      ]

      principals {
        type        = "Service"
        identifiers = ["logs.${var.region}.amazonaws.com"]
      }

      resources = ["*"]

      condition {
        test     = "StringLike"
        variable = "kms:EncryptionContext:aws:logs:arn"
        values   = ["arn:aws:logs:${var.region}:${var.account_id}:log-group:*"]
      }
    }
  }

  # 4) Allow SNS service to use KMS key (ENCRYPT_DECRYPT only)
  dynamic "statement" {
    for_each = var.allow_sns && local.is_encrypt ? [1] : []
    content {
      sid     = "AllowSNSUse"
      effect  = "Allow"
      actions = [
        "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
        "kms:GenerateDataKey*", "kms:DescribeKey"
      ]

      principals {
        type        = "Service"
        identifiers = ["sns.amazonaws.com"]
      }

      resources = ["*"]

      # Restrict to SNS in this AWS account
      condition {
        test     = "StringEquals"
        variable = "aws:SourceAccount"
        values   = [var.account_id]
      }

      # Restrict to SNS topics in this region/account
      condition {
        test     = "ArnLike"
        variable = "aws:SourceArn"
        values   = ["arn:aws:sns:${var.region}:${var.account_id}:*"]
      }
    }
  }
}
