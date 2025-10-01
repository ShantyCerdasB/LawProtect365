/**
 * ID of the main VPC.
 */
output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

/**
 * List of all public subnet IDs.
 */
output "public_subnet_ids" {
  description = "List of public subnet IDs."
  value       = [for s in aws_subnet.public : s.id]
}

/**
 * List of all private subnet IDs.
 */
output "private_subnet_ids" {
  description = "List of private subnet IDs."
  value       = [for s in aws_subnet.private : s.id]
}

/**
 * ID of the security group used by Lambda functions.
 */
output "lambda_security_group_id" {
  description = "Security Group ID for Lambdas."
  value       = aws_security_group.lambda_sg.id
}

/**
 * ID of the security group used by RDS instances.
 */
output "rds_security_group_id" {
  description = "Security Group ID for RDS."
  value       = aws_security_group.rds_sg.id
}

/**
 * VPC Endpoints information.
 */
output "vpc_endpoints" {
  description = "VPC endpoints information"
  value = {
    s3_endpoint_id         = aws_vpc_endpoint.s3.id
    dynamodb_endpoint_id   = aws_vpc_endpoint.dynamodb.id
    kms_endpoint_id        = aws_vpc_endpoint.kms.id
    eventbridge_endpoint_id = aws_vpc_endpoint.eventbridge.id
  }
}

/**
 * Security group ID for VPC endpoints.
 */
output "vpc_endpoints_security_group_id" {
  description = "Security group ID for VPC endpoints"
  value       = aws_security_group.vpc_endpoints.id
}
