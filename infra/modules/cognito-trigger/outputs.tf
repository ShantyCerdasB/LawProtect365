/**
 * @output triggered_pool_id
 * @description
 * ID of the Cognito User Pool after the PreAuthentication Lambda trigger has been set.
 */
output "triggered_pool_id" {
  description = "ID of the Cognito User Pool with the new PreAuthentication trigger."
  value       = null_resource.cognito_attach_pre_auth.triggers.pool_id
}
