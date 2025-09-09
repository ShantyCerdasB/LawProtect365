import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/codes.js";

/**
 * Ensures the mutation tenant matches the caller tenant context.
 */
export const assertTenantBoundary = (ctxTenantId?: string, resourceTenantId?: string): void => {
  // Handle undefined/null cases
  if (ctxTenantId === undefined || ctxTenantId === null || 
      resourceTenantId === undefined || resourceTenantId === null) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Tenant boundary violation");
  }
  
  // Handle empty string cases - both must be empty strings to be considered equal
  if (ctxTenantId === '' && resourceTenantId === '') {
    return; // Both empty strings are considered equal
  }
  
  // Handle non-empty string comparison
  if (ctxTenantId !== resourceTenantId) {
    throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 403, "Tenant boundary violation");
  }
};

export const belongsToTenant = (resourceTenantId: string, tenantId: string): boolean =>
  resourceTenantId === tenantId;






