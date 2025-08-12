output "bucket_id" {
  description = "ID of the S3 bucket hosting static assets."
  value       = module.frontend_bucket.bucket_id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket hosting static assets."
  value       = module.frontend_bucket.bucket_arn
}

output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone."
  value       = module.route53_zone.zone_id
}

output "certificate_arn" {
  description = "ARN of the ACM certificate."
  value       = module.acm.certificate_arn
}

output "certificate_domain" {
  description = "Primary domain name covered by the ACM certificate."
  value       = module.acm.certificate_domain
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name."
  value       = module.cloudfront.domain_name
}

output "distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = module.cloudfront.distribution_id
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted Zone ID of the CloudFront distribution (useful for creating Route 53 alias records)."
  value       = module.cloudfront.hosted_zone_id
}

output "frontend_domain" {
  description = "Fully qualified domain name (FQDN) for your frontend."
  value       = local.frontend_domain
}

output "callback_url" {
  description = "OAuth callback URL for authentication service."
  value       = local.callback_url
}

output "logout_url" {
  description = "OAuth logout URL for authentication service."
  value       = local.logout_url
}

output "service_name" {
  description = "Logical service identifier for this microservice."
  value       = var.service_name
}

output "budget_dashboard_name" {
  description = "Name of the CloudWatch dashboard created for the frontend service budgets."
  value       = module.frontend_budgets.dashboard_name
}

output "budget_dashboard_services" {
  description = "List of service names included in the budgets dashboard for this service."
  value       = try(module.frontend_budgets.dashboard_services, [var.service_name])
}

output "budget_service_budget_ids" {
  description = "Map of budget IDs created for this service, keyed by budget name."
  value       = module.frontend_budgets.service_budget_ids
}
