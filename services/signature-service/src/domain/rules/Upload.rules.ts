/**
 * @file Upload.rules.ts
 * @summary Domain rules for upload operations.
 *
 * @description
 * Validates that upload operations are allowed based on envelope lifecycle state.
 * Uploads are typically allowed during the preparation phase of an envelope.
 */

import type { EnvelopeStatus } from "@/domain/value-objects/EnvelopeStatus";
import { invalidEnvelopeState } from "@/errors";

/**
 * Asserts that upload operations are allowed for the given envelope status.
 *
 * @param status - Current envelope status
 * @throws {AppError} 409 when upload is not allowed for the current status
 */
export const assertUploadAllowed = (status: EnvelopeStatus): void => {
  // Uploads are allowed during draft phase only
  const allowedStatuses: EnvelopeStatus[] = ["draft"];
  
  if (!allowedStatuses.includes(status)) {
    throw invalidEnvelopeState({
      status,
      operation: "upload",
      allowedStatuses,
    });
  }
};
