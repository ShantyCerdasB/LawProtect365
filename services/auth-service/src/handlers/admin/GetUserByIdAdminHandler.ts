/**
 * @fileoverview GetUserByIdAdminHandler - HTTP handler for user detail retrieval
 * @summary HTTP entry point for GET /admin/users/{id}
 * @description Handles HTTP requests for retrieving user details with admin permissions,
 * including optional includes for personal info and OAuth accounts.
 */

import { ControllerFactory, UserRoleEnum } from '@lawprotect/shared-ts';
import { GetUserByIdQuerySchema } from '../../domain/schemas/GetUserByIdSchema';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { GetUserByIdAdminUseCase } from '../../application/admin/GetUserByIdAdminUseCase';
import { UserRole } from '../../domain/enums/UserRole';

/**
 * HTTP handler for GET /admin/users/{id}
 * 
 * Provides user detail retrieval with admin permissions.
 * Supports optional includes for personal info and OAuth accounts.
 */
export const getUserByIdAdminHandler = ControllerFactory.createQuery({
  querySchema: GetUserByIdQuerySchema,
  
  appServiceClass: class {
    private readonly getUserByIdAdminUseCase: GetUserByIdAdminUseCase;
    
    constructor() {
      this.getUserByIdAdminUseCase = CompositionRoot.createGetUserByIdAdminUseCase();
    }
    
    async execute(params: { 
      userId: string;
      includes: string[] | undefined;
      viewerRole: string;
      viewerId: string;
    }) {
      return await this.getUserByIdAdminUseCase.execute(
        params.userId,
        (params.includes || []) as any,
        params.viewerRole as UserRole,
        params.viewerId
      );
    }
  },
  
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    userId: path.id,
    includes: query.include,
    viewerRole: context.auth.role,
    viewerId: context.auth.userId
  }),
  
  responseType: 'ok',
  transformResult: async (result: any) => result,
  
  requireAuth: true,
  requiredRoles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN],
  includeSecurityContext: true
});
