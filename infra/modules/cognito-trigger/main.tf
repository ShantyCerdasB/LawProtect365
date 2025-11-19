/**
 * Single null resource to attach all Cognito Lambda triggers to the User Pool in one atomic operation.
 * Uses `aws cognito-idp update-user-pool` via AWS CLI to avoid recreation of the pool.
 * All triggers are updated in a single API call to prevent ConcurrentModificationException.
 */
resource "null_resource" "cognito_attach_triggers" {
  triggers = {
    pool_id                      = var.user_pool_id
    pre_auth_lambda_arn          = coalesce(var.pre_auth_lambda_arn, "")
    post_auth_lambda_arn         = coalesce(var.post_auth_lambda_arn, "")
    post_confirmation_lambda_arn = coalesce(var.post_confirmation_lambda_arn, "")
    pre_token_gen_lambda_arn     = coalesce(var.pre_token_generation_lambda_arn, "")
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command = <<-EOT
      $poolId = '${self.triggers.pool_id}'
      $lambdaConfig = @()
      
      if ('${self.triggers.pre_auth_lambda_arn}' -ne '' -and '${self.triggers.pre_auth_lambda_arn}' -ne 'null') {
        $lambdaConfig += "PreAuthentication=${self.triggers.pre_auth_lambda_arn}"
      }
      if ('${self.triggers.post_auth_lambda_arn}' -ne '' -and '${self.triggers.post_auth_lambda_arn}' -ne 'null') {
        $lambdaConfig += "PostAuthentication=${self.triggers.post_auth_lambda_arn}"
      }
      if ('${self.triggers.post_confirmation_lambda_arn}' -ne '' -and '${self.triggers.post_confirmation_lambda_arn}' -ne 'null') {
        $lambdaConfig += "PostConfirmation=${self.triggers.post_confirmation_lambda_arn}"
      }
      if ('${self.triggers.pre_token_gen_lambda_arn}' -ne '' -and '${self.triggers.pre_token_gen_lambda_arn}' -ne 'null') {
        $lambdaConfig += "PreTokenGeneration=${self.triggers.pre_token_gen_lambda_arn}"
      }
      
      if ($lambdaConfig.Count -gt 0) {
        $configString = $lambdaConfig -join ','
        Write-Host "Updating Cognito User Pool $poolId with triggers: $configString"
        aws cognito-idp update-user-pool --user-pool-id $poolId --lambda-config $configString
      } else {
        Write-Host "No Lambda triggers to configure (all ARNs are empty)"
      }
    EOT
  }
}
