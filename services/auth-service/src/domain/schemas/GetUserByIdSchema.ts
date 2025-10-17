/**
 * @fileoverview GetUserByIdSchema - Zod schemas for user detail operations
 * @summary Validation schemas for GET /admin/users/{id}
 * @description Provides Zod schemas for validating user detail requests and responses
 */

import { z } from 'zod';
import { AdminIncludeField } from '../enums/AdminIncludeField';
import { UserRole } from '../enums/UserRole';
import { UserAccountStatus } from '../enums/UserAccountStatus';
import { OAuthProvider } from '../enums/OAuthProvider';

/**
 * Query parameters schema for user detail
 */
export const GetUserByIdQuerySchema = z.object({
  include: z.string().optional().transform(val => 
    val ? val.split(',').map(i => i.trim() as AdminIncludeField) : undefined
  )
});

/**
 * Query parameters interface
 */
export interface GetUserByIdQuery {
  include?: AdminIncludeField[];
}

/**
 * Response interface for user detail
 */
export interface GetUserByIdResponse {
  id: string;
  cognitoSub: string;
  email: string;
  name: string;
  givenName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserAccountStatus;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  suspendedUntil: string | null;
  deactivationReason: string | null;
  createdAt: string;
  updatedAt: string;
  personalInfo?: {
    phone: string | null;
    locale: string;
    timeZone: string;
  };
  providers?: Array<{
    provider: OAuthProvider;
    linkedAt: string;
  }>;
}
