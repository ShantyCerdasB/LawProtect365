import { z, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * KMS key identifier (ARN or key id) branded.
 */
export type KmsKeyId = Brand<string, "KmsKeyId">;

export const KmsKeyIdSchema = TrimmedString.transform((v) => v as KmsKeyId);

/**
 * KMS signing algorithm enumeration.
 */
export const KmsAlgorithmSchema = z.enum([
  "RSASSA_PSS_SHA_256",
  "RSASSA_PSS_SHA_384",
  "RSASSA_PSS_SHA_512",
  "RSASSA_PKCS1_V1_5_SHA_256",
  "RSASSA_PKCS1_V1_5_SHA_384",
  "RSASSA_PKCS1_V1_5_SHA_512",
  "ECDSA_SHA_256",
  "ECDSA_SHA_384",
  "ECDSA_SHA_512",
]);

export type KmsAlgorithm = z.infer<typeof KmsAlgorithmSchema>;
