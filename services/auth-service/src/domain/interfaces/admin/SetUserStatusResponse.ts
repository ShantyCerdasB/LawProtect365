/**
 * @fileoverview SetUserStatusResponse - Interface for admin user status change response
 * @summary Response interface for POST /admin/users/{id}:set-status
 * @description Defines the structure for user status change responses in admin operations
 */

import { UserAccountStatus } from '../../enums';

export interface SetUserStatusResponse {
  id: string;
  status: UserAccountStatus;
  suspendedUntil?: string; // ISO-8601
  deactivationReason?: string;
  deletedAt?: string; // ISO-8601
  updatedAt: string; // ISO-8601
}
