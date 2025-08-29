/**
 * @file HashDigest.ts
 * @summary Hash digest value objects for cryptographic integrity verification
 * @description Hash digest value objects with algorithm specification and base64url encoding.
 * Provides schemas for hash digests used in signature verification and integrity checking.
 */

import { z } from "@lawprotect/shared-ts";
import { HASH_ALGORITHM } from "../values/enums";

const TrimmedString = z.string().trim();

/**
 * @description Supported hashing algorithms for digest signatures.
 * Validates that the algorithm is one of the supported types.
 */
export const HashAlgorithmSchema = z.enum(HASH_ALGORITHM);
export type HashAlgorithmType = z.infer<typeof HashAlgorithmSchema>;

/**
 * @description Base64url without padding regex pattern.
 * Used for validating hash digest values.
 */
const Base64UrlNoPad = /^[A-Za-z0-9_-]+$/;

/**
 * @description Hash digest holding algorithm and base64url value.
 * Contains the hashing algorithm used and the computed digest value.
 */
export interface HashDigest {
  /** Hashing algorithm used */
  alg: HashAlgorithmType;
  /** Base64url encoded hash value */
  value: string;
}

/**
 * @description Hash digest schema with validation.
 * Validates algorithm type and base64url format for hash values.
 */
export const HashDigestSchema = z.object({
  /** Hashing algorithm */
  alg: HashAlgorithmSchema,
  /** Base64url encoded hash value */
  value: TrimmedString.pipe(z.string().regex(Base64UrlNoPad, "Expected base64url")),
});

/**
 * @description Simple hash digest type for string values.
 */
export type HashDigestString = string;
