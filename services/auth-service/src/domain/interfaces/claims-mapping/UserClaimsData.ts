/**
 * @fileoverview UserClaimsData - Interface for core user data in claims mapping
 * @summary Defines the structure for user data used in JWT claims mapping
 * @description This interface represents the core user data needed for building
 * JWT claims, including user ID, role, and account status.
 */

import { UserRole, UserAccountStatus } from '../../enums';
import { UserId } from '../../value-objects/UserId';

/**
 * Core user data for claims mapping
 */
export interface UserClaimsData {
  /** User ID from database */
  userId: UserId;
  /** User role from database */
  role: UserRole;
  /** User account status from database */
  status: UserAccountStatus;
}
