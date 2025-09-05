# infra/services/cases-service/variables.tf
#
# Inputs for the cases-service microservice.
variable "project_name" {
  description = "The project name"
  type        = string
}
variable "env" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}
