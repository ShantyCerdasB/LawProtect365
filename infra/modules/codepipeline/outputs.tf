/**
 * @file Output values for AWS CodePipeline Module
 * Exposes pipeline name, ARN, and AWS console URL.
 */

########################################
# Pipeline Outputs
########################################
output "codepipeline_name" {
  description = "The name of the CodePipeline"
  value       = aws_codepipeline.pipeline.name
}

output "codepipeline_arn" {
  description = "The ARN of the CodePipeline"
  value       = aws_codepipeline.pipeline.arn
}

output "codepipeline_console_url" {
  description = "Console URL for this pipeline"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.pipeline.name}/view?region=${data.aws_region.current.name}"
}
