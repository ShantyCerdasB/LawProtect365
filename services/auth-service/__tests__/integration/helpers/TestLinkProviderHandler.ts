/**
 * @fileoverview TestLinkProviderHandler - Test-specific handler for LinkProvider endpoint
 * @summary Integration test handler for provider linking
 * @description Test handler that uses TestCompositionRoot for provider linking integration tests
 */

import { AppError, ErrorCodes, isValidUserId, mapError } from '@lawprotect/shared-ts';
import { TestCompositionRoot } from '../TestCompositionRoot';
import { LinkProviderBodySchema } from '../../../src/domain/schemas/LinkProviderSchema';

export const testLinkProviderHandler = async (evt: any) => {
  try {
    // Minimal content-type enforcement for tests
    if (evt.headers && evt.headers['Content-Type'] && evt.headers['Content-Type'] !== 'application/json') {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type must be application/json');
    }

    // Parse JSON body if string
    const rawBody = typeof evt.body === 'string' ? JSON.parse(evt.body) : (evt.body ?? {});
    
    // Zod validation to produce 422 on schema errors
    const body = LinkProviderBodySchema.parse(rawBody);

    // Resolve userId from auth/authorizer
    const userId = evt?.auth?.userId || evt?.requestContext?.authorizer?.claims?.['custom:user_id'] || evt?.requestContext?.authorizer?.claims?.sub;
    
    // Check authentication first (401 for unauthenticated users)
    if (!userId) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 401, 'Authentication required');
    }
    
    // Then validate userId format
    if (!isValidUserId(userId)) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Invalid request body', { field: 'userId' });
    }

    // Extract request parameters (already validated by Zod)
    const request = {
      mode: body.mode,
      provider: body.provider,
      successUrl: body.successUrl,
      failureUrl: body.failureUrl,
      authorizationCode: body.authorizationCode,
      idToken: body.idToken,
      code: body.code,
      state: body.state
    };

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.linkProviderUseCase.execute(request, userId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
    } catch (err) {
      return mapError(err);
    }
};
