/**
 * @fileoverview UserProfileResponseDto - Response DTO for GET /me endpoint
 * @summary Type definitions for user profile response data
 * @description Defines the structure of user profile data returned by the GET /me endpoint,
 * including conditional fields based on include flags.
 */

import { UserRole, UserAccountStatus } from '../../domain/enums';
import { MfaStatus, IdentityInfo, PersonalInfo, ProviderInfo, MetaInfo, ClaimsInfo } from '../../domain/interfaces';

/**
 * Main response DTO for GET /me endpoint
 * Contains user profile information with conditional fields
 */
export interface UserProfileResponseDto {
  id: string;
  email: string;
  name: string;
  givenName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserAccountStatus;
  mfa: MfaStatus;
  identity: IdentityInfo;
  providers?: ProviderInfo[];
  personalInfo?: PersonalInfo;
  meta: MetaInfo;
  claims?: ClaimsInfo;
}

/**
 * Response wrapper for GET /me endpoint
 * Includes user data and optional headers
 */
export interface GetMeResponse {
  user: UserProfileResponseDto;
  headers?: Record<string, string>;
}

/**
 * Input parameters for GetMeUseCase
 */
export interface GetMeInput {
  cognitoSub: string;
  includeFlags: string;
}

/**
 * Result from GetMeUseCase execution
 */
export interface GetMeResult {
  user: UserProfileResponseDto;
  headers?: Record<string, string>;
}
