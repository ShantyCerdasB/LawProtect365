/**
 * @fileoverview TestSetUserRoleAdminHandler - Test-specific handler for POST /admin/users/{id}:set-role endpoint
 * @summary Handler for integration tests that uses TestCompositionRoot
 * @description This handler is specifically designed for integration tests,
 * using TestCompositionRoot to ensure proper test isolation and mocked dependencies.
 */

import { AppError, ErrorCodes, mapError, isValidUserId } from '@lawprotect/shared-ts';
import { TestCompositionRoot } from '../TestCompositionRoot';
import { SetUserRoleBodySchema } from '../../../src/domain/schemas/SetUserRoleSchema';
import { UserRole } from '../../../src/domain/enums/UserRole';

export const testSetUserRoleAdminHandler = async (evt: any) => {
  try {
    // Minimal content-type enforcement for tests
    if (evt.headers && evt.headers['Content-Type'] && evt.headers['Content-Type'] !== 'application/json') {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type must be application/json');
    }
    
    // Check if Content-Type header is missing for requests with body
    if (evt.body && (!evt.headers || !evt.headers['Content-Type'])) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type header is required');
    }

    // Extract path parameters
    const userId = evt.pathParameters?.id;
    if (!userId) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'User ID is required');
    }

    // Validate user ID format
    if (!isValidUserId(userId)) {
      throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
    }

    // Parse JSON body if string
    const rawBody = typeof evt.body === 'string' ? JSON.parse(evt.body) : (evt.body ?? {});
    
    // Zod validation to produce 422 on schema errors
    const body = SetUserRoleBodySchema.parse(rawBody);

    // Resolve actor info from auth/authorizer
    const actorRole = evt?.auth?.role || evt?.requestContext?.authorizer?.claims?.['custom:role'];
    const actorId = evt?.auth?.userId || evt?.requestContext?.authorizer?.claims?.['custom:user_id'];
    
    // Check authentication first (401 for unauthenticated users)
    if (!actorRole || !actorId) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 401, 'Authentication required');
    }

    // Validate admin role
    if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Admin privileges required');
    }

    // Extract request parameters
    const request = {
      userId: userId,
      role: body.role,
      reason: body.reason,
      actorRole: actorRole as UserRole,
      actorId: actorId
    };

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.setUserRoleAdminUseCase.execute(
      request.userId,
      { role: request.role, reason: request.reason },
      request.actorRole,
      request.actorId
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return mapError(err);
  }
};
