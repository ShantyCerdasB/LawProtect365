/**
 * @fileoverview ProviderUnlinkingStatus - Enum for provider unlinking status
 * @summary Defines the status of a provider unlinking operation
 * @description This enum represents the possible outcomes when unlinking an OAuth provider
 * from a user account, including success, failure, and conflict states.
 */

export enum ProviderUnlinkingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  CONFLICT = 'conflict',
  NOT_FOUND = 'not_found',
  NOT_ALLOWED = 'not_allowed'
}
