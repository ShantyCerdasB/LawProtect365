/** The unique identifier of the RDS instance */
output "instance_identifier" {
  value       = aws_db_instance.postgres.id
  description = "RDS instance identifier"
}

/** The DNS endpoint to connect to the DB */
output "endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS endpoint"
}

/** The port number used for database connections */
output "port" {
  value       = aws_db_instance.postgres.port
  description = "Database connection port"
}

/** The name of the associated DB Subnet Group */
output "subnet_group_name" {
  value       = aws_db_subnet_group.subnet_group.name
  description = "DB subnet group name"
}
