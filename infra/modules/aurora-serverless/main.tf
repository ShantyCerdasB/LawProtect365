/**
 * @file Provisions an Amazon Aurora PostgreSQL Serverless v2 cluster
 * with a subnet group, scaling configuration, and at least one instance.
 */

########################################
# Subnet Group for Aurora Cluster
########################################

/**
 * @resource aws_db_subnet_group.subnet_group
 * Creates a dedicated DB Subnet Group for the Aurora cluster.
 *
 * @description Ensures that the cluster runs in the specified private subnets.
 * @param name       Name of the DB Subnet Group (derived from cluster identifier).
 * @param subnet_ids List of VPC subnet IDs where the database will be deployed.
 * @param tags       Resource tags for identification and management.
 */
resource "aws_db_subnet_group" "subnet_group" {
  name       = "${var.cluster_identifier}-subnets"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

########################################
# Aurora PostgreSQL Cluster
########################################

/**
 * @resource aws_rds_cluster.cluster
 * Creates an Aurora PostgreSQL Serverless v2 cluster in provisioned mode.
 *
 * @description Supports auto-pause when capacity is set to 0 ACU minimum.
 * @param cluster_identifier Unique name for the cluster.
 * @param engine             Database engine (Aurora PostgreSQL).
 * @param engine_version     Version of the Aurora PostgreSQL engine.
 * @param engine_mode        Set to "provisioned" to use Serverless v2.
 * @param serverlessv2_scaling_configuration Defines minimum and maximum capacity for auto-scaling.
 * @param database_name      Initial database name created in the cluster.
 * @param master_username    Master user for the cluster.
 * @param master_password    Password for the master user.
 * @param db_subnet_group_name Name of the DB Subnet Group for the cluster.
 * @param vpc_security_group_ids List of VPC security group IDs attached to the cluster.
 * @param backup_retention_period Number of days to retain automated backups.
 * @param skip_final_snapshot Whether to skip final snapshot when deleting the cluster.
 * @param tags               Resource tags for identification and management.
 */
resource "aws_rds_cluster" "cluster" {
  cluster_identifier = var.cluster_identifier
  engine             = "aurora-postgresql"
  engine_version     = var.engine_version

  # Serverless v2 in provisioned mode with zero-capacity auto-pause
  engine_mode = "provisioned"

  serverlessv2_scaling_configuration {
    # 0 ACU minimum to enable auto-pause
    min_capacity = var.scaling_configuration.min_capacity
    max_capacity = var.scaling_configuration.max_capacity
  }

  database_name           = var.database_name
  master_username         = var.master_username
  master_password         = var.master_password
  db_subnet_group_name    = aws_db_subnet_group.subnet_group.name
  vpc_security_group_ids  = var.vpc_security_group_ids
  backup_retention_period = var.backup_retention_period
  skip_final_snapshot     = var.skip_final_snapshot
  
  # Security: Enable storage encryption
  storage_encrypted = true
  kms_key_id       = var.kms_key_id

  tags = var.tags
}

########################################
# Aurora Serverless v2 Instance
########################################

/**
 * @resource aws_rds_cluster_instance.serverless_v2
 * Creates at least one Serverless v2-compatible instance in the cluster.
 *
 * @description Required for the Aurora Serverless v2 cluster to operate.
 * @param count              Fixed at 1 to ensure cluster availability.
 * @param identifier         Name for the database instance.
 * @param cluster_identifier Reference to the parent Aurora cluster.
 * @param instance_class     Set to "db.serverless" for Serverless v2.
 * @param engine             Matches the parent Aurora cluster engine.
 * @param engine_version     Matches the parent Aurora cluster engine version.
 */
resource "aws_rds_cluster_instance" "serverless_v2" {
  count              = 1
  identifier         = "${var.cluster_identifier}-instance"
  cluster_identifier = aws_rds_cluster.cluster.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.cluster.engine
  engine_version     = aws_rds_cluster.cluster.engine_version
}
