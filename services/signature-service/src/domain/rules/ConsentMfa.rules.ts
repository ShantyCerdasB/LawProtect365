import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { ConsentRecordSchema } from "../value-objects/ConsentRecord";

/**
 * Validates consent record must be present and well-formed before signing.
 */
export const assertConsentPresent = (consent: unknown): void => {
  if (!consent) throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Consent required before signing");
  ConsentRecordSchema.parse(consent);
};

/**
 * Validates MFA OTP requirements when party enforces MFA.
 */
export const assertOtpValid = (opts: { required: boolean; code?: string; expiresAt?: number; tries?: number; maxTries: number }): void => {
  if (!opts.required) return;
  if (!opts.code) throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "OTP required");
  if (!opts.expiresAt || Date.now() > opts.expiresAt) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "OTP expired");
  }
  if (typeof opts.tries === "number" && opts.tries >= opts.maxTries) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "OTP attempts exceeded");
  }
};
