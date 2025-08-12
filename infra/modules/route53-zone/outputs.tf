output "zone_id" {
  description = "ID of the public Route 53 hosted zone."
  value       = aws_route53_zone.primary.zone_id
}

output "route53_name_servers" {
  description = "Name servers assigned to the Route 53 hosted zone"
  value       = aws_route53_zone.primary.name_servers
}