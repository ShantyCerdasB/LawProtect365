/**
 * @fileoverview LinkProviderSchema - Zod schemas for provider linking validation
 * @summary Defines validation schemas for provider linking requests and responses
 * @description Zod schemas for validating provider linking requests and responses
 */

import { z } from 'zod';
import { LinkingMode, OAuthProvider } from '../enums';

export const LinkProviderBodySchema = z.object({
  mode: z.nativeEnum(LinkingMode),
  provider: z.nativeEnum(OAuthProvider),
  // For redirect mode
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
  // For direct/finalize mode
  authorizationCode: z.string().optional(),
  idToken: z.string().optional(),
  // For finalize mode
  code: z.string().optional(),
  state: z.string().optional()
}).refine(
  (data) => {
    // For redirect mode, successUrl and failureUrl are required
    if (data.mode === LinkingMode.REDIRECT) {
      return data.successUrl && data.failureUrl;
    }
    // For direct/finalize mode, either authorizationCode or idToken is required
    if (data.mode === LinkingMode.DIRECT || data.mode === LinkingMode.FINALIZE) {
      return data.authorizationCode || data.idToken;
    }
    return true;
  },
  {
    message: 'Invalid request parameters for the specified mode'
  }
);

export const LinkProviderResponseSchema = z.object({
  linkUrl: z.string().url().optional(),
  linked: z.boolean().optional(),
  provider: z.nativeEnum(OAuthProvider).optional(),
  providerAccountId: z.string().optional(),
  linkedAt: z.string().datetime().optional()
});

export type LinkProviderBody = z.infer<typeof LinkProviderBodySchema>;
export type LinkProviderResponse = z.infer<typeof LinkProviderResponseSchema>;
