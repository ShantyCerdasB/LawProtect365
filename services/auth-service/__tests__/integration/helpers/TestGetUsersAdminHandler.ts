/**
 * @fileoverview TestGetUsersAdminHandler - Test-specific handler for GET /admin/users endpoint
 * @summary Handler for integration tests that uses TestCompositionRoot
 * @description This handler is specifically designed for integration tests,
 * using TestCompositionRoot to ensure proper test isolation and mocked dependencies.
 */

import { AppError, ErrorCodes, mapError } from '@lawprotect/shared-ts';
import { TestCompositionRoot } from '../TestCompositionRoot';
import { AdminUserQuerySchema } from '../../../src/domain/schemas/AdminUserQuerySchema';
import { UserRole } from '../../../src/domain/enums/UserRole';

export const testGetUsersAdminHandler = async (evt: any) => {
  try {
    // Zod validation for query parameters
    const query = AdminUserQuerySchema.parse(evt.queryStringParameters || {});

    // Resolve viewer info from auth/authorizer
    const viewerRole = evt?.auth?.role || evt?.requestContext?.authorizer?.claims?.['custom:role'];
    const viewerId = evt?.auth?.userId || evt?.requestContext?.authorizer?.claims?.['custom:user_id'];
    
    // Check authentication first (401 for unauthenticated users)
    if (!viewerRole || !viewerId) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 401, 'Authentication required');
    }

    // Validate admin role
    if (viewerRole !== UserRole.ADMIN && viewerRole !== UserRole.SUPER_ADMIN) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, 'Admin privileges required');
    }

    // Extract request parameters
    const request = {
      query: query,
      viewerRole: viewerRole as UserRole,
      viewerId: viewerId
    };

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.getUsersAdminUseCase.execute(
      request.query,
      request.viewerRole
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

