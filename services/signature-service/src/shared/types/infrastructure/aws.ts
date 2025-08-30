/**
 * @file aws.ts
 * @summary AWS-specific types and interfaces
 * @description Shared types for AWS services and operations used across the application
 */

/**
 * @description AWS region type
 */
export type AwsRegion = string;

/**
 * @description AWS account ID type
 */
export type AwsAccountId = string;

/**
 * @description AWS ARN type
 */
export type AwsArn = string;

/**
 * @description AWS service name type
 */
export type AwsServiceName = 
  | "dynamodb"
  | "s3"
  | "kms"
  | "eventbridge"
  | "ssm"
  | "lambda"
  | "apigateway"
  | "cloudwatch"
  | "iam";

/**
 * @description AWS resource type
 */
export type AwsResourceType = 
  | "table"
  | "bucket"
  | "key"
  | "function"
  | "role"
  | "policy"
  | "parameter"
  | "event-bus"
  | "log-group";

/**
 * @description AWS error types
 */
export interface AwsError {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  retryable?: boolean;
}

/**
 * @description AWS pagination token
 */
export type AwsPaginationToken = string;

/**
 * @description AWS pagination result
 */
export interface AwsPaginationResult<T> {
  items: T[];
  nextToken?: AwsPaginationToken;
  hasMore: boolean;
}

/**
 * @description AWS tag structure
 */
export interface AwsTag {
  Key: string;
  Value: string;
}

/**
 * @description AWS tags collection
 */
export type AwsTags = AwsTag[];

/**
 * @description AWS resource metadata
 */
export interface AwsResourceMetadata {
  arn: AwsArn;
  name: string;
  type: AwsResourceType;
  region: AwsRegion;
  accountId: AwsAccountId;
  tags?: AwsTags;
  createdAt?: string;
  updatedAt?: string;
}
