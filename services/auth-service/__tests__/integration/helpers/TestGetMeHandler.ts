/**
 * @fileoverview TestGetMeHandler - Test-specific handler for GET /me endpoint
 * @summary Handler for integration tests that uses TestCompositionRoot
 * @description This handler is specifically designed for integration tests,
 * using TestCompositionRoot to ensure proper test isolation and mocked dependencies.
 */

import { AppError, ErrorCodes, mapError } from '@lawprotect/shared-ts';
import { TestCompositionRoot } from '../TestCompositionRoot';
import { GetMeQuerySchema } from '../../../src/domain/schemas/GetMeSchema';

export const testGetMeHandler = async (evt: any) => {
  try {
    // Parse query parameters if string
    const queryParams = typeof evt.queryStringParameters === 'string' 
      ? JSON.parse(evt.queryStringParameters) 
      : (evt.queryStringParameters ?? {});

    // Zod validation for query parameters
    const query = GetMeQuerySchema.parse(queryParams);

    // Resolve cognitoSub from auth/authorizer
    const cognitoSub = evt?.auth?.cognitoSub || evt?.requestContext?.authorizer?.claims?.sub;
    
    // Check authentication first (401 for unauthenticated users)
    if (!cognitoSub) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 401, 'Authentication required');
    }

    // Extract request parameters (already validated by Zod)
    const request = {
      cognitoSub: cognitoSub,
      includeFlags: query.include || ''
    };

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.getMeUseCase.execute(request);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: result.user,
        headers: result.headers
      })
    };
  } catch (err) {
    return mapError(err);
  }
};
