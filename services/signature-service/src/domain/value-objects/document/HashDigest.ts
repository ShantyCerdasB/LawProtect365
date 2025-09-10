/**
 * @file HashDigest.ts
 * @summary Hash digest value objects for cryptographic integrity verification
 * @description Hash digest value objects with algorithm specification and base64url encoding.
 * Provides schemas for hash digests used in signature verification and integrity checking.
 */

import { Base64UrlNoPad, z } from "@lawprotect/shared-ts";
import { HASH_ALGORITHM } from "../../values/enums";

const TrimmedString = z.string().trim();

// HashAlgorithmSchema, HashAlgorithmType, and HashDigest interface removed
// The codebase uses HashAlgorithm from enums.ts and inline digest objects

/**
 * @description Hash digest schema with validation.
 * Validates algorithm type and base64url format for hash values.
 */
export const HashDigestSchema = z.object({
  /** Hashing algorithm */
  alg: z.enum(HASH_ALGORITHM),
  /** Base64url encoded hash value */
  value: TrimmedString.pipe(z.string().regex(Base64UrlNoPad, "Expected base64url"))});

