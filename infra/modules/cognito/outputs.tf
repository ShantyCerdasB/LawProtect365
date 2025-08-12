/* Apple IdP omitted until key is ready */

############################################
# Cognito Core Outputs
############################################

/**
 * @output user_pool_id
 * @description
 * Cognito User Pool unique identifier.
 * Used when referencing the pool in other AWS services or modules.
 */
output "user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.pool.id
}

/**
 * @output user_pool_arn
 * @description
 * Amazon Resource Name (ARN) for the Cognito User Pool.
 */
output "user_pool_arn" {
  description = "ARN of the Cognito User Pool."
  value       = aws_cognito_user_pool.pool.arn
}

############################################
# Cognito App Client Outputs
############################################

/**
 * @output user_pool_client_id
 * @description
 * Cognito App Client unique identifier.
 */
output "user_pool_client_id" {
  description = "ID of the Cognito User Pool App Client."
  value       = aws_cognito_user_pool_client.app_client.id
}

/**
 * @output user_pool_client_secret
 * @description
 * Client secret for the Cognito App Client.
 * Marked as sensitive to prevent accidental logging.
 */
output "user_pool_client_secret" {
  description = "Client secret of the Cognito User Pool App Client."
  value       = aws_cognito_user_pool_client.app_client.client_secret
  sensitive   = true
}

############################################
# Cognito Hosted UI Outputs
############################################

/**
 * @output cognito_domain
 * @description
 * Domain prefix configured for the Cognito Hosted UI.
 * Example: myapp-dev
 */
output "cognito_domain" {
  description = "Cognito Hosted UI domain prefix."
  value       = aws_cognito_user_pool_domain.domain.domain
}

/**
 * @output cognito_domain_url
 * @description
 * Fully qualified Cognito Hosted UI endpoint.
 * Includes AWS region and domain prefix.
 */
output "cognito_domain_url" {
  description = "Fully qualified Cognito Hosted UI URL."
  value       = "https://${aws_cognito_user_pool_domain.domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}
