/**
 * @file CancelDecline.rules.ts
 * @summary Domain rules for envelope cancellation and decline operations
 * @description Validates preconditions for canceling or declining envelopes,
 * including status checks and reason validation.
 */

import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { ReasonSchema } from "../value-objects/common";
import { EnvelopeStatus } from "../values/enums";

/**
 * Validates cancel/decline preconditions and reason.
 */
export const assertCancelDeclineAllowed = (status: EnvelopeStatus): void => {
  if (status !== "sent") {
    throw new AppError(ErrorCodes.COMMON_CONFLICT, 409, "Only sent envelopes can be cancelled or declined");
  }
};

/**
 * Validates reason format and revocation side-effects can be orchestrated by callers.
 */
export const assertReasonValid = (reason: unknown): string => ReasonSchema.parse(reason);

