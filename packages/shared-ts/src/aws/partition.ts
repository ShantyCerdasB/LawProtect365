/**
 * AWS partition helpers for standard, China and GovCloud regions.
 */

const CN = new Set(["cn-north-1", "cn-northwest-1"]);
const GOV = new Set([
  "us-gov-east-1",
  "us-gov-west-1"
]);

/**
 * Returns the AWS partition for a given region.
 * @param region Region identifier (e.g., "us-east-1").
 */
export const partitionForRegion = (region: string): "aws" | "aws-cn" | "aws-us-gov" => {
  const r = region.toLowerCase();
  if (CN.has(r)) return "aws-cn";
  if (GOV.has(r)) return "aws-us-gov";
  return "aws";
};
