import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { RequestTokenSchema, type RequestTokenScope } from "../value-objects/RequestToken";

/**
 * Validates request token scope, TTL and single-use semantics.
 */
export const assertRequestToken = (t: unknown, expectedScope: RequestTokenScope, now = Date.now()): void => {
  const tok = RequestTokenSchema.parse(t);
  if (tok.scope !== expectedScope) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Token scope mismatch");
  }
  const exp = Date.parse(tok.expiresAt);
  if (!Number.isFinite(exp) || exp <= now) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Token expired");
  }
};
