# infra/services/chatbot-service/variables.tf
#
# Inputs for the chatbot-service microservice.
variable "project_name" {
  description = "The project name"
  type        = string
}
variable "env" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}
# TODO: add other variables this service needs (e.g. code_bucket, lambda_exec_role_arn, networking outputs…)
