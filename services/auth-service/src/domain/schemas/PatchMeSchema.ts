/**
 * @fileoverview PatchMeSchema - Zod schemas for user profile updates
 * @summary Validation schemas for PATCH /me
 * @description Provides Zod schemas for validating user profile update requests and responses
 */

import { z } from 'zod';

/**
 * Personal info schema for profile updates
 */
const PersonalInfoSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format').optional(),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in BCP47 format (e.g., es-CR)').optional(),
  timeZone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'TimeZone must be in IANA format (e.g., America/Costa_Rica)').optional()
});

/**
 * Request body schema for PATCH /me
 */
export const PatchMeBodySchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  givenName: z.string().min(0).max(60).trim().optional(),
  lastName: z.string().min(0).max(60).trim().optional(),
  personalInfo: PersonalInfoSchema.optional()
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  },
  {
    message: 'At least one field must be provided',
    path: ['body']
  }
);

/**
 * Request interface
 */
export interface PatchMeRequest {
  name?: string;
  givenName?: string;
  lastName?: string;
  personalInfo?: {
    phone?: string;
    locale?: string;
    timeZone?: string;
  };
}

/**
 * Response interface for PATCH /me
 */
export interface PatchMeResponse {
  id: string;
  email: string;
  name: string;
  givenName: string | null;
  lastName: string | null;
  personalInfo: {
    phone: string | null;
    locale: string | null;
    timeZone: string | null;
  };
  meta: {
    updatedAt: string;
    changed: boolean;
  };
}
