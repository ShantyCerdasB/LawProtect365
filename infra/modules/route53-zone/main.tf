/**
 * Creates a public Route 53 hosted zone for the apex domain.
 * The hosted zone is tagged with the project name and environment.
 */
resource "aws_route53_zone" "primary" {
  name = var.cert_base_domain

  tags = {
    Project = var.project_name
    Env     = var.env
  }
}
