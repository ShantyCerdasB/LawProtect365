/**
 * @fileoverview SetUserStatusAdminHandler - HTTP handler for admin user status changes
 * @summary Handles POST /admin/users/{id}:set-status endpoint
 * @description HTTP entry point for changing user status in admin operations
 */

import { ControllerFactory, UserRole } from '@lawprotect/shared-ts';
import { SetUserStatusBodySchema } from '../../domain/schemas/SetUserStatusSchema';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { SetUserStatusAdminUseCase } from '../../application/admin/SetUserStatusAdminUseCase';

export const setUserStatusAdminHandler = ControllerFactory.createCommand({
  bodySchema: SetUserStatusBodySchema,

  appServiceClass: class {
    private readonly setUserStatusAdminUseCase: SetUserStatusAdminUseCase;

    constructor() {
      this.setUserStatusAdminUseCase = CompositionRoot.createSetUserStatusAdminUseCase();
    }

    async execute(params: any) {
      return await this.setUserStatusAdminUseCase.execute(
        params.userId,
        {
          status: params.status,
          reason: params.reason,
          suspendUntil: params.suspendUntil
        },
        params.actorRole,
        params.actorId
      );
    }
  },

  extractParams: (path: any, body: any, _query: any, context: any) => ({
    userId: path.id,
    status: body.status,
    reason: body.reason,
    suspendUntil: body.suspendUntil,
    actorRole: context.auth.role,
    actorId: context.auth.userId
  }),

  responseType: 'ok',
  transformResult: async (result: any) => result,

  requireAuth: true,
  requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  includeSecurityContext: true
});
