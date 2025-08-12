/**
 * Creates the main Virtual Private Cloud (VPC).
 * Enables DNS hostnames and DNS support for private name resolution.
 */
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-vpc"
  })
}

/**
 * Creates an Internet Gateway (IGW) for the VPC to allow public internet access.
 */
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-igw"
  })
}

/**
 * Creates public subnets in all specified Availability Zones (AZs).
 * Enables public IP assignment on instance launch.
 */
resource "aws_subnet" "public" {
  for_each                 = toset(var.azs)
  vpc_id                   = aws_vpc.main.id
  availability_zone        = each.key
  cidr_block               = element(var.public_subnet_cidrs, index(var.azs, each.key))
  map_public_ip_on_launch  = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-public-${each.key}"
  })
}

/**
 * Creates private subnets in all specified Availability Zones (AZs).
 * Disables automatic public IP assignment.
 */
resource "aws_subnet" "private" {
  for_each                 = toset(var.azs)
  vpc_id                   = aws_vpc.main.id
  availability_zone        = each.key
  cidr_block               = element(var.private_subnet_cidrs, index(var.azs, each.key))
  map_public_ip_on_launch  = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-private-${each.key}"
  })
}

/**
 * Creates a public route table for routing internet-bound traffic via the Internet Gateway.
 */
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-public-rt"
  })
}

/**
 * Adds a default route in the public route table to the Internet Gateway.
 */
resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

/**
 * Associates all public subnets with the public route table.
 */
resource "aws_route_table_association" "public_assoc" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

/**
 * Allocates an Elastic IP for the NAT Gateway.
 */
resource "aws_eip" "nat_eip" {
  vpc = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-nat-eip"
  })
}

/**
 * Creates a NAT Gateway in the first public subnet for outbound internet access from private subnets.
 */
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public[var.azs[0]].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-nat"
  })
}

/**
 * Creates a private route table for routing internet-bound traffic from private subnets via the NAT Gateway.
 */
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-private-rt"
  })
}

/**
 * Adds a default route in the private route table to the NAT Gateway.
 */
resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

/**
 * Associates all private subnets with the private route table.
 */
resource "aws_route_table_association" "private_assoc" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

/**
 * Creates a security group for Lambda functions.
 * Allows outbound traffic to any destination.
 */
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-${var.env}-lambda-sg"
  description = "Allow outbound to anywhere"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-lambda-sg"
  })
}

/**
 * Creates a security group for RDS instances.
 * Allows inbound PostgreSQL traffic only from the Lambda security group.
 */
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-${var.env}-rds-sg"
  description = "Allow Postgres access from Lambda SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "Postgres"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    security_groups  = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-rds-sg"
  })
}
