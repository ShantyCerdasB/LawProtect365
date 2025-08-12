/**
 * Creates an AWS IAM Role with the specified name and assume role policy.
 *
 * @resource aws_iam_role.role
 * @param {string} var.role_name - Name of the IAM role.
 * @param {string} var.assume_role_policy - IAM policy JSON that defines which principals can assume this role.
 * @tags Project, Env, ManagedBy
 */
resource "aws_iam_role" "role" {
  name               = var.role_name
  assume_role_policy = var.assume_role_policy

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}

/**
 * Attaches AWS managed policies to the IAM Role.
 *
 * @resource aws_iam_role_policy_attachment.managed
 * @param {list(string)} var.managed_policy_arns - List of AWS managed policy ARNs to attach to the role.
 */
resource "aws_iam_role_policy_attachment" "managed" {
  for_each = toset(var.managed_policy_arns)
  role     = aws_iam_role.role.name
  policy_arn = each.value
}

/**
 * Creates inline IAM policies for the IAM Role.
 *
 * Filters out any policies whose keys contain the word "assume" (case-insensitive).
 *
 * @resource aws_iam_role_policy.inline
 * @param {map(string)} var.inline_policies - Map of policy names to policy documents.
 */
resource "aws_iam_role_policy" "inline" {
  for_each = { for k, v in var.inline_policies : k => v if !can(regex("assume", k)) }
  name   = each.key
  role   = aws_iam_role.role.name
  policy = each.value
}
