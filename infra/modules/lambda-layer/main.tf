/**
 * @fileoverview Lambda Layer Module
 * @summary Creates AWS Lambda layer for shared dependencies
 * @description Provisions Lambda layer version for sharing common dependencies across multiple Lambda functions
 */

resource "aws_lambda_layer_version" "layer" {
  layer_name          = "${var.layer_name}-${var.env}"
  s3_bucket          = var.s3_bucket
  s3_key             = var.s3_key
  compatible_runtimes = var.compatible_runtimes
  description        = var.description
}