/**
 * @file Provisions an AWS CloudFront distribution with an Origin Access Identity (OAI),
 * optional S3 bucket access restriction, and custom SSL support via ACM.
 */

########################################
# 1) Origin Access Identity (OAI)
########################################

/**
 * @resource aws_cloudfront_origin_access_identity.oai
 * Creates a CloudFront Origin Access Identity (OAI) to securely serve
 * content from a private S3 bucket through CloudFront.
 *
 * @param comment Identifying comment for the OAI (includes project and environment).
 */
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "${var.project_name}-${var.env}-oai"
}

########################################
# 2) Optional S3 Bucket Policy Restriction
########################################

/**
 * @data aws_iam_policy_document.s3_policy
 * Builds an IAM policy document restricting `s3:GetObject` access
 * to the CloudFront OAI only.
 *
 * @condition Created only if `var.restrict_bucket_access` is true.
 * @param principals Identifies the OAI as the only allowed principal.
 * @param resources  Targets all objects in the specified bucket.
 */
data "aws_iam_policy_document" "s3_policy" {
  count = var.restrict_bucket_access ? 1 : 0

  statement {
    actions = ["s3:GetObject"]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
    resources = ["arn:aws:s3:::${var.bucket_name}/*"]
  }
}

/**
 * @resource aws_s3_bucket_policy.restrict
 * Attaches the bucket policy restricting access to the CloudFront OAI.
 *
 * @condition Created only if `var.restrict_bucket_access` is true.
 */
resource "aws_s3_bucket_policy" "restrict" {
  count  = var.restrict_bucket_access ? 1 : 0
  bucket = var.bucket_name
  policy = data.aws_iam_policy_document.s3_policy[0].json
}

########################################
# 3) CloudFront Distribution
########################################

/**
 * @resource aws_cloudfront_distribution.cdn
 * Provisions a CloudFront distribution serving content from the private S3 bucket via OAI.
 *
 * @description
 * - Enforces HTTPS
 * - Supports compression
 * - Uses `index.html` as default root object
 * - Optionally uses ACM certificate for SSL
 * - Supports custom domain aliases
 * - No geo restrictions
 *
 * @param comment     Identifier for the distribution (project + environment).
 * @param price_class CloudFront price class for edge location coverage.
 * @param origin      Configured with OAI for private S3 content delivery.
 * @param default_cache_behavior Redirects HTTP to HTTPS, allows only GET/HEAD, and disables cookies/query strings.
 * @param aliases     Optional CNAMEs for custom domains.
 * @param viewer_certificate Uses ACM cert if `var.acm_certificate_arn` is set.
 */
resource "aws_cloudfront_distribution" "cdn" {
  comment     = "${var.project_name}-${var.env}-cdn"
  enabled     = true
  price_class = var.price_class

  origin {
    domain_name = "${var.bucket_name}.s3.amazonaws.com"
    origin_id   = "${var.bucket_name}-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "${var.bucket_name}-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  default_root_object = "index.html"

  aliases = var.aliases

  dynamic "viewer_certificate" {
    for_each = var.acm_certificate_arn != "" ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2019"
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Project   = var.project_name
    Env       = var.env
    ManagedBy = "Terraform"
  }
}
