/**
 * @fileoverview SetUserRoleAdminHandler - HTTP handler for role change operations
 * @summary HTTP entry point for POST /admin/users/{id}:set-role
 * @description Handles HTTP requests for changing user roles with admin permissions,
 * including validation, authorization, and response formatting.
 */

import { ControllerFactory, UserRoleEnum } from '@lawprotect/shared-ts';
import { SetUserRoleBodySchema } from '../../domain/schemas/SetUserRoleSchema';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { SetUserRoleAdminUseCase } from '../../application/admin/SetUserRoleAdminUseCase';

/**
 * HTTP handler for changing user roles
 * 
 * Handles POST /admin/users/{id}:set-role requests with:
 * - Request validation
 * - Admin authorization
 * - Role change orchestration
 * - Response formatting
 */
export const setUserRoleAdminHandler = ControllerFactory.createCommand({
  bodySchema: SetUserRoleBodySchema,
  appServiceClass: class {
    private readonly setUserRoleAdminUseCase: SetUserRoleAdminUseCase;
    
    constructor() {
      this.setUserRoleAdminUseCase = CompositionRoot.createSetUserRoleAdminUseCase();
    }
    
    async execute(params: any) {
      return await this.setUserRoleAdminUseCase.execute(
        params.userId,
        {
          role: params.role,
          reason: params.reason
        },
        params.actorRole,
        params.actorId
      );
    }
  },
  extractParams: (path: any, body: any, _query: any, context: any) => ({
    userId: path.id,
    role: body.role,
    reason: body.reason,
    actorRole: context.auth.role,
    actorId: context.auth.userId
  }),
  responseType: 'ok',
  transformResult: async (result: any) => result,
  requireAuth: true,
  requiredRoles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN],
  includeSecurityContext: true
});
