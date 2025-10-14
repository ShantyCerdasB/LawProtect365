/**
 * @fileoverview ProviderLinkingStatus - Enum for provider linking status
 * @summary Defines the status of provider linking operations
 * @description Enum representing the different states of provider linking operations
 */

export enum ProviderLinkingStatus {
  /** Linking operation initiated */
  INITIATED = 'initiated',
  /** Linking operation completed successfully */
  COMPLETED = 'completed',
  /** Linking operation failed */
  FAILED = 'failed',
  /** Linking operation conflicted with existing account */
  CONFLICTED = 'conflicted',
  /** Linking operation already exists (idempotent) */
  ALREADY_LINKED = 'already_linked'
}
