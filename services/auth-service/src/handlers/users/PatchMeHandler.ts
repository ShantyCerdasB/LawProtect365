/**
 * @fileoverview PatchMeHandler - HTTP handler for user profile updates
 * @summary HTTP entry point for PATCH /me
 * @description Handles HTTP requests for updating user profile information
 * including name, personal info, and validation.
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { PatchMeBodySchema } from '../../domain/schemas/PatchMeSchema';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { PatchMeUseCase } from '../../application/users/PatchMeUseCase';

/**
 * HTTP handler for PATCH /me
 * 
 * Provides user profile update functionality for authenticated users.
 * Supports updating name, givenName, lastName, and personal info.
 */
export const patchMeHandler = ControllerFactory.createCommand({
  bodySchema: PatchMeBodySchema,
  
  appServiceClass: class {
    private readonly patchMeUseCase: PatchMeUseCase;
    
    constructor() {
      this.patchMeUseCase = CompositionRoot.createPatchMeUseCase();
    }
    
    async execute(params: { 
      userId: string;
      request: any;
    }) {
      return await this.patchMeUseCase.execute(
        params.userId,
        params.request
      );
    }
  },
  
  extractParams: (_path: any, body: any, _query: any, context: any) => ({
    userId: context.auth.userId,
    request: body
  }),
  
  responseType: 'ok',
  transformResult: async (result: any) => result,
  
  requireAuth: true,
  includeSecurityContext: true
});
