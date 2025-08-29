import { z } from "zod";
import { HASH_ALGORITHM } from "../values/enums";

const TrimmedString = z.string().trim();

/**
 * Supported hashing algorithms for digest signatures.
 */
export const HashAlgorithmSchema = z.enum(HASH_ALGORITHM);
export type HashAlgorithmType = z.infer<typeof HashAlgorithmSchema>;

/**
 * Base64url without padding.
 */
const Base64UrlNoPad = /^[A-Za-z0-9_-]+$/;

/**
 * Hash digest holding algorithm and base64url value.
 */
export interface HashDigest {
  alg: z.infer<typeof HashAlgorithmSchema>;
  value: string;
}

export const HashDigestSchema = z.object({
  alg: HashAlgorithmSchema,
  value: TrimmedString.pipe(z.string().regex(Base64UrlNoPad, "Expected base64url")),
});
