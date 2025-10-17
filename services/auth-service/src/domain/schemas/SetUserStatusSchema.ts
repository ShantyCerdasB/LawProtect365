/**
 * @fileoverview SetUserStatusSchema - Zod schemas for admin user status management
 * @summary Validation schemas for POST /admin/users/{id}:set-status endpoint
 * @description Provides Zod validation for user status change requests and responses
 */

import { z } from 'zod';
import { UserAccountStatus } from '../enums';

export const SetUserStatusBodySchema = z.object({
  status: z.nativeEnum(UserAccountStatus),
  reason: z.string().min(1).max(512).optional(),
  suspendUntil: z.string().datetime().optional()
}).refine((data) => {
  // Reason is required for SUSPENDED, INACTIVE, DELETED
  const statusesRequiringReason = [
    UserAccountStatus.SUSPENDED, 
    UserAccountStatus.INACTIVE, 
    UserAccountStatus.DELETED
  ];
  if (statusesRequiringReason.includes(data.status) && !data.reason) {
    return false;
  }
  return true;
}, {
  message: 'Reason is required for SUSPENDED, INACTIVE, and DELETED status',
  path: ['reason']
}).refine((data) => {
  // suspendUntil is only valid for SUSPENDED status
  if (data.suspendUntil && data.status !== UserAccountStatus.SUSPENDED) {
    return false;
  }
  return true;
}, {
  message: 'suspendUntil is only valid for SUSPENDED status',
  path: ['suspendUntil']
}).refine((data) => {
  // suspendUntil must be in the future
  if (data.suspendUntil) {
    const suspendDate = new Date(data.suspendUntil);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 180); // Max 180 days
    
    return suspendDate > now && suspendDate <= maxDate;
  }
  return true;
}, {
  message: 'suspendUntil must be in the future and within 180 days',
  path: ['suspendUntil']
});

export const SetUserStatusResponseSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(UserAccountStatus),
  suspendedUntil: z.string().datetime().optional(),
  deactivationReason: z.string().optional(),
  deletedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime()
});

export type SetUserStatusBody = z.infer<typeof SetUserStatusBodySchema>;
export type SetUserStatusResponse = z.infer<typeof SetUserStatusResponseSchema>;
