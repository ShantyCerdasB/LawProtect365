import { AppError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * Ensures the mutation tenant matches the caller tenant context.
 */
export const assertTenantBoundary = (ctxTenantId?: string, resourceTenantId?: string): void => {
  if (!ctxTenantId || !resourceTenantId || ctxTenantId !== resourceTenantId) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Tenant boundary violation");
  }
};

export const belongsToTenant = (resourceTenantId: string, tenantId: string): boolean =>
  resourceTenantId === tenantId;