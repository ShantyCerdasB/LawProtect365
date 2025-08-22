
import { HashDigestSchema } from "../value-objects/HashDigest";
import { KmsAlgorithmSchema } from "../value-objects/Kms";
import { signatureHashMismatch, kmsPermissionDenied, invalidEnvelopeState } from "@/errors";

/**
 * Validates that the uploaded PDF digest matches the expected digest.
 *
 * Uses domain error {@link signatureHashMismatch} (HTTP 422) when values differ.
 *
 * @param provided - Provided digest containing algorithm and hex/base64 value.
 * @param expected - Expected digest containing algorithm and hex/base64 value.
 * @throws {UnprocessableEntityError} When the digest algorithm or value does not match.
 */
export const assertPdfDigestMatches = (
  provided: { alg: string; value: string },
  expected: { alg: string; value: string }
): void => {
  const p = HashDigestSchema.parse(provided);
  const e = HashDigestSchema.parse(expected);

  if (p.alg !== e.alg || p.value !== e.value) {
    throw signatureHashMismatch({ provided: p, expected: e });
  }
};

/**
 * Validates that the KMS signing algorithm is allowed by policy.
 *
 * Uses domain error {@link kmsPermissionDenied} (HTTP 403) when the algorithm is disallowed.
 *
 * @param alg - KMS algorithm identifier to validate.
 * @param allowed - Optional allowlist of permitted algorithms.
 * @throws {ForbiddenError} When the algorithm is not in the allowed list.
 */
export const assertKmsAlgorithmAllowed = (
  alg: string,
  allowed?: ReadonlyArray<string>
): void => {
  const parsed = KmsAlgorithmSchema.parse(alg);
  if (allowed && !allowed.includes(parsed)) {
    throw kmsPermissionDenied({ algorithm: parsed });
  }
};

/**
 * Ensures an envelope can be completed.
 *
 * Requirement:
 * - All required signers must have signed.
 *
 * Uses domain error {@link invalidEnvelopeState} (HTTP 409) when the
 * completion preconditions are not satisfied.
 *
 * @param stats - Aggregate signing statistics.
 * @param stats.requiredSigners - Number of required signers.
 * @param stats.signedCount - Number of signers who have signed.
 * @throws {ConflictError} When not all required signers have signed.
 */
export const assertCompletionAllowed = (stats: {
  requiredSigners: number;
  signedCount: number;
}): void => {
  if (stats.signedCount < stats.requiredSigners) {
    throw invalidEnvelopeState({
      reason: "incomplete_signatures",
      requiredSigners: stats.requiredSigners,
      signedCount: stats.signedCount,
    });
  }
};
