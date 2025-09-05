/**
 * @file aws.ts
 * @summary AWS-specific types and interfaces
 * @description Shared types for AWS services and operations used across the application
 */


/**
 * @summary AWS service name type
 * @description Represents supported AWS service names.
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
 * @summary AWS resource type
 * @description Represents AWS resource types.
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
 * @summary AWS error types
 * @description Represents AWS error structure for error handling.
 */
export interface AwsError {
  /** Error name */
  readonly name: string;
  /** Error message */
  readonly message: string;
  /** Error code */
  readonly code?: string;
  /** HTTP status code */
  readonly statusCode?: number;
  /** AWS request ID */
  readonly requestId?: string;
  /** Whether the error is retryable */
  readonly retryable?: boolean;
}


/**
 * @summary AWS pagination result
 * @description Generic pagination result structure for AWS API responses.
 */
export interface AwsPaginationResult<T> {
  /** Array of items in the current page */
  readonly items: T[];
  /** Token for the next page */
  readonly nextToken?: string;
  /** Whether there are more items */
  readonly hasMore: boolean;
}

/**
 * @summary AWS tag structure
 * @description Represents an AWS tag with key-value pair.
 */
export interface AwsTag {
  /** Tag key */
  readonly Key: string;
  /** Tag value */
  readonly Value: string;
}

/**
 * @summary AWS tags collection
 * @description Represents a collection of AWS tags.
 */
export type AwsTags = readonly AwsTag[];

/**
 * @summary AWS resource metadata
 * @description Represents metadata for AWS resources.
 */
export interface AwsResourceMetadata {
  /** AWS Resource Name */
  readonly arn: string;
  /** Resource name */
  readonly name: string;
  /** Resource type */
  readonly type: AwsResourceType;
  /** AWS region */
  readonly region: string;
  /** AWS account ID */
  readonly accountId: string;
  /** Resource tags */
  readonly tags?: AwsTags;
  /** Creation timestamp */
  readonly createdAt?: string;
  /** Last update timestamp */
  readonly updatedAt?: string;
}
