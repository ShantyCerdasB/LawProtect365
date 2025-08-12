/**
 * Null resource to attach a PreAuthentication Lambda to an existing Cognito User Pool.
 * Uses `aws cognito-idp update-user-pool` via AWS CLI to avoid recreation of the pool.
 */
resource "null_resource" "cognito_attach_pre_auth" {
  triggers = {
    pool_id    = var.user_pool_id
    lambda_arn = var.pre_auth_lambda_arn
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws cognito-idp update-user-pool --user-pool-id ${self.triggers.pool_id} --lambda-config PreAuthentication=${self.triggers.lambda_arn}
    EOT
  }
}
