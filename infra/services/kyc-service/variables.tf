# infra/services/kyc-service/variables.tf
#
# Inputs for the kyc-service microservice.
variable "project_name" {
  description = "The project name"
  type        = string
}
variable "env" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}
