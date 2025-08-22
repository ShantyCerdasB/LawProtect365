import { z, TrimmedString } from "@lawprotect/shared-ts";

/**
 * Supported hashing algorithms for digest signatures.
 */
export const HashAlgorithmSchema = z.enum(["sha256", "sha384", "sha512"]);

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
