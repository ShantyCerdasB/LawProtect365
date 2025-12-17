/**
 * @fileoverview UnlinkProviderHandler - HTTP handler for unlinking OAuth providers
 * @summary Handles POST /me/providers:unlink endpoint
 * @description HTTP entry point for unlinking OAuth providers from user accounts
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { UnlinkProviderBodySchema } from '../../domain/schemas/UnlinkProviderSchema';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { UnlinkProviderUseCase } from '../../application/users/UnlinkProviderUseCase';
import { UnlinkingMode } from '../../domain/enums';

export const unlinkProviderHandler = ControllerFactory.createCommand({
  bodySchema: UnlinkProviderBodySchema,

  appServiceClass: class {
    private readonly unlinkProviderUseCase: UnlinkProviderUseCase;

    constructor() {
      this.unlinkProviderUseCase = CompositionRoot.createUnlinkProviderUseCase();
    }

    async execute(params: any) {
      return await this.unlinkProviderUseCase.execute({
        cognitoSub: params.cognitoSub,
        provider: params.provider,
        providerAccountId: params.providerAccountId,
        mode: params.mode || UnlinkingMode.DIRECT,
        confirmationToken: params.confirmationToken,
      });
    }
  },

  extractParams: (_path: any, body: any, _query: any, context: any) => ({
    cognitoSub: context.auth.cognitoSub,
    provider: body.provider,
    providerAccountId: body.providerAccountId,
    mode: body.mode,
    confirmationToken: body.confirmationToken,
  }),

  responseType: 'ok',
  transformResult: async (result: any) => {
    return {
      unlinked: result.unlinked,
      provider: result.provider,
      providerAccountId: result.providerAccountId,
      unlinkedAt: result.unlinkedAt,
      status: result.status,
      message: result.message,
    };
  },

  requireAuth: true,
  requiredRoles: undefined,
  includeSecurityContext: true,
});
