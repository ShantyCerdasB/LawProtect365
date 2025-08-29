import { z, TrimmedString } from "@lawprotect/shared-ts";
import { REQUEST_TOKEN_SCOPES } from "../values/enums";

/**
 * Token scopes for public signing flows.
 */
export const RequestTokenScopeSchema = z.enum(REQUEST_TOKEN_SCOPES);
export type RequestTokenScope = z.infer<typeof RequestTokenScopeSchema>;

/**
 * Opaque request token carrying scope and expiration.
 */
export const RequestTokenSchema = z.object({
  token: TrimmedString.pipe(z.string().min(16)),
  scope: RequestTokenScopeSchema,
  expiresAt: z.string().datetime({ offset: true }),
});

export type RequestToken = z.infer<typeof RequestTokenSchema>;
