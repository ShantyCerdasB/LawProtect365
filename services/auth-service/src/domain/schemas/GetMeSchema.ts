/**
 * @fileoverview GetMeSchema - Validation schemas for GET /me endpoint
 * @summary Zod schemas for GetMe query parameters and response validation
 * @description Provides validation schemas for the GetMe endpoint including
 * query parameter validation for include flags and response structure validation.
 */

import { z } from 'zod';

/**
 * Schema for GET /me query parameters
 * Validates the include parameter for conditional data inclusion
 */
export const GetMeQuerySchema = z.object({
  include: z.string()
    .optional()
    .refine(
      (val) => !val || /^(idp|profile|claims)(,(idp|profile|claims))*$/.test(val),
      { message: "Include must be comma-separated values: idp, profile, claims" }
    )
    .transform((val) => val || '')
});

/**
 * Schema for GET /me response validation
 * Ensures response structure matches API contract
 */
export const GetMeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    givenName: z.string().nullable(),
    lastName: z.string().nullable(),
    role: z.enum(['CUSTOMER', 'LAWYER', 'ADMIN', 'SUPER_ADMIN', 'UNASSIGNED']),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'PENDING_VERIFICATION']),
    mfa: z.object({
      required: z.boolean(),
      enabled: z.boolean()
    }),
    identity: z.object({
      cognitoSub: z.string()
    }),
    providers: z.array(z.object({
      provider: z.enum(['GOOGLE', 'MICROSOFT_365', 'APPLE', 'COGNITO']),
      linkedAt: z.string().datetime()
    })).optional(),
    personalInfo: z.object({
      phone: z.string().nullable(),
      locale: z.string().nullable(),
      timeZone: z.string().nullable()
    }).optional(),
    meta: z.object({
      lastLoginAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    }),
    claims: z.object({
      role: z.string(),
      account_status: z.string(),
      is_mfa_required: z.boolean(),
      mfa_enabled: z.boolean(),
      user_id: z.string().uuid()
    }).optional()
  }),
  headers: z.record(z.string()).optional()
});

/**
 * Type definitions derived from schemas
 */
export type GetMeQuery = z.infer<typeof GetMeQuerySchema>;
export type GetMeResponse = z.infer<typeof GetMeResponseSchema>;
