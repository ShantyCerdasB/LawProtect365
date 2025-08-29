/**
 * @file RequestToken.ts
 * @summary Request token value objects for public signing flows
 * @description Request token value objects for public signing flows.
 * Provides schemas for token scopes and opaque request tokens with expiration
 * for secure public signing operations.
 */

import { z, TrimmedString } from "@lawprotect/shared-ts";
import { REQUEST_TOKEN_SCOPES } from "../values/enums";

/**
 * @description Token scopes for public signing flows.
 * Validates that the scope is one of the supported request token scopes.
 */
export const RequestTokenScopeSchema = z.enum(REQUEST_TOKEN_SCOPES);
export type RequestTokenScope = z.infer<typeof RequestTokenScopeSchema>;

/**
 * @description Opaque request token carrying scope and expiration.
 * Contains token string, scope, and expiration timestamp for secure operations.
 */
export const RequestTokenSchema = z.object({
  /** Token string (minimum 16 characters) */
  token: TrimmedString.pipe(z.string().min(16)),
  /** Token scope for authorization */
  scope: RequestTokenScopeSchema,
  /** Expiration timestamp (ISO datetime with offset) */
  expiresAt: z.string().datetime({ offset: true }),
});

export type RequestToken = z.infer<typeof RequestTokenSchema>;
