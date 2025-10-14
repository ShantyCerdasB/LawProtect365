/**
 * @fileoverview UserServiceTypes - Type definitions for UserService operations
 * @summary Defines input and result types for user service operations
 * @description This file contains type definitions for UserService operations,
 * including input parameters and result types for user management operations.
 */

import { UserRole } from '../domain/enums/UserRole';

/**
 * Input for upsertOnPostAuth operation
 */
export interface UpsertOnPostAuthInput {
  /** Cognito subject identifier */
  cognitoSub: string;
  /** User email address */
  email?: string;
  /** User given name */
  givenName?: string;
  /** User family name */
  familyName?: string;
  /** MFA enabled status */
  mfaEnabled: boolean;
  /** Intended user role */
  intendedRole?: UserRole;
}

/**
 * Result of upsertOnPostAuth operation
 */
export interface UpsertOnPostAuthResult {
  /** The user entity */
  user: any;
  /** Whether the user was created (true) or updated (false) */
  created: boolean;
  /** Whether MFA status changed */
  mfaChanged: boolean;
}

/**
 * Input for linkProviderIdentities operation
 */
export interface LinkProviderIdentitiesInput {
  /** User ID to link identities to */
  userId: string;
  /** Array of provider identities */
  identities: Array<{
    /** OAuth provider */
    provider: string;
    /** Provider account ID */
    providerAccountId: string;
  }>;
}
