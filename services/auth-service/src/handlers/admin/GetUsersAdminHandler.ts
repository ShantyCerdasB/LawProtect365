import { ControllerFactory } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { AdminUserQuerySchema } from '../../domain/schemas/AdminUserQuerySchema';
import { GetUsersAdminUseCase } from '../../application/admin/GetUsersAdminUseCase';
import { AdminUserQuery } from '../../domain/interfaces/admin';

export const getUsersAdminHandler = ControllerFactory.createQuery({
  querySchema: AdminUserQuerySchema,
  
  appServiceClass: class {
    private readonly getUsersAdminUseCase: GetUsersAdminUseCase;
    
    constructor() {
      this.getUsersAdminUseCase = CompositionRoot.createGetUsersAdminUseCase();
    }
    
    async execute(params: { 
      request: AdminUserQuery; 
      securityContext: { role: string; userId: string } 
    }) {
      return await this.getUsersAdminUseCase.execute(
        params.request, 
        params.securityContext.role as any
      );
    }
  },
  
  extractParams: (_path: any, _body: any, query: any, context: any) => ({
    request: {
      q: query.q,
      role: query.role,
      status: query.status,
      mfa: query.mfa,
      provider: query.provider,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      lastLoginFrom: query.lastLoginFrom,
      lastLoginTo: query.lastLoginTo,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      include: query.include,
      limit: query.limit,
      cursor: query.cursor
    },
    securityContext: {
      role: context.auth.role,
      userId: context.auth.userId
    }
  }),
  
  responseType: 'ok',
  transformResult: async (result: any) => result,
  
  requireAuth: true,
  requiredRoles: ['admin', 'super_admin'],
  includeSecurityContext: true
});
