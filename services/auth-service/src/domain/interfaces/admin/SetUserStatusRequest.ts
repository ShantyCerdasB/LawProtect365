/**
 * @fileoverview SetUserStatusRequest - Interface for admin user status change request
 * @summary Request interface for POST /admin/users/{id}:set-status
 * @description Defines the structure for user status change requests in admin operations
 */

import { UserAccountStatus } from '../../enums';

export interface SetUserStatusRequest {
  status: UserAccountStatus;
  reason?: string;
  suspendUntil?: string; // ISO-8601
}
