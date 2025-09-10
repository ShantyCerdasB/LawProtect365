/**
 * @file Download.rules.ts
 * @summary Domain rules for document download operations.
 */

import type { EnvelopeStatus } from "@/domain/value-objects/index";
import { invalidEnvelopeState } from "@/shared/errors";

/**
 * Asserts that download operations are allowed based on the envelope's lifecycle state.
 * 
 * @param status - The current envelope status.
 * @throws {InvalidEnvelopeStateError} If downloads are not allowed in the current state.
 */
export const assertDownloadAllowed = (status: EnvelopeStatus): void => {
  // Downloads are allowed when the envelope is in_progress or completed
  const allowedStatuses: EnvelopeStatus[] = ["in_progress", "completed"];

  if (!allowedStatuses.includes(status)) {
    throw invalidEnvelopeState({
      status,
      operation: "download",
      allowedStatuses,
    });
  }
};


