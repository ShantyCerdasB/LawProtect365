/**
 * @fileoverview RoleMiddleware - Role-based authorization middleware
 * @summary Role validation middleware for shared-ts
 * @description Provides role-based authorization validation using Cognito roles.
 * This middleware requires authentication context from AuthMiddleware.
 */

import type { BeforeMiddleware } from "../../http/middleware.js";
import { ForbiddenError, UnauthorizedError, ErrorCodes } from "../../errors/index.js";
import { normalizeRoles, hasRole } from "../../auth/roles.js";
import { VALID_COGNITO_ROLES } from "../../auth/validRoles.js";
import type { UserRole } from "../../types/auth.js";

/**
 * Role validation middleware
 * 
 * Validates that the authenticated user has at least one of the required roles.
 * Requires authentication context from AuthMiddleware.
 * 
 * @param requiredRoles - Array of required roles (user needs at least one)
 * @returns BeforeMiddleware that validates roles
 */
export const withRoleValidation = (requiredRoles: UserRole[]): BeforeMiddleware => {
  return (evt) => {
    // Check if authentication context exists
    const auth = (evt as any).auth;
    if (!auth) {
      throw new UnauthorizedError(
        "Authentication required for role validation",
        ErrorCodes.AUTH_UNAUTHORIZED
      );
    }

    // Check if user has roles
    if (!auth.roles || auth.roles.length === 0) {
      throw new ForbiddenError(
        `Insufficient permissions. Valid roles required: ${VALID_COGNITO_ROLES.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    // Normalize roles to canonical UserRole format
    const normalizedRoles = normalizeRoles(auth.roles);
    
    // Check if user has at least one required role
    const hasValidRole = requiredRoles.some(role => 
      hasRole(normalizedRoles, role)
    );

    if (!hasValidRole) {
      throw new ForbiddenError(
        `Insufficient permissions. Required roles: ${requiredRoles.join(", ")}. User roles: ${normalizedRoles.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    console.log(`✅ [ROLE DEBUG] Role validation successful. User has roles: ${normalizedRoles.join(", ")}`);
  };
};

/**
 * Minimum role validation middleware
 * 
 * Validates that the authenticated user has at least the minimum required role
 * in the hierarchy (customer < lawyer < admin < super_admin).
 * 
 * @param minimumRole - Minimum required role in hierarchy
 * @returns BeforeMiddleware that validates minimum role
 */
export const withMinimumRole = (minimumRole: UserRole): BeforeMiddleware => {
  return (evt) => {
    const auth = (evt as any).auth;
    if (!auth) {
      throw new UnauthorizedError(
        "Authentication required for role validation",
        ErrorCodes.AUTH_UNAUTHORIZED
      );
    }

    if (!auth.roles || auth.roles.length === 0) {
      throw new ForbiddenError(
        `Insufficient permissions. Valid roles required: ${VALID_COGNITO_ROLES.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    const normalizedRoles = normalizeRoles(auth.roles);
    
    // Import hasAtLeastRole from roles.ts
    const { hasAtLeastRole } = require("../../auth/roles.js");
    
    const hasMinimumRole = normalizedRoles.some(role => 
      hasAtLeastRole([role], minimumRole)
    );

    if (!hasMinimumRole) {
      throw new ForbiddenError(
        `Insufficient permissions. Minimum role required: ${minimumRole}. User roles: ${normalizedRoles.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    console.log(`✅ [ROLE DEBUG] Minimum role validation successful. User has roles: ${normalizedRoles.join(", ")}`);
  };
};

/**
 * Exact role validation middleware
 * 
 * Validates that the authenticated user has the exact specified role.
 * 
 * @param exactRole - Exact role required
 * @returns BeforeMiddleware that validates exact role
 */
export const withExactRole = (exactRole: UserRole): BeforeMiddleware => {
  return (evt) => {
    const auth = (evt as any).auth;
    if (!auth) {
      throw new UnauthorizedError(
        "Authentication required for role validation",
        ErrorCodes.AUTH_UNAUTHORIZED
      );
    }

    if (!auth.roles || auth.roles.length === 0) {
      throw new ForbiddenError(
        `Insufficient permissions. Valid roles required: ${VALID_COGNITO_ROLES.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    const normalizedRoles = normalizeRoles(auth.roles);
    
    const hasExactRole = hasRole(normalizedRoles, exactRole);

    if (!hasExactRole) {
      throw new ForbiddenError(
        `Insufficient permissions. Exact role required: ${exactRole}. User roles: ${normalizedRoles.join(", ")}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    console.log(`✅ [ROLE DEBUG] Exact role validation successful. User has role: ${exactRole}`);
  };
};
