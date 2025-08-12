/**
 * @file Output values for the Aurora Serverless v2 module.
 * Provides identifiers, endpoints, and connection details
 * for use in other Terraform modules or external applications.
 */

/**
 * @output cluster_identifier
 * Unique identifier of the Aurora RDS cluster.
 *
 * @description Useful for referencing the cluster in other Terraform modules or AWS resources.
 * @value aws_rds_cluster.cluster.id
 */
output "cluster_identifier" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.cluster.id
}

/**
 * @output cluster_endpoint
 * Primary writer endpoint for the Aurora RDS cluster.
 *
 * @description Used for read/write connections to the database.
 * @value aws_rds_cluster.cluster.endpoint
 */
output "cluster_endpoint" {
  description = "Primary endpoint to connect"
  value       = aws_rds_cluster.cluster.endpoint
}

/**
 * @output reader_endpoint
 * Read-only endpoint for the Aurora RDS cluster.
 *
 * @description Directs queries to reader instances for read scaling.
 * @value aws_rds_cluster.cluster.reader_endpoint
 */
output "reader_endpoint" {
  description = "Reader endpoint for read-only connections"
  value       = aws_rds_cluster.cluster.reader_endpoint
}

/**
 * @output subnet_group_name
 * Name of the DB Subnet Group associated with the cluster.
 *
 * @description Useful for verifying network placement of the Aurora cluster.
 * @value aws_db_subnet_group.subnet_group.name
 */
output "subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.subnet_group.name
}

/**
 * @output cluster_port
 * TCP port number for database connections.
 *
 * @description Default for PostgreSQL is `5432`.
 * @value aws_rds_cluster.cluster.port
 */
output "cluster_port" {
  description = "Port number to connect to the RDS cluster"
  value       = aws_rds_cluster.cluster.port
}
