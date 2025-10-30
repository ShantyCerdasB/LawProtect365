/**
 * @fileoverview TestUnlinkProviderHandler - Test-specific handler for POST /me/providers:unlink endpoint
 * @summary Handler for integration tests that uses TestCompositionRoot
 * @description This handler is specifically designed for integration tests,
 * using TestCompositionRoot to ensure proper test isolation and mocked dependencies.
 */

import { AppError, ErrorCodes, mapError } from '@lawprotect/shared-ts';
import { TestCompositionRoot } from '../TestCompositionRoot';
import { UnlinkProviderBodySchema } from '../../../src/domain/schemas/UnlinkProviderSchema';

export const testUnlinkProviderHandler = async (evt: any) => {
  try {
    // Minimal content-type enforcement for tests
    if (evt.headers && evt.headers['Content-Type'] && evt.headers['Content-Type'] !== 'application/json') {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type must be application/json');
    }
    
    // Check if Content-Type header is missing for requests with body
    if (evt.body && (!evt.headers || !evt.headers['Content-Type'])) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type header is required');
    }

    // Parse JSON body if string
    const rawBody = typeof evt.body === 'string' ? JSON.parse(evt.body) : (evt.body ?? {});
    
    // Zod validation to produce 422 on schema errors
    const body = UnlinkProviderBodySchema.parse(rawBody);

    // Resolve cognitoSub from auth/authorizer
    const cognitoSub = evt?.auth?.cognitoSub || evt?.requestContext?.authorizer?.claims?.sub;
    
    // Check authentication first (401 for unauthenticated users)
    if (!cognitoSub) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 401, 'Authentication required');
    }

    // Extract request parameters (already validated by Zod)
    const request = {
      cognitoSub: cognitoSub,
      mode: body.mode,
      provider: body.provider,
      providerAccountId: body.providerAccountId,
      confirmationToken: body.confirmationToken
    };

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.unlinkProviderUseCase.execute(request);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unlinked: result.unlinked,
        provider: result.provider,
        providerAccountId: result.providerAccountId,
        unlinkedAt: result.unlinkedAt,
        status: result.status,
        message: result.message
      })
    };
  } catch (err) {
    return mapError(err);
  }
};
