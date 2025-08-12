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
 * ID of the NAT Gateway.
 */
output "nat_gateway_id" {
  description = "NAT Gateway ID."
  value       = aws_nat_gateway.nat.id
}
