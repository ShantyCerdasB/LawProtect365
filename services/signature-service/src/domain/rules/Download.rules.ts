/**
 * @file Download.rules.ts
 * @summary Domain rules for document download operations.
 */

import type { EnvelopeStatus } from "@/domain/value-objects/EnvelopeStatus";
import { invalidEnvelopeState } from "@/shared/errors";

/**
 * Asserts that download operations are allowed based on the envelope's lifecycle state.
 * 
 * @param status - The current envelope status.
 * @throws {InvalidEnvelopeStateError} If downloads are not allowed in the current state.
 */
export const assertDownloadAllowed = (status: EnvelopeStatus): void => {
  // Downloads are allowed only when the envelope is completed
  const allowedStatuses: EnvelopeStatus[] = ["completed"];

  if (!allowedStatuses.includes(status)) {
    throw invalidEnvelopeState({
      status,
      operation: "download",
      allowedStatuses,
    });
  }
};
