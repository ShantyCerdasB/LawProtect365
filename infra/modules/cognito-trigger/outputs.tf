/**
 * @output triggered_pool_id
 * @description
 * ID of the Cognito User Pool after all Lambda triggers have been configured.
 */
output "triggered_pool_id" {
  description = "ID of the Cognito User Pool with all configured Lambda triggers."
  value       = try(null_resource.cognito_attach_triggers.triggers.pool_id, null)
}
