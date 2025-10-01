################################################################
# Data sources for IAM assume-role policies
################################################################


data "aws_iam_policy_document" "admin_assume" {
  statement {
    sid     = "AllowSameAccountAdminsWithMFA"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    # Trust ONLY the same account. We'll further restrict with conditions below.
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    # Limit which principals (users/roles) in this account may assume the role
    condition {
      test     = "StringLike"
      variable = "aws:PrincipalArn"
      values = [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*Admin*",
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*Observability*"
        # If you also allow specific users, add:
        # "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/YourAdminUser"
      ]
    }

    # Require MFA for IAM user sessions (recommended for admin roles).
    # NOTE: Remove this block if your admins come via AWS SSO role-chaining.
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# Allows AWS Lambda service to assume the role
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}



# Allows API Gateway service to assume the role
# Needed when API Gateway integrates with AWS services using IAM role
data "aws_iam_policy_document" "apigateway_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}


data "aws_iam_policy_document" "db_secret_read" {
  statement {
    sid     = "ReadDbSecret"
    effect  = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [module.db_secret.secret_arn]
  }
}

data "aws_iam_policy_document" "outbox_publisher" {
  statement {
    sid     = "OutboxPublisher"
    effect  = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      module.event_publisher_service.outbox_table_arn,
      "${module.event_publisher_service.outbox_table_arn}/index/*"
    ]
  }
}

data "aws_iam_policy_document" "eventbridge_publisher" {
  statement {
    sid     = "EventBridgePublisher"
    effect  = "Allow"
    actions = ["events:PutEvents"]
    resources = [module.events.eventbridge_bus_arn]
  }
}

