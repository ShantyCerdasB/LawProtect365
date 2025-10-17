/**
 * @fileoverview SetUserRoleSchema - Zod schemas for role change operations
 * @summary Validation schemas for POST /admin/users/{id}:set-role
 * @description Provides Zod schemas for validating role change requests and responses
 */

import { z } from 'zod';
import { UserRole } from '../enums/UserRole';

/**
 * Request body schema for role change
 */
export const SetUserRoleBodySchema = z.object({
  role: z.enum([
    UserRole.CUSTOMER,
    UserRole.LAWYER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.EXTERNAL_USER
  ]),
  reason: z.string().min(1).max(512).optional()
});

/**
 * Request interface for role change
 */
export interface SetUserRoleRequest {
  role: UserRole;
  reason?: string;
}

/**
 * Response interface for role change
 */
export interface SetUserRoleResponse {
  id: string;
  role: UserRole;
  mfa: {
    required: boolean;
  };
  meta: {
    updatedAt: string;
  };
}
