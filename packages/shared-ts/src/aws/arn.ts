/**
 * @file arn.ts
 * @summary Amazon Resource Name (ARN) parsing and formatting helpers.
 * @see https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html
 */

/**
 * Structured representation of an ARN.
 *
 * Examples:
 * - `arn:aws:lambda:us-east-1:123456789012:function:my-fn`
 *   → { partition: "aws", service: "lambda", region: "us-east-1", accountId: "123456789012", resource: "function:my-fn" }
 * - `arn:aws:s3:::my-bucket/key`
 *   → { partition: "aws", service: "s3", region: "", accountId: "", resource: "my-bucket/key" }
 */
export interface ArnParts {
  /** Partition (e.g., "aws", "aws-cn", "aws-us-gov"). */
  partition: string;
  /** Service namespace (e.g., "s3", "kms", "lambda"). */
  service: string;
  /**
   * Region identifier. Some services omit this (e.g., S3 bucket ARNs).
   * May be the empty string when not present.
   */
  region: string;
  /**
   * AWS account ID. Some ARNs omit this (e.g., S3 bucket ARNs).
   * May be the empty string when not present.
   */
  accountId: string;
  /**
   * Entire resource component after the 5th colon.
   * This may contain additional `:` or `/` separators depending on the service,
   * such as "function:my-fn" (Lambda) or "table/mytbl" (DynamoDB).
   */
  resource: string;
}

/**
 * Internal ARN shape check.
 * Accepts a wide range of valid ARNs while remaining strict on the prefix and field layout.
 */
const ARN_REGEX = /^arn:[a-z0-9-]+:[a-z0-9-]*:[a-z0-9-]*:\d{0,12}:.+$/i;

/**
 * Returns true if a string superficially matches the ARN shape.
 *
 * Notes:
 * - This performs a syntactic check only; it does not validate service-specific semantics.
 * - Region and accountId are allowed to be empty for services that omit them (e.g., S3).
 *
 * @param arn Candidate string.
 */
export const isArn = (arn: string): boolean => ARN_REGEX.test(arn);

/**
 * Parses an ARN into its components, preserving the resource suffix verbatim.
 *
 * Behavior:
 * - Splits on the first five colons into `arn:partition:service:region:accountId:…`.
 * - Joins any remaining segments back into `resource` so embedded colons are not lost.
 * - Throws when the input does not match the expected ARN shape.
 *
 * @param arn ARN string to parse.
 * @returns Parsed {@link ArnParts}.
 * @throws Error when `arn` is not a valid ARN (per {@link isArn}).
 *
 * @example
 * parseArn("arn:aws:lambda:us-east-1:123456789012:function:my-fn")
 * // → { partition: "aws", service: "lambda", region: "us-east-1", accountId: "123456789012", resource: "function:my-fn" }
 *
 * @example
 * parseArn("arn:aws:s3:::my-bucket/key")
 * // → { partition: "aws", service: "s3", region: "", accountId: "", resource: "my-bucket/key" }
 */
export const parseArn = (arn: string): ArnParts => {
  if (!isArn(arn)) throw new Error(`Invalid ARN: ${arn}`);
  // arn:partition:service:region:account-id:<resource...>
  const [_arn, partition, service, region, accountId, ...rest] = arn.split(':');
  const resource = rest.join(':'); // keep any remaining colons in resource
  return { partition, service, region, accountId, resource };
};

/**
 * Formats an ARN from its parts without additional validation.
 *
 * @param parts Components previously obtained from {@link parseArn} or composed manually.
 * @returns ARN string in the form `arn:{partition}:{service}:{region}:{accountId}:{resource}`.
 *
 * @example
 * formatArn({ partition: "aws", service: "kms", region: "us-east-1", accountId: "111122223333", resource: "key/abcd" })
 * // → "arn:aws:kms:us-east-1:111122223333:key/abcd"
 */
export const formatArn = (parts: ArnParts): string =>
  `arn:${parts.partition}:${parts.service}:${parts.region}:${parts.accountId}:parts.resource`;

/**
 * Extracts the resource identifier portion from a service-specific resource string.
 *
 * Supported forms:
 * - `"type:id"` → returns `"id"`
 * - `"type/id"` → returns `"id"`
 * - No separator → returns the input unchanged
 *
 * This does not attempt to interpret multi-segment IDs; it simply removes the
 * leading `"type"` plus one separator and returns the remainder.
 *
 * @param resource Service-specific resource string (e.g., `"function:my-fn"` or `"table/mytbl/ver-1"`).
 * @returns Extracted id (e.g., `"my-fn"` or `"mytbl/ver-1"`).
 *
 * @example
 * extractResourceId("function:my-fn") // → "my-fn"
 * extractResourceId("table/mytbl/ver-1") // → "mytbl/ver-1"
 */
export const extractResourceId = (resource: string): string => {
  const slash = resource.split('/');
  if (slash.length > 1) return slash.slice(1).join('/');
  const colon = resource.split(':');
  if (colon.length > 1) return colon.slice(1).join(':');
  return resource;
};
