import { z } from 'zod';
import { UnlinkingMode, OAuthProvider, ProviderUnlinkingStatus } from '../enums';

export const UnlinkProviderBodySchema = z.object({
  mode: z.nativeEnum(UnlinkingMode),
  provider: z.nativeEnum(OAuthProvider),
  providerAccountId: z.string().min(1),
  confirmationToken: z.string().optional()
});

export const UnlinkProviderResponseSchema = z.object({
  unlinked: z.boolean(),
  provider: z.nativeEnum(OAuthProvider),
  providerAccountId: z.string(),
  unlinkedAt: z.string().datetime().optional(),
  status: z.nativeEnum(ProviderUnlinkingStatus),
  message: z.string().optional()
});

export type UnlinkProviderBody = z.infer<typeof UnlinkProviderBodySchema>;
export type UnlinkProviderResponse = z.infer<typeof UnlinkProviderResponseSchema>;
