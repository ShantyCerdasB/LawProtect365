/**
 * @fileoverview LinkProviderHandler - HTTP handler for linking OAuth providers
 * @summary Handles HTTP requests for linking OAuth providers to user accounts
 * @description HTTP entry point for the provider linking functionality using
 * the ControllerFactory pattern from shared-ts.
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { LinkProviderBodySchema } from '../../domain/schemas/LinkProviderSchema';
import { LinkProviderUseCase } from '../../application/LinkProviderUseCase';
import { LinkingMode, OAuthProvider } from '../../domain/enums';

export const linkProviderHandler = ControllerFactory.createCommand({
  // Validation schemas
  bodySchema: LinkProviderBodySchema,
  
  // Service configuration
  appServiceClass: class {
    private readonly linkProviderUseCase: LinkProviderUseCase;
    
    constructor() {
      // Create LinkProviderUseCase using CompositionRoot pattern
      this.linkProviderUseCase = CompositionRoot.createLinkProviderUseCase();
    }
    
    async execute(params: any) {
      return await this.linkProviderUseCase.execute(params.request);
    }
  },
  
  // Parameter extraction
  extractParams: (_path: any, body: any, _query: any, context: any) => ({
    request: {
      mode: body.mode as LinkingMode,
      provider: body.provider as OAuthProvider,
      successUrl: body.successUrl,
      failureUrl: body.failureUrl,
      authorizationCode: body.authorizationCode,
      idToken: body.idToken,
      code: body.code,
      state: body.state
    },
    userId: context.auth.userId,
    securityContext: context.auth
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    return {
      linkUrl: result.linkUrl,
      linked: result.linked,
      provider: result.provider,
      providerAccountId: result.providerAccountId,
      linkedAt: result.linkedAt
    };
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: undefined, // Any authenticated user can link providers
  includeSecurityContext: true
});
