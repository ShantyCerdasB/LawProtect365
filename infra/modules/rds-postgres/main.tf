/**
 * Creates a dedicated DB Subnet Group for the PostgreSQL RDS instance.
 * Ensures the instance runs in the specified private subnets.
 */
resource "aws_db_subnet_group" "subnet_group" {
  name       = "${var.instance_identifier}-subnets"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

/**
 * Security Group for the RDS instance.
 * If allowed_ips is provided, inbound rules for port 5432 are created.
 */
resource "aws_security_group" "rds_sg" {
  name        = "${var.instance_identifier}-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id
  tags        = var.tags
}

resource "aws_security_group_rule" "allow_postgres_ips" {
  count             = length(var.allowed_ips)
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [var.allowed_ips[count.index]]
  security_group_id = aws_security_group.rds_sg.id
}

/**
 * Provisions an Amazon RDS for PostgreSQL instance.
 *
 * Defaults to db.t3.micro to qualify for AWS Free Tier (750 hrs/month, 20GB).
 */
resource "aws_db_instance" "postgres" {
  identifier              = var.instance_identifier
  engine                  = "postgres"
  engine_version          = var.engine_version
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  storage_type            = "gp3"
  db_name                 = var.database_name
  username                = var.master_username
  password                = var.master_password
  publicly_accessible     = var.publicly_accessible
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.subnet_group.name
  backup_retention_period = var.backup_retention_period
  skip_final_snapshot     = var.skip_final_snapshot
  deletion_protection     = var.deletion_protection
  multi_az                = false
  tags                    = var.tags
}
