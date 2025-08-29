import { AppError } from "@lawprotect/shared-ts";
import { ErrorCodes } from "@lawprotect/shared-ts";
import { ReasonSchema } from "../value-objects/Reason";
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
