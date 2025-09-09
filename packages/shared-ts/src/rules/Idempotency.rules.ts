import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/codes.js";

/**
 * Validates idempotency record freshness.
 */
export const assertIdempotencyFresh = (record?: { key: string; expiresAt: string }): void => {
  if (!record) return;
  const exp = Date.parse(record.expiresAt);
  if (Number.isFinite(exp) && exp > Date.now()) {
    throw new AppError(ErrorCodes.COMMON_CONFLICT, 409, "Idempotent operation already performed");
  }
};






